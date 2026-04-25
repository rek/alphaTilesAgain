## Context

No Java analog. Pure new CI infrastructure.

`libs/shared/storybook-host/` is the existing Storybook host library. Stories live in `libs/**/*.stories.tsx` and are discovered automatically by the test-runner's default glob.

### Required reading for implementers

- `AGENTS.md`
- `openspec/AGENT_PROTOCOL.md`
- `docs/ARCHITECTURE.md`
- `docs/decisions/ADR-010-testing-storybook-plus-unit.md`
- `libs/shared/storybook-host/` — storybook config and scripts
- Storybook test-runner docs: https://storybook.js.org/docs/writing-tests/test-runner
- Playwright snapshot docs: https://playwright.dev/docs/test-snapshots

## Goals / Non-Goals

**Goals:**
- Screenshot every story on every non-draft PR.
- Fail PR if any story differs from baseline by > 0.1% pixels.
- Upload diff PNGs as CI artifacts so reviewer can inspect failures.
- Keep baseline update a deliberate, human-triggered action.

**Non-Goals:**
- Cross-browser testing (Chromium only).
- On-device or Expo Go screenshot capture.
- Automated baseline commits (no unattended git push).
- Performance or interaction snapshots.

## Decisions

### D1. Renderer choice — Playwright via @storybook/test-runner

`@storybook/test-runner` wraps Jest + Playwright. It navigates to each story URL, waits for render, and exposes `page` for screenshot. This is the officially supported Storybook visual testing path and requires no custom harness.

### D2. Baseline storage — committed PNGs at `storybook-baselines/<story-id>.png`

Baselines are plain PNG files committed to `storybook-baselines/` at repo root. Story ID is the kebab-case identifier Storybook uses in the URL (`<component-id>--<story-name>`). Plain Git is acceptable at current story volume; revisit LFS if total baseline size exceeds 50 MB.

### D3. Diff threshold — 0.1%

`pixelmatch` threshold of `0.001` (≤ 0.1% of total pixels) tolerates sub-pixel anti-aliasing differences across environments while catching real regressions. Configured in the test-runner's `jest-setup.ts`.

### D4. Update workflow — `npm run capture-storybook-baselines`

A local script builds storybook-host, starts the server, runs the test-runner with `--update-snapshots`, and writes new PNGs to `storybook-baselines/`. The developer reviews the diff in git before committing. A manual CI workflow trigger (`workflow_dispatch`) allows updating baselines from CI without a local Storybook build.

### D5. PR draft gating

The CI job includes `if: github.event.pull_request.draft == false`. Draft PRs are fully skipped — no Playwright install, no storybook build — to avoid burning CI minutes on WIP.

### D6. Artifact upload on failure

The `upload-artifact` step runs with `if: failure()`. It uploads the entire `storybook-baselines/__diff_output__/` directory so reviewers can download and inspect the pixel-diff images without re-running locally.

### D7. Viewport size — single 390×844 in v1

All screenshots use a fixed 390×844 px viewport (iPhone 14 logical size). A single viewport keeps baseline count and CI time linear with story count. Multi-viewport or responsive testing is out of scope for v1.

## Unresolved Questions

- Should the CI job also run on `push` to `main` to keep baselines verifiably passing on the default branch?
- Should `storybook-baselines/` be added to `.gitattributes` for diff suppression even without LFS?
