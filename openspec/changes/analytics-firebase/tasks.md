# Tasks

Implement concrete Firebase Analytics adapter and register it at app boot.

## 0. Preflight

- [ ] Read `proposal.md` and `design.md`.
- [ ] Confirm `@react-native-firebase/analytics` and `@react-native-firebase/app` are not already pinned in `apps/alphaTiles/package.json`; add if missing.
- [ ] Read `libs/shared/util-analytics/src/index.ts` to confirm `AnalyticsAdapter`, `setAnalyticsAdapter`, and `transformPropsToSnake` export shapes.
- [ ] Read `apps/alphaTiles/src/bootstrap.ts` (or locate the equivalent boot entry point) to confirm registration site.

## 1. Library Setup

- [ ] Generate library: `./nx g @nx/js:lib util-analytics-firebase --directory=libs/alphaTiles/util-analytics-firebase --tags='type:util,scope:alphaTiles'`.
- [ ] Add path alias to `tsconfig.base.json`: `"@alphaTiles/util-analytics-firebase": ["libs/alphaTiles/util-analytics-firebase/src/index.ts"]`.
- [ ] Add `@react-native-firebase/analytics` and `@react-native-firebase/app` to `apps/alphaTiles/package.json` and the new lib's `package.json`.

## 2. Adapter Implementation

- [ ] Implement `libs/alphaTiles/util-analytics-firebase/src/lib/FirebaseAnalyticsAdapter.ts` per design D1–D3.
- [ ] Export from `libs/alphaTiles/util-analytics-firebase/src/index.ts`: `export { FirebaseAnalyticsAdapter } from './lib/FirebaseAnalyticsAdapter';`.
- [ ] Unit test — `track`: given `props` with camelCase keys, `logEvent` is called with snake_case keys.
- [ ] Unit test — `track`: `void` return; no throw on Firebase rejection.
- [ ] Unit test — `identify`: `setUserId` called with `playerId`; `setUserProperties` called with snake-cased traits.
- [ ] Unit test — `identify`: when `traits` absent, `setUserProperties` not called.
- [ ] Unit test — `screen`: `logScreenView` called with `screen_name` and `screen_class` set to `name`; extra props snake-cased and merged.
- [ ] Unit test — adapter class satisfies `AnalyticsAdapter` type (TypeScript compilation is the test).

## 3. Bootstrap Registration

- [ ] In `apps/alphaTiles/src/bootstrap.ts`, import `FirebaseAnalyticsAdapter` from `@alphaTiles/util-analytics-firebase` and `setAnalyticsAdapter` from `@shared/util-analytics`.
- [ ] Wrap `setAnalyticsAdapter(new FirebaseAnalyticsAdapter())` in a `try/catch` per design D6 to degrade gracefully when Firebase native module is absent.
- [ ] Confirm registration call runs before the root navigator component renders.

## 4. Verification

- [ ] Type-check: `npx tsc --noEmit -p libs/alphaTiles/util-analytics-firebase/tsconfig.lib.json`.
- [ ] Lint: `nx lint alphaTiles-util-analytics-firebase`.
- [ ] Unit tests pass: `nx test alphaTiles-util-analytics-firebase`.
- [ ] Manual smoke (device or EAS build with Firebase config): open app, play a game, confirm events appear in Firebase DebugView.
- [ ] Manual smoke (Expo Go / CI without Firebase config): app boots without crash; analytics silently no-ops.
- [ ] Manual smoke: call `setAnalyticsEnabled(false)` at boot → no events reach Firebase (base-layer gate test).
