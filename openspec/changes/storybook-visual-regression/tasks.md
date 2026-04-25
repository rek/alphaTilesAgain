# Tasks

Add CI visual regression testing for all Storybook stories.

## 0. Preflight

- [ ] Read `proposal.md` and `design.md`.
- [ ] Confirm `libs/shared/storybook-host/` has a working `build-storybook` script and a `start-storybook` (or `storybook dev`) command.
- [ ] Confirm existing stories compile: `nx run shared-storybook-host:storybook --dry-run` (or equivalent).
- [ ] Check `.github/workflows/` for any existing Storybook CI to avoid duplication.

## 1. Test Runner Setup

- [ ] Add dev deps to `libs/shared/storybook-host/package.json`: `@storybook/test-runner`, `@playwright/test`, `pixelmatch`, `pngjs`.
- [ ] Run `npx playwright install chromium` and add the install step to CI.
- [ ] Create `libs/shared/storybook-host/.storybook/test-runner.ts` with `beforeAll`/`afterAll` hooks (start/stop storybook server if needed) and `afterEach` screenshot comparison logic using `pixelmatch` at threshold `0.001`.
- [ ] Create `libs/shared/storybook-host/jest-storybook.config.js` (or extend existing jest config) pointing `testRunner` at `@storybook/test-runner`.
- [ ] Add `"test-storybook": "test-storybook --url http://localhost:6006"` script to `libs/shared/storybook-host/package.json`.
- [ ] Add `nx` target `test-storybook` in `libs/shared/storybook-host/project.json`.

## 2. Baseline Capture Script

- [ ] Create `scripts/capture-storybook-baselines.sh` at repo root.
  - Builds storybook-host (`nx run shared-storybook-host:build-storybook`).
  - Starts `http-server dist/storybook/shared/storybook-host` on port 6006.
  - Runs `test-storybook --url http://localhost:6006 --update-snapshots`.
  - Copies output PNGs to `storybook-baselines/`.
  - Kills the server on exit.
- [ ] Add `"capture-storybook-baselines": "bash scripts/capture-storybook-baselines.sh"` to root `package.json`.
- [ ] Create `storybook-baselines/.gitkeep` so the empty directory is tracked.
- [ ] Add `storybook-baselines/__diff_output__/` to `.gitignore` (diff artifacts are not committed).
- [ ] Run `npm run capture-storybook-baselines` locally and commit initial baseline PNGs.

## 3. CI Workflow

- [ ] Create `.github/workflows/storybook-visual-regression.yml`:
  - Trigger: `pull_request` (types: `opened`, `synchronize`, `reopened`).
  - Condition: `if: github.event.pull_request.draft == false`.
  - Steps:
    1. Checkout with full depth.
    2. Setup Node (match `.nvmrc` or `engines.node`).
    3. `npm ci`.
    4. `npx playwright install --with-deps chromium`.
    5. `nx run shared-storybook-host:build-storybook`.
    6. Start static server on port 6006 (background), wait for it.
    7. `npx test-storybook --url http://localhost:6006`.
    8. `uses: actions/upload-artifact` with `if: failure()`, path `storybook-baselines/__diff_output__/`, name `storybook-diffs`.

## 4. Update Workflow

- [ ] Create `.github/workflows/update-storybook-baselines.yml`:
  - Trigger: `workflow_dispatch` (manual only).
  - Steps mirror CI workflow but run with `--update-snapshots`.
  - Commit updated PNGs to the branch that triggered the dispatch using `git commit` + `git push`.
- [ ] Document the update flow in a comment block at the top of the workflow file.

## 5. Verification

- [ ] Run `npm run capture-storybook-baselines` on a clean checkout; confirm PNGs are generated in `storybook-baselines/`.
- [ ] Deliberately alter a story component (e.g., change a color), run `npx test-storybook --url http://localhost:6006`, confirm test fails with a diff image in `storybook-baselines/__diff_output__/`.
- [ ] Revert the alteration; confirm tests pass again.
- [ ] Open a non-draft PR; confirm the CI job runs and passes.
- [ ] Convert the PR to draft; confirm the CI job is skipped.
- [ ] Introduce a regression in a branch PR; confirm diff artifact is uploaded and downloadable from the Actions run.
