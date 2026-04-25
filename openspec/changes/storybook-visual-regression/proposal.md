## Why

UI components in `libs/` are developed and reviewed without a safety net against visual regressions. A renamed style prop, a layout tweak, or a dependency bump can silently break a story's appearance — no test catches it until a human notices in review.

Storybook's test-runner with Playwright screenshot comparison provides automated pixel-diff coverage on every PR, catching regressions before merge at near-zero developer overhead.

## What Changes

- Add `@storybook/test-runner` + Playwright as dev deps.
- Add `storybook-baselines/` at repo root — committed PNGs, one per story.
- Add `npm run capture-storybook-baselines` script to rebuild baselines.
- Add `.github/workflows/storybook-visual-regression.yml` CI job: build storybook-host, serve it, run test-runner, upload diff artifacts on failure.
- CI job is skipped on draft PRs.

## Capabilities

### New Capabilities

- `storybook-visual-regression` — automated pixel-diff comparison of every story on every non-draft PR; diff PNGs uploaded as CI artifacts on failure.

## Impact

- CI cost: ~3–6 min added per non-draft PR (Playwright headless, single viewport).
- Storage: baseline PNGs in-repo; size depends on story count — expect 200–800 KB total for current story set.
- No runtime impact; no app code changes.
- Baseline drift is opt-in: update only via `npm run capture-storybook-baselines` or manual CI trigger.

## Out of Scope

- Cross-browser parity (Chromium only in v1).
- Mobile-device screenshot capture in CI (single 390×844 viewport simulates mobile form factor).
- Performance/timing snapshots.
- Automated baseline commits (human reviews diff and commits).

## Unresolved Questions

- Should baseline PNGs live in Git LFS? Current story count makes plain Git acceptable; revisit if repo size grows past 50 MB from baselines.
- Should the CI job run on `push` to `main` in addition to PRs?
