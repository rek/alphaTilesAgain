## ADDED Requirements

### Requirement: PR build runs bundle measurement on every pull request

The CI system SHALL run `expo export` followed by `bundlesize` on every pull request targeting `main`. The measurement step SHALL complete before the PR is mergeable.

#### Scenario: Bundle measurement runs on PR open

- **GIVEN** a pull request is opened or updated against `main`
- **WHEN** the `bundle-size` CI workflow is triggered
- **THEN** the workflow runs `expo export --platform android` producing a JS bundle in `dist/`
- **AND** `bundlesize` is invoked against the produced bundle

### Requirement: Compressed JS size compared against 4 MB threshold

`bundlesize` SHALL compare the gzip-compressed size of the Android JS bundle against a 4 MB threshold defined in `bundlesize.config.json`. The threshold file SHALL be committed to the repo root and SHALL be the single source of truth for the limit.

#### Scenario: Bundle within threshold

- **GIVEN** the compressed Android JS bundle is at or below 4 MB
- **WHEN** `bundlesize` runs
- **THEN** the bundlesize step exits with code 0
- **AND** the CI job reports success

#### Scenario: Bundle exceeds threshold

- **GIVEN** the compressed Android JS bundle exceeds 4 MB
- **WHEN** `bundlesize` runs
- **THEN** the bundlesize step exits with a non-zero code
- **AND** the CI job reports failure, blocking PR merge

### Requirement: Build fails when bundle exceeds threshold

The `bundle-size` workflow job SHALL fail when the compressed JS size exceeds the configured threshold, preventing merge of the offending PR.

#### Scenario: Oversized bundle blocks PR

- **GIVEN** `bundlesize` exits non-zero on a PR
- **WHEN** branch protection checks are evaluated
- **THEN** the PR is not mergeable until the bundle is reduced below threshold or the threshold is explicitly raised via a config change in the same PR

### Requirement: PR receives a comment with size and delta vs main

After `bundlesize` runs (pass or fail), the workflow SHALL post or update a PR comment containing the current compressed bundle size and the delta relative to the main branch baseline.

#### Scenario: Comment posted with baseline available

- **GIVEN** a cached main-branch bundle size exists
- **WHEN** the bundle measurement step completes
- **THEN** a PR comment is posted (or updated via `--edit-last`) containing current size and signed delta (e.g. `+12 KB` or `-8 KB`)

#### Scenario: Comment posted without baseline

- **GIVEN** no cached main-branch bundle size is available (cache miss)
- **WHEN** the bundle measurement step completes
- **THEN** a PR comment is posted containing current size and the text "baseline unavailable"

#### Scenario: Comment posts even when bundle fails threshold

- **GIVEN** `bundlesize` exits non-zero
- **WHEN** the comment step runs
- **THEN** the comment is still posted (step runs with `if: always()`)

### Requirement: Manual TTI workflow exists and does not block PRs

A separate `tti-profiling.yml` workflow SHALL exist with a `workflow_dispatch` trigger. It SHALL capture time-to-interactive on the app boot flow using `react-native-performance` in an iOS simulator and upload the result as a GHA artifact. It SHALL NOT be a required status check and SHALL NOT block PR merge.

#### Scenario: TTI workflow is manually triggered

- **GIVEN** a user manually triggers `tti-profiling.yml` from the GHA UI
- **WHEN** the workflow runs
- **THEN** it boots the app in an iOS simulator, captures TTI data, and uploads a JSON artifact
- **AND** the artifact is retained for 7 days

#### Scenario: TTI workflow absence does not block PR

- **GIVEN** a PR is open and the TTI workflow has not been run
- **WHEN** branch protection checks are evaluated
- **THEN** the absence of a TTI workflow result does NOT prevent merge

### Requirement: Main branch baseline updated on merge

When a PR is merged to `main`, the `bundle-size` workflow SHALL run `expo export` on the merged commit and cache the resulting bundle size under the key `bundle-main-<sha>` for use as the baseline in future PR comparisons.

#### Scenario: Baseline cache written after merge

- **GIVEN** a PR is merged to `main`
- **WHEN** the `update-baseline` job in `bundle-size.yml` runs on the resulting push to `main`
- **THEN** the compressed bundle size is saved to GHA cache with key `bundle-main-<github.sha>`
- **AND** subsequent PRs can restore this cache as their baseline
