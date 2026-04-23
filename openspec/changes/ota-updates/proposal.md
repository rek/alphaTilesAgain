## Why

`ARCHITECTURE.md §13` and `ADR-009` commit the port to EAS Update with one channel per language pack. Nothing in the repo actually wires that up yet — `expo-updates` isn't installed, `app.config.ts` has no `runtimeVersion` or `updates` block, `eas.json` profiles don't declare a `channel`, and the boot flow doesn't call `Updates.checkForUpdateAsync()`. Shipping a pack fix to users today requires a full EAS Build + store submission, which defeats the point of the per-pack channel model. This change installs the plumbing so content-only fixes can ride OTA end-to-end.

## What Changes

- Add `expo-updates` as a runtime dependency and configure it in `apps/alphaTiles/app.config.ts`:
  - `updates.url` — EAS hosted endpoint (populated by `eas init`).
  - `updates.checkAutomatically = "NEVER"` — we run the check manually in the loading screen for full control over timing + UX.
  - `runtimeVersion.policy = "appVersion"` — binaries with matching `appVersion` can OTA each other; different `appVersion` forces a store update.
  - `extra.eas.projectId` populated by `eas init` as a prerequisite.
- Add a `channel` field to each language-pack profile in `eas.json` (`"channel": "eng"` for the `eng` profile, etc.). Shared profiles (`development`, `preview`, `production`) get no channel — they build locally-bundled assets.
- Add an update-check step to the boot flow (during the loading screen, after i18n init, before game-menu mount):
  - Skip entirely if `Updates.isEnabled === false` (development builds).
  - Call `Updates.checkForUpdateAsync()` with a 5-second timeout.
  - On `isAvailable === true`: `Updates.fetchUpdateAsync()` → `Updates.reloadAsync()`.
  - On no-update / timeout / error: log + continue boot normally.
- Fire three new analytics events at each transition point: `app_update_available`, `app_update_applied`, `app_update_failed`. Events land in `util-analytics`'s event catalog.
- Document the OTA-publish workflow and version-skew policy in `docs/GETTING_STARTED.md` (new section "Publishing OTA updates").
- `eas init` is a one-time manual prerequisite — the change documents the command and the post-run edit to `app.config.ts`, but does not run it.

## Capabilities

### New Capabilities

- `ota-updates`: the boot-time update check, channel-per-language wiring, runtime-version policy, and fallback behavior. Covers what gets delivered OTA vs. what requires a rebuild, and how the app handles each outcome.

### Modified Capabilities

- `analytics`: three new events added to the event catalog (`app_update_available`, `app_update_applied`, `app_update_failed`). Delta spec uses `## ADDED Requirements` — we're adding requirements/events to an existing capability, not changing any existing requirement's behavior.

## Impact

- **New runtime dep**: `expo-updates`.
- **Config changes**: `apps/alphaTiles/app.config.ts` gains `updates`, `runtimeVersion`, and `extra.eas.projectId` fields; `eas.json` language profiles gain `channel`.
- **Boot-flow change**: the loading screen performs one new async step before mounting the first game-menu screen. Wall-clock cost: bounded at 5 seconds in the worst case (timeout).
- **No UI surface.** This change ships no new screens. Analytics events are the only visible-to-product output.
- **Prerequisite: `eas init` must run once** for the project to get a `projectId`. The change documents this but does not execute it — it's a developer action at repo setup time.
- **CI implication (not wired by this change)**: Once OTA is live, a publish step per language (`eas update --channel <lang>`) runs on merge to `main`. The exact CI wiring is tracked as follow-up in the relevant CI change; this change ensures the runtime can consume such updates.
- **No breaking changes.** On a first-run fresh install with no OTA available, bundled assets ship — the behavior is identical to the pre-change shape.

## Out of Scope

- Staged rollouts via EAS Update branches. All updates ship to the full channel in v1. Revisit when a first staged rollout is actually needed.
- In-app "update available, restart?" UI. V1 auto-applies updates on launch — no user prompt. Can revisit if telemetry shows users being surprised by version jumps.
- A diagnostics screen exposing `Updates.runtimeVersion`, `Updates.updateId`, `APP_LANG`. Mentioned in ADR-009 implementation notes but deferred to a later "diagnostics" change.
- CI publish wiring (`eas update --channel <lang>` on merge-to-main). Owned by the future `ci-pipeline` change; this change ensures the client side is ready to consume such publishes.
- Update signing / code signing keys beyond EAS defaults. Accepting EAS's default cryptographic guarantees.
