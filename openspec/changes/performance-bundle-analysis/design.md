## Context

No Java analog. The legacy Android app had no CI bundle-size gate.

Bundle measurement is pure CI infrastructure; no app source changes.

### Required reading for implementers

- `AGENTS.md`
- `openspec/AGENT_PROTOCOL.md`
- `docs/ARCHITECTURE.md` — understand NX project graph and build targets
- `apps/alphaTiles/project.json` — locate existing `build` and `export` NX targets
- Expo export docs: https://docs.expo.dev/more/expo-cli/#exporting
- bundlesize: https://github.com/siddharthkp/bundlesize
- react-native-performance: https://github.com/oblador/react-native-performance

### Workflow filename collision note

`ci-per-language-builds` (sibling change) also adds GHA workflow files. Use distinct names:
- This change: `bundle-size.yml`, `tti-profiling.yml`
- `ci-per-language-builds` owns its own names (check that change's spec before merging).

## Goals / Non-Goals

**Goals:**
- Fail PRs when compressed JS bundle exceeds 4 MB.
- Post PR comment with current size and delta vs main.
- Provide a manual TTI profiling workflow (non-blocking).
- Document which NX/Expo commands produce the bundle.

**Non-Goals:**
- Native binary (APK/IPA) size tracking.
- Automatic TTI in CI.
- Runtime memory or CPU profiling.
- Lighthouse on web build.
- Per-chunk thresholds (v1: total only).

## Decisions

### D1. Bundle producer

`expo export` is the canonical production bundle command. It produces a `dist/` folder containing the Hermes bytecode bundle. Use `npx expo export --platform android` (and iOS separately if needed). `nx build alphaTiles --configuration=production` delegates to `expo export` under the hood — either form is acceptable; the workflow uses `expo export` directly for reproducibility.

### D2. Measurement tool — bundlesize config

`bundlesize` reads `bundlesize.config.json` at repo root:

```json
{
  "files": [
    {
      "path": "dist/_expo/static/js/android/*.js",
      "maxSize": "4 MB",
      "compression": "gzip"
    }
  ]
}
```

The glob targets the Android JS chunk produced by `expo export`. Add an iOS entry if the iOS bundle is tracked separately in future.

### D3. Threshold — 4 MB compressed

Initial threshold is 4 MB gzip-compressed JS. This is intentionally generous for v1; tighten incrementally as tree-shaking and lazy loading improve. Changing the threshold requires a PR modifying `bundlesize.config.json` — no silent overrides.

### D4. PR comment via gh CLI

The `bundle-size.yml` workflow uses `gh pr comment` to post size + delta. Delta is computed by downloading the main-branch bundle artifact (if cached) and comparing sizes. Comment is updated (not re-posted) on each subsequent push to the same PR via `--edit-last`.

### D5. TTI workflow — manual trigger only

`tti-profiling.yml` uses `workflow_dispatch` trigger. It requires an iOS simulator; not guaranteed on standard GHA runners. The workflow captures boot-flow TTI via `react-native-performance` instrumentation already present in the app (added as a dev-only annotation). Output is uploaded as a GHA artifact. Does not post to PR; does not block merge.

### D6. Baseline strategy — diff vs main

On PR runs, the workflow attempts to restore a cached bundle from the `main` branch (cache key: `bundle-main-<sha>`). If cache miss, delta is reported as "baseline unavailable." Main-branch bundle is written to cache on every merge to `main` via a separate job in `bundle-size.yml`.

### D7. Artifact retention

Bundles produced in CI are uploaded as GHA artifacts with 7-day retention. This avoids large storage costs while giving enough window for retries and comparisons.

## Unresolved Questions

- macOS runner cost for TTI workflow: confirm `macos-latest` is available and cost-acceptable before enabling on a schedule.
- Should the PR comment fail-fast (job fails immediately on threshold breach) or report-then-fail? Current plan: report first, then fail the job step, so the comment always posts even when failing.
- Per-platform (android vs iOS) separate thresholds in v2?
