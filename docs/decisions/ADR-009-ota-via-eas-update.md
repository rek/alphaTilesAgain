# ADR-009: OTA Updates via EAS Update

**Date**: 2026-04-23
**Status**: Accepted

## Context

Language-pack content iterates faster than engine code. A linguist notices a wrong audio clip, fixes it, and wants that fix in users' hands without forcing them to wait for an app-store review cycle. This is especially important for community-driven minority-language content where the review loop can span months.

At the same time, the app has no backend — we cannot run a custom asset server. Native code changes (new modules, new Expo config) still require a full rebuild and a store submission; only JS + bundled JS-reachable assets can ship over the air.

We need:

- A way to push JS bundle + asset updates to installed apps.
- Per-language isolation — an English pack fix must not ship to Cantonese users.
- Fallback to the bundled version when no update is available (offline-first).
- No self-hosted update server.

## Decision

**EAS Update** (Expo's first-party OTA system) with **one update channel per language pack**. Native-code changes still require a full rebuild.

- `eas.json` build profiles (one per language, ADR-001) each declare their own `channel` (`eng`, `tpx`, `yue`, …).
- Runtime checks for an update on app start; falls back to bundled assets when no update is available or connectivity is unavailable.
- Engine JS changes + pack-level JS/JSON/image/audio changes can ship via EAS Update. Changes that require recompilation (new native module, Expo SDK bump, `app.config.ts` identity changes) require a full EAS Build.

## Rationale

EAS Update is the native story for Expo. It integrates with `eas build`, supports channels directly, and has a mature client runtime that handles fallback, rollback, and delta updates. Self-hosting (ADR-001 excludes a backend) is off the table; among managed OTA options, EAS is the only first-party fit.

Channel-per-language follows directly from build-per-language (ADR-001). A single channel would require runtime filtering and risks shipping the wrong content.

### Pros

- First-party Expo — no custom infra, no third-party dependency.
- Channels map cleanly onto language builds.
- Client runtime handles fallback / offline gracefully.
- Content fix → push update → users get it on next launch. No store review.
- Validator (ADR-008) still gates updates: CI runs the validator before publishing an update.

### Cons

- Native-code changes bypass OTA — still need the slow path for those.
- EAS Update is a vendor dependency. If Expo ever charges differently or deprecates the service, we migrate.
- Users on very old builds may miss updates that require a new native surface. Version-skew policy needed.

## Alternatives Considered

### Alternative 1: Rebuild-only, no OTA

Every content change = new EAS Build + store submission.

- **Why not**: Store review cycles (days to weeks) are incompatible with the community-content iteration rhythm. Linguists fix a typo; users wait two weeks. Unacceptable for the target deployment.

### Alternative 2: Microsoft CodePush

Widely used RN OTA provider.

- **Why not**: CodePush support for React Native has been wound down by Microsoft; it's on a deprecation path. Starting on a deprecated service is a known future migration.

### Alternative 3: Custom OTA (self-hosted asset endpoint)

Serve a JSON manifest + asset bundles from a controlled URL; app downloads at boot.

- **Why not**: Violates the "no backend" constraint (ADR-001). Also re-implements fallback, rollback, delta updates, signing — all EAS Update gives us free.

### Alternative 4: One channel for all languages

Push updates through a single channel and filter at runtime.

- **Why not**: Defeats per-language isolation. Risks shipping an English-pack asset fix into a Cantonese install. The channel-per-language alternative is free under EAS.

## Consequences

### Positive

- Content iteration loop drops from weeks (store review) to minutes (EAS publish) for JS-reachable fixes.
- Each language's update history is scoped — a broken update in `tpx` doesn't touch `eng`.
- Rollback is per-channel: republish the previous version of `tpx`, done.

### Negative

- Native changes remain a slow path. We must be disciplined: changes that touch `app.config.ts` identity, native deps, or SDK version are full-rebuild only.
- "Which update am I running?" becomes a support question. Build the runtime version + update id into a diagnostics screen.
- Version-skew: if an update assumes a native surface that an old build lacks, the update fails. Document the policy per change in `openspec/changes/<change>/design.md`.

### Neutral

- `eas.json` grows per-profile `channel` field.
- CI gains a publish step per language after merge to `main`: `eas update --channel <lang>`.
- Validator (ADR-008) runs as a precondition for publishing updates, same as builds.

## Implementation Notes

- `eas.json`:
  ```json
  {
    "build": {
      "eng": { "env": { "APP_LANG": "eng" }, "channel": "eng" },
      "tpx": { "env": { "APP_LANG": "tpx" }, "channel": "tpx" }
    }
  }
  ```
- Runtime check via `expo-updates`. On app start: check for update, download if available, reload on next launch. Fallback to bundled on any failure or offline state.
- Update payload budget: keep assets light. Large audio re-records are still feasible over OTA but count against user data; prefer incremental updates.
- Publish workflow (CI):
  1. Rsync content repo at current pin.
  2. Validate (ADR-008).
  3. Generate manifest (ADR-003).
  4. `eas update --channel <lang> --message "<summary>"`.
- Version-skew guard: include `APP_LANG` and a native-surface version token in the update's runtime-version metadata. Mismatches force a store update, not an OTA.
- Diagnostics screen: surface `Updates.runtimeVersion`, `Updates.updateId`, `APP_LANG` for support.

## References

- `docs/ARCHITECTURE.md` §13 (OTA updates)
- EAS Update docs — channels, runtime versions, rollback
- `expo-updates` docs
- ADR-001 (per-language build) — channels mirror profiles
- ADR-008 (full validator port) — gate before publishing updates
