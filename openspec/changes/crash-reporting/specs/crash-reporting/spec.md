## ADDED Requirements

### Requirement: initCrashReporting is a no-op when SENTRY_DSN is absent

`libs/alphaTiles/util-crash-reporting` SHALL export an `initCrashReporting()` function. When `Constants.expoConfig?.extra?.sentryDsn` is falsy, `initCrashReporting()` SHALL emit a single `console.warn` and return without calling `Sentry.init`.

#### Scenario: No DSN — warn and skip

- **GIVEN** `SENTRY_DSN` is not set (env var absent or empty string)
- **WHEN** `initCrashReporting()` is called at app boot
- **THEN** `console.warn` is called once with a message containing `'SENTRY_DSN not set'`
- **AND** `Sentry.init` is NOT called

#### Scenario: No DSN — captureError is safe

- **GIVEN** `initCrashReporting()` was called without a DSN
- **WHEN** `captureError(new Error('test'))` is called
- **THEN** no exception is thrown
- **AND** no Sentry API call is made

### Requirement: initCrashReporting enables Sentry when DSN is present

When `Constants.expoConfig?.extra?.sentryDsn` is a non-empty string, `initCrashReporting()` SHALL call `Sentry.init` with that DSN and `enableNative: true`.

#### Scenario: Valid DSN — Sentry initialised

- **GIVEN** `SENTRY_DSN` is set to a non-empty string
- **WHEN** `initCrashReporting()` is called at app boot
- **THEN** `Sentry.init` is called once with `{ dsn: <value>, enableNative: true }`
- **AND** `console.warn` is NOT called

### Requirement: captureError forwards errors to Sentry

`captureError(error, context?)` SHALL call `Sentry.captureException(error, { extra: context })`. The `context` parameter is optional; when absent, `extra` is omitted or `undefined`.

#### Scenario: Error with context forwarded

- **WHEN** `captureError(err, { screen: 'game' })` is called after a successful init
- **THEN** `Sentry.captureException` is called with `err` as the first argument
- **AND** the second argument has `extra: { screen: 'game' }`

#### Scenario: Error without context forwarded

- **WHEN** `captureError(err)` is called after a successful init
- **THEN** `Sentry.captureException` is called with `err`

### Requirement: withCrashBoundary HOC catches React subtree errors

`withCrashBoundary(Component)` SHALL return a new component that wraps `Component` in a `Sentry.ErrorBoundary`. Any React render error thrown within the wrapped subtree SHALL be caught by the boundary and forwarded to Sentry rather than propagating to the root.

#### Scenario: Render error caught by boundary

- **GIVEN** a component wrapped with `withCrashBoundary`
- **WHEN** a child component throws during render
- **THEN** the error boundary catches the error
- **AND** the error is reported to Sentry
- **AND** the error does NOT propagate as an unhandled exception

#### Scenario: Root layout wrapped — no game containers wrapped

- **WHEN** the app is mounted
- **THEN** exactly one `withCrashBoundary` boundary exists, at the root layout level
- **AND** individual game containers do NOT have their own crash boundaries from this change

### Requirement: CrashReportingScope sets scope tags when player and langCode are available

The `<CrashReportingScope>` container SHALL call `Sentry.setTag('playerId', player.id)` and `Sentry.setTag('langCode', langCode)` once the values from `usePlayer()` and `useLangAssets()` are non-null/non-undefined.

#### Scenario: Tags set after providers mount

- **GIVEN** `usePlayer()` returns `{ player: { id: 'p1' } }`
- **AND** `useLangAssets()` returns `{ langCode: 'yue' }`
- **WHEN** `<CrashReportingScope>` mounts
- **THEN** `Sentry.setTag('playerId', 'p1')` is called
- **AND** `Sentry.setTag('langCode', 'yue')` is called

#### Scenario: Tags not set when player absent

- **GIVEN** `usePlayer()` returns `{ player: null }`
- **WHEN** `<CrashReportingScope>` mounts
- **THEN** `Sentry.setTag` is NOT called for `'playerId'`

### Requirement: All exports are web-safe

All functions exported by `util-crash-reporting` SHALL execute without throwing on web. `@sentry/react-native` no-ops on web; no platform branching is required in the library.

#### Scenario: Web — init safe

- **GIVEN** the app is running on web
- **WHEN** `initCrashReporting()` is called
- **THEN** no exception is thrown

#### Scenario: Web — captureError safe

- **GIVEN** the app is running on web
- **WHEN** `captureError(new Error('test'))` is called
- **THEN** no exception is thrown
