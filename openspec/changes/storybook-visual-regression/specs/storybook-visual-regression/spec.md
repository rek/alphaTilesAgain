## ADDED Requirements

### Requirement: Every story has a committed baseline image

`storybook-baselines/` at repo root SHALL contain one PNG file per Storybook story, named by the story's kebab-case ID (`<component-id>--<story-name>.png`). A story with no corresponding baseline SHALL cause the test-runner to fail.

#### Scenario: Missing baseline is a failure

- **GIVEN** a story file `libs/foo/ui-bar/src/lib/Bar.stories.tsx` exports a story named `Default`
- **WHEN** `storybook-baselines/ui-bar-bar--default.png` does not exist
- **THEN** the test-runner run exits non-zero

### Requirement: Test-runner compares each story to its baseline

The `@storybook/test-runner` SHALL screenshot every story at viewport 390×844 px and compare the result against the committed baseline PNG using `pixelmatch`.

#### Scenario: Story matches baseline

- **GIVEN** a story's rendered output is pixel-identical to its baseline
- **WHEN** the test-runner processes that story
- **THEN** the story's test case passes

#### Scenario: Story does not match baseline

- **GIVEN** a story's rendered output differs from its baseline by at least one differing pixel
- **WHEN** the test-runner processes that story
- **THEN** the story's test case fails
- **AND** a diff PNG is written to `storybook-baselines/__diff_output__/<story-id>.png`

### Requirement: PR fails when any story exceeds 0.1% pixel difference

The comparison threshold SHALL be set so that any story whose diff exceeds 0.1% of total pixels (i.e. `pixelmatch` `threshold: 0.001`) causes the test-runner to exit non-zero and therefore the CI job to fail.

#### Scenario: Diff within tolerance passes

- **GIVEN** a story's screenshot differs from baseline by ≤ 0.1% of total pixels (sub-pixel anti-aliasing)
- **WHEN** the test-runner compares the story
- **THEN** the test passes

#### Scenario: Diff exceeds tolerance fails

- **GIVEN** a story's screenshot differs from baseline by > 0.1% of total pixels
- **WHEN** the test-runner compares the story
- **THEN** the test fails

### Requirement: Diff PNGs are uploaded as CI artifacts on failure

When the CI visual regression job fails, the GitHub Actions workflow SHALL upload the contents of `storybook-baselines/__diff_output__/` as an artifact named `storybook-diffs`.

#### Scenario: Failure produces downloadable diff artifact

- **GIVEN** one or more story comparisons fail during a CI run
- **WHEN** the GitHub Actions job completes
- **THEN** an artifact named `storybook-diffs` is available for download from the Actions run summary
- **AND** the artifact contains a PNG diff image for each failing story

#### Scenario: Passing run produces no artifact

- **GIVEN** all story comparisons pass
- **WHEN** the GitHub Actions job completes
- **THEN** no `storybook-diffs` artifact is uploaded

### Requirement: Draft PRs are skipped

The CI visual regression job SHALL not execute on pull requests that are in draft state.

#### Scenario: Draft PR skips job

- **GIVEN** a pull request is marked as draft
- **WHEN** a commit is pushed to that PR
- **THEN** the `storybook-visual-regression` CI job is skipped (not failed, not queued)

#### Scenario: Non-draft PR runs job

- **GIVEN** a pull request is not in draft state
- **WHEN** a commit is pushed to that PR
- **THEN** the `storybook-visual-regression` CI job runs

### Requirement: Baseline update is opt-in only

Baseline PNGs SHALL only be updated through an explicit human action: either running `npm run capture-storybook-baselines` locally and committing, or triggering the `update-storybook-baselines` manual workflow dispatch. The standard CI visual regression job SHALL never overwrite baseline files.

#### Scenario: CI job does not mutate baselines

- **GIVEN** any non-draft PR triggers the visual regression CI job
- **WHEN** the job runs (pass or fail)
- **THEN** no baseline PNG in `storybook-baselines/` is modified, created, or deleted by the job

#### Scenario: Manual update workflow updates baselines

- **GIVEN** a developer triggers the `update-storybook-baselines` workflow dispatch on a branch
- **WHEN** the workflow completes successfully
- **THEN** updated baseline PNGs are committed to that branch
