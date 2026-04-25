## ADDED Requirements

### Requirement: FirebaseAnalyticsAdapter implements AnalyticsAdapter with three methods

`libs/alphaTiles/util-analytics-firebase` SHALL export a `FirebaseAnalyticsAdapter` class implementing the `AnalyticsAdapter` interface from `@shared/util-analytics` with exactly the methods `track(event, props?)`, `identify(playerId, traits?)`, and `screen(name, props?)`.

```ts
class FirebaseAnalyticsAdapter implements AnalyticsAdapter {
  track(event: string, props?: Record<string, unknown>): void;
  identify(playerId: string, traits?: Record<string, unknown>): void;
  screen(name: string, props?: Record<string, unknown>): void;
}
```

#### Scenario: Adapter satisfies interface

- **WHEN** `FirebaseAnalyticsAdapter` is assigned to a variable typed as `AnalyticsAdapter`
- **THEN** TypeScript compilation succeeds with no errors

### Requirement: track SHALL forward event and snake-cased props to Firebase logEvent

`FirebaseAnalyticsAdapter.track` SHALL call `analytics().logEvent(event, transformPropsToSnake(props))` where `transformPropsToSnake` is imported from `@shared/util-analytics`.

#### Scenario: Props are snake-cased before logEvent

- **GIVEN** `track('gameComplete', { roundNumber: 3, langCode: 'yue' })` is called
- **WHEN** the adapter forwards the call to Firebase
- **THEN** `logEvent` is called with event name `'gameComplete'` and params `{ round_number: 3, lang_code: 'yue' }`

#### Scenario: track with no props

- **GIVEN** `track('appOpen')` is called with no props argument
- **WHEN** the adapter forwards the call
- **THEN** `logEvent` is called with event `'appOpen'` and an empty or undefined params object; no error is thrown

### Requirement: identify SHALL call setUserId and, when traits present, setUserProperties

`FirebaseAnalyticsAdapter.identify` SHALL call `analytics().setUserId(playerId)`. When `traits` is provided, it SHALL additionally call `analytics().setUserProperties(transformPropsToSnake(traits))`.

#### Scenario: identify with traits

- **GIVEN** `identify('player-42', { preferredLang: 'yue', ageGroup: 'child' })` is called
- **WHEN** the adapter forwards the call
- **THEN** `setUserId('player-42')` is called once
- **AND** `setUserProperties({ preferred_lang: 'yue', age_group: 'child' })` is called once

#### Scenario: identify without traits

- **GIVEN** `identify('player-42')` is called with no traits argument
- **WHEN** the adapter forwards the call
- **THEN** `setUserId('player-42')` is called once
- **AND** `setUserProperties` is NOT called

### Requirement: screen SHALL call logScreenView with screen_name and screen_class

`FirebaseAnalyticsAdapter.screen` SHALL call `analytics().logScreenView({ screen_name: name, screen_class: name, ...transformPropsToSnake(props) })`.

#### Scenario: screen call maps name to Firebase fields

- **GIVEN** `screen('GameBoard', { gameType: 'matching' })` is called
- **WHEN** the adapter forwards the call
- **THEN** `logScreenView` is called with `{ screen_name: 'GameBoard', screen_class: 'GameBoard', game_type: 'matching' }`

### Requirement: adapter MUST apply transformPropsToSnake before every Firebase call

All props and traits passed to any adapter method SHALL be transformed via `transformPropsToSnake` before being forwarded to Firebase. Untransformed camelCase keys SHALL NOT reach Firebase.

#### Scenario: camelCase keys are rejected at the adapter boundary

- **GIVEN** a caller passes `{ myKey: 'value' }` to `track`
- **WHEN** the adapter calls `logEvent`
- **THEN** the params object contains `my_key` and does NOT contain `myKey`

### Requirement: adapter SHALL be registered at app boot before the root navigator mounts

`apps/alphaTiles/src/bootstrap.ts` SHALL call `setAnalyticsAdapter(new FirebaseAnalyticsAdapter())` wrapped in a try/catch. Registration MUST occur before the root `<Stack>` or equivalent navigator component renders.

#### Scenario: bootstrap registers adapter on successful Firebase init

- **GIVEN** the Firebase native module is available (production EAS build)
- **WHEN** `bootstrap.ts` runs
- **THEN** `setAnalyticsAdapter` is called with an instance of `FirebaseAnalyticsAdapter` before any navigator renders

#### Scenario: bootstrap degrades gracefully when Firebase is unavailable

- **GIVEN** the Firebase native module is absent (Expo Go, CI without secrets)
- **WHEN** `new FirebaseAnalyticsAdapter()` or `analytics()` throws at bootstrap
- **THEN** the catch block swallows the error
- **AND** the app continues to boot with the default no-op adapter active

### Requirement: analytics-enabled gate MUST be respected via the base-layer functions

The `FirebaseAnalyticsAdapter` itself SHALL NOT check `setAnalyticsEnabled` state. The gate is enforced by the `track()`, `identify()`, and `screen()` wrapper functions in `shared/util-analytics` before they invoke the adapter. The adapter SHALL be called only when the gate allows it.

#### Scenario: disabled analytics prevents adapter calls

- **GIVEN** `setAnalyticsEnabled(false)` has been called
- **WHEN** application code calls the exported `track('someEvent')` from `@shared/util-analytics`
- **THEN** `FirebaseAnalyticsAdapter.track` is NOT invoked
- **AND** no Firebase API is called
