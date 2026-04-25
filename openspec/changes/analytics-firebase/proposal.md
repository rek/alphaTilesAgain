## Why

The `analytics-abstraction` change (already merged) wired a no-op `AnalyticsAdapter` throughout the app. No real events reach any backend. This change replaces the no-op with a Firebase Analytics adapter so that game-play events, screen views, and player identification are recorded in production builds.

Firebase is already the target platform for AlphaTiles distribution; using `@react-native-firebase/analytics` keeps the dependency footprint small and avoids a competing SDK.

## What Changes

- Add `libs/alphaTiles/util-analytics-firebase` (`type:util`, `scope:alphaTiles`) — concrete `FirebaseAnalyticsAdapter` implementing `AnalyticsAdapter`.
- Register the adapter at app boot in `apps/alphaTiles/src/bootstrap.ts` via `setAnalyticsAdapter(new FirebaseAnalyticsAdapter())`.
- Add `@react-native-firebase/analytics` (and peer `@react-native-firebase/app`) as explicit app dependencies.
- Firebase project config read from EAS-supplied environment variables baked at build time; no config file committed.

## Capabilities

### New Capabilities

- `analytics-firebase` — live Firebase Analytics events for track, identify, and screen calls; env-var-driven project config.

### Modified Capabilities

- `app-boot` — bootstrap now registers the Firebase adapter before the root navigator mounts.

## Impact

- New lib `libs/alphaTiles/util-analytics-firebase`.
- New runtime deps `@react-native-firebase/analytics`, `@react-native-firebase/app`.
- `apps/alphaTiles/src/bootstrap.ts` gains one import + one `setAnalyticsAdapter` call.
- No changes to game logic, containers, or existing analytics call sites.
- No breaking changes; all existing `track()` / `screen()` / `identify()` call sites work unchanged.

## Out of Scope

- Custom Firebase event schemas or parameter validation.
- A user-facing analytics opt-out UI (governed by existing `setAnalyticsEnabled` toggle).
- Crash reporting (Firebase Crashlytics) — separate change.
- Web/Expo Go support (Firebase native SDK is bare-workflow only).

## Unresolved Questions

- Should `identify` map to Firebase's `setUserId` + `setUserProperties`, or `setUserId` only? Defaulting to both for richer segmentation.
- Is a staging vs. production Firebase project distinction needed at build time? Assume single project for v1; parameterise via EAS env if needed later.
