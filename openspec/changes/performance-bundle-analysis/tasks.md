# Tasks

Implement CI bundle-size gate and manual TTI profiling workflow.

## 0. Preflight

- [ ] Read `proposal.md` and `design.md`.
- [ ] Inspect `apps/alphaTiles/project.json` — confirm `build` target and `expo export` invocation.
- [ ] Confirm `.github/workflows/` directory exists; list existing workflow files to avoid name collisions with `ci-per-language-builds`.
- [ ] Confirm `bundlesize` not already present in root `package.json` devDependencies.

## 1. Bundle Producer

- [ ] Run `npx expo export --platform android` locally; confirm `dist/_expo/static/js/android/*.js` glob matches the output chunk.
- [ ] Document exact command in `design.md` D1 if output path differs.
- [ ] Verify `nx build alphaTiles --configuration=production` produces equivalent output.

## 2. Bundlesize Config

- [ ] Add `bundlesize` to root `package.json` devDependencies.
- [ ] Create `bundlesize.config.json` at repo root per design D2 (android glob, 4 MB gzip threshold).
- [ ] Run `npx bundlesize` locally against an exported bundle; confirm pass/fail output is readable.
- [ ] Add iOS entry to `bundlesize.config.json` with matching 4 MB threshold if `expo export --platform ios` produces a separate measurable chunk.

## 3. CI Gate Workflow

- [ ] Create `.github/workflows/bundle-size.yml` with trigger `pull_request` targeting `main`.
- [ ] Job `measure` steps: checkout → setup Node → `npm ci` → `npx expo export --platform android` → `npx bundlesize`.
- [ ] Add job `update-baseline` triggered on `push` to `main`: exports bundle and saves as GHA cache `bundle-main-<github.sha>`.
- [ ] Confirm workflow filename does not collide with any workflow added by `ci-per-language-builds`.

## 4. PR Comment

- [ ] In `bundle-size.yml`, add step after `bundlesize`: restore cached main-branch bundle size from cache.
- [ ] Compute delta (current size minus baseline); handle cache-miss gracefully (print "baseline unavailable").
- [ ] Post/update PR comment via `gh pr comment --edit-last` with size + delta table.
- [ ] Ensure comment step runs even when `bundlesize` step fails (use `if: always()`).

## 5. TTI Workflow (Manual)

- [ ] Create `.github/workflows/tti-profiling.yml` with trigger `workflow_dispatch`.
- [ ] Job runs on `macos-latest`; boots iOS simulator; builds app in dev mode.
- [ ] Capture TTI via `react-native-performance` — confirm package is available in dev deps or add it.
- [ ] Upload TTI result JSON as GHA artifact (7-day retention).
- [ ] Workflow has no blocking effect on PRs — add comment in YAML: `# manual trigger only — does not gate PRs`.

## 6. Verification

- [ ] Open a test PR that increases a file size beyond threshold; confirm CI fails and comment posts.
- [ ] Open a test PR within threshold; confirm CI passes and comment posts with size + delta.
- [ ] Merge to main; confirm `update-baseline` job runs and cache is written.
- [ ] Manually trigger `tti-profiling.yml` from GHA UI; confirm artifact is uploaded.
- [ ] Lint YAML: `npx actionlint .github/workflows/bundle-size.yml .github/workflows/tti-profiling.yml`.
