## ADDED Requirements

### Requirement: First launch shows onboarding walkthrough

On the first launch after install (or after AsyncStorage clear), the app SHALL navigate from the loading screen to `/onboarding` instead of `/menu`. The decision SHALL be based on the persisted flag at AsyncStorage key `@alphaTiles/hasSeenOnboarding`: if absent or any value other than the string `'true'`, the user has not seen onboarding.

#### Scenario: Fresh install routes to onboarding

- **GIVEN** AsyncStorage has no `@alphaTiles/hasSeenOnboarding` key
- **WHEN** the loading screen completes boot
- **THEN** the app navigates to `/onboarding`

#### Scenario: Returning user skips onboarding

- **GIVEN** AsyncStorage holds `@alphaTiles/hasSeenOnboarding = 'true'`
- **WHEN** the loading screen completes boot
- **THEN** the app navigates to `/menu`

### Requirement: Skip and Done both dismiss onboarding permanently

The onboarding screen SHALL render a Skip button on every card and a Done button on the final card. Pressing either SHALL set `@alphaTiles/hasSeenOnboarding = 'true'` in AsyncStorage and navigate to `/menu`.

#### Scenario: Skip on first card persists flag

- **GIVEN** the user is on the first onboarding card
- **WHEN** the user presses Skip
- **THEN** `@alphaTiles/hasSeenOnboarding` is set to `'true'` in AsyncStorage
- **AND** the app navigates to `/menu`

#### Scenario: Done on last card persists flag

- **GIVEN** the user has swiped to the final onboarding card
- **WHEN** the user presses Done
- **THEN** `@alphaTiles/hasSeenOnboarding` is set to `'true'` in AsyncStorage
- **AND** the app navigates to `/menu`

#### Scenario: Done is hidden on non-final cards

- **GIVEN** the user is on any card before the final one
- **THEN** the Done button is not rendered
- **AND** the Skip button is rendered

### Requirement: Container/presenter split with i18n-blind presenter

`<OnboardingContainer>` SHALL own all hooks, including `useTranslation('onboarding')`, and SHALL pass pre-translated strings to `<OnboardingScreen>` as props. `<OnboardingScreen>` SHALL NOT import `react-i18next`.

#### Scenario: Presenter receives pre-translated strings

- **WHEN** `<OnboardingContainer>` mounts
- **THEN** it builds a typed `cards: OnboardingCard[]` whose `title` and `body` fields are already translated
- **AND** passes `skipLabel`, `nextLabel`, `doneLabel` as already-translated strings to `<OnboardingScreen>`

#### Scenario: Presenter has no i18n dependency

- **WHEN** `<OnboardingScreen>`'s import graph is inspected
- **THEN** it does not contain `react-i18next` or `i18next`

### Requirement: Persisted flag is bare AsyncStorage, not a Zustand store

The `hasSeenOnboarding` flag SHALL be persisted via direct `AsyncStorage` calls in helper functions `hasSeenOnboarding()` and `markOnboardingSeen()`. No Zustand store SHALL be created for this flag.

#### Scenario: Helpers expose async read/write

- **WHEN** `feature-onboarding/src/index.ts` is inspected
- **THEN** it exports `hasSeenOnboarding(): Promise<boolean>` and `markOnboardingSeen(): Promise<void>`
- **AND** does not export a Zustand store hook for the flag
