## Why

Bundle bloat goes undetected until a release ships. A CI gate measuring JS bundle size on every PR catches regressions at the point of change, before they reach users. Minority-language communities often run on mid-range hardware; a lean bundle directly affects load time.

## What Changes

- `bundlesize.config.json` at repo root defines the 4 MB compressed threshold.
- New GHA workflow `.github/workflows/bundle-size.yml` runs on every PR: invokes `expo export`, feeds the output to `bundlesize`, and posts a size + delta comment via `gh` CLI.
- New GHA workflow `.github/workflows/tti-profiling.yml` (manual trigger) runs `react-native-performance` TTI capture on the boot flow in an iOS simulator.
- NX target documentation: `nx build alphaTiles --configuration=production` and `expo export` are both called out as bundle producers.

## Capabilities

### New Capabilities

- `bundle-size-gate` — automated per-PR check; fails when compressed JS exceeds 4 MB; posts size + delta comment.
- `tti-profiling` — manual-trigger workflow capturing time-to-interactive on boot; result uploaded as artifact.

## Impact

- CI minutes: ~3–5 min per PR for bundle step (expo export + bundlesize).
- PRs are blocked when bundle exceeds threshold; unblocked only by shrinking the bundle or raising the threshold explicitly.
- No new runtime deps; `bundlesize` and `react-native-performance` are dev/CI-only.
- No changes to app source, NX lib graph, or game logic.

## Out of Scope

- Native binary size tracking (APK/IPA) — belongs in `ci-per-language-builds`.
- Runtime memory profiling.
- Lighthouse scoring on web build.
- Automated TTI in CI (simulator availability not guaranteed on standard runners).

## Unresolved Questions

- Should the threshold be per-chunk or total? Defaulting to total compressed JS for v1.
- Which GHA runner image supports the iOS simulator for TTI? TBD — workflow is manual-only until confirmed.
- Should baseline (main branch size) be stored as a GHA cache artifact or computed fresh each PR? Cache preferred but fallback to recompute needed.
