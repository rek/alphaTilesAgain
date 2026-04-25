# Tasks

Integrate Sentry crash reporting via a new `util-crash-reporting` library.

## 0. Preflight

- [ ] Read `proposal.md` and `design.md`.
- [ ] Confirm `@sentry/react-native` not already pinned in `apps/alphaTiles/package.json`; add if missing.
- [ ] Read `useLangAssets` to confirm `langCode` field shape.
- [ ] Read `usePlayer` to confirm `player.id` field shape.
- [ ] Identify the root layout file (`apps/alphaTiles/app/_layout.tsx`) and note any existing boot sequence calls (especially `analytics-firebase` — coordinate merge order).

## 1. Library Setup

- [ ] Generate library: `./nx g @nx/js:lib util-crash-reporting --directory=libs/alphaTiles/util-crash-reporting --tags='type:util,scope:alphaTiles'`.
- [ ] Add path alias to `tsconfig.base.json`: `"@alphaTiles/util-crash-reporting": ["libs/alphaTiles/util-crash-reporting/src/index.ts"]`.
- [ ] Add `@sentry/react-native` dep to `apps/alphaTiles/package.json` and the lib's `package.json`.
- [ ] Document `SENTRY_DSN` env var in `apps/alphaTiles/app.config.ts` `extra` field with a fallback to `process.env.SENTRY_DSN ?? ''`.
- [ ] Add `SENTRY_DSN` to the `eas.json` `preview` and `production` profile env sections (leave empty string in source; set real value in EAS Secrets).

## 2. Init + Capture Implementation

- [ ] Implement `libs/alphaTiles/util-crash-reporting/src/lib/initCrashReporting.ts` per design D1.
- [ ] Implement `libs/alphaTiles/util-crash-reporting/src/lib/captureError.ts` per design D6.
- [ ] Implement `libs/alphaTiles/util-crash-reporting/src/lib/withCrashBoundary.tsx` — HOC wrapping children in `Sentry.ErrorBoundary`.
- [ ] Export all three from `libs/alphaTiles/util-crash-reporting/src/index.ts`.
- [ ] Unit test: `initCrashReporting()` with DSN present → calls `Sentry.init` with that DSN.
- [ ] Unit test: `initCrashReporting()` with DSN absent → calls `console.warn`, does not call `Sentry.init`.
- [ ] Unit test: `captureError(err, ctx)` → calls `Sentry.captureException(err, { extra: ctx })`.
- [ ] Unit test: `withCrashBoundary` wraps component in a boundary that catches thrown errors without re-throwing.

## 3. Scope Container

- [ ] Create `libs/alphaTiles/util-crash-reporting/src/lib/CrashReportingScope.tsx` container per design D3.
- [ ] Export `CrashReportingScope` from the library root `src/index.ts`.
- [ ] Unit test: with `player.id = 'abc'` and `langCode = 'yue'` → `Sentry.setTag` called with `('playerId', 'abc')` and `('langCode', 'yue')`.
- [ ] Unit test: with no player → `Sentry.setTag` not called for `playerId`.

## 4. Boundary + Boot Wiring at Root

- [ ] In `apps/alphaTiles/app/_layout.tsx`, call `initCrashReporting()` as the first call in the boot sequence (before `initAnalytics` if present).
- [ ] Wrap the default export with `withCrashBoundary`: `export default withCrashBoundary(RootLayout)`.
- [ ] Mount `<CrashReportingScope>` inside `RootLayout` (after player and lang-assets providers are mounted so hooks resolve).

## 5. Verification

- [ ] Type-check: `npx tsc --noEmit -p libs/alphaTiles/util-crash-reporting/tsconfig.lib.json`.
- [ ] Lint: `nx lint alphaTiles-util-crash-reporting`.
- [ ] Unit tests pass: `nx test alphaTiles-util-crash-reporting`.
- [ ] Manual smoke (no DSN): start dev build, confirm `console.warn` appears once in Metro, no crash.
- [ ] Manual smoke (with DSN): set `SENTRY_DSN` in `.env.local`, trigger a test error via `captureError(new Error('test'))`, confirm event appears in Sentry dashboard.
- [ ] Manual smoke (Web): load web build, no Sentry-related errors in console.
- [ ] Confirm no individual game containers are wrapped in error boundaries from this change.
