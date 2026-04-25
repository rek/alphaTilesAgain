# Tasks

Implement first-launch onboarding walkthrough.

## 0. Preflight

- [ ] Read `proposal.md` and `design.md`.
- [ ] Read `feature-loading/src/` to locate current post-boot navigation.
- [ ] Read `data-players/src/lib/usePlayersStore.ts` for AsyncStorage import pattern.

## 1. Library & Route Setup

- [ ] Generate library: `./nx g @nx/react-native:lib feature-onboarding --directory=libs/alphaTiles/feature-onboarding --tags='type:feature,scope:alphaTiles'`.
- [ ] Add path alias to `tsconfig.base.json`: `"@alphaTiles/feature-onboarding": ["libs/alphaTiles/feature-onboarding/src/index.ts"]`.
- [ ] Create route `apps/alphaTiles/app/onboarding.tsx` rendering `<OnboardingContainer />`.

## 2. Persistence Helpers

- [ ] Implement `libs/alphaTiles/feature-onboarding/src/lib/hasSeenOnboarding.ts` — async read of `@alphaTiles/hasSeenOnboarding`.
- [ ] Implement `libs/alphaTiles/feature-onboarding/src/lib/markOnboardingSeen.ts` — async write of `'true'`.
- [ ] Unit tests for both helpers using mocked AsyncStorage.

## 3. i18n

- [ ] Add `onboarding` namespace to i18n config.
- [ ] Add English translations for `welcome.*`, `player.*`, `doorGrid.*`, `scoring.*`, `skip`, `next`, `done`.

## 4. OnboardingScreen (Presenter)

- [ ] Define `OnboardingCard` type and `OnboardingScreenProps`.
- [ ] Implement `<OnboardingScreen>` using horizontal `FlatList` with `pagingEnabled`.
- [ ] Render Skip button on every card; Done button only on last card.
- [ ] No `react-i18next` import in presenter.
- [ ] Storybook stories: `card 1`, `mid-deck`, `last card`.

## 5. OnboardingContainer

- [ ] Implement `<OnboardingContainer>`:
  - `useTranslation('onboarding')`.
  - Build typed `cards` array (welcome / player / doorGrid / scoring).
  - `onSkip` and `onDone` → `await markOnboardingSeen(); router.replace('/menu')`.

## 6. Loading Screen Routing

- [ ] In `feature-loading` post-boot navigation, `await hasSeenOnboarding()` then `router.replace('/onboarding' | '/menu')`.
- [ ] Replace any direct `useEffect` with `useMountEffect` if introducing one.

## 7. Verification

- [ ] Type-check: `npx tsc --noEmit -p libs/alphaTiles/feature-onboarding/tsconfig.lib.json`.
- [ ] Lint: `nx lint alphaTiles-feature-onboarding`.
- [ ] Smoke test (Web): clear AsyncStorage → expect `/onboarding`. Set flag → expect `/menu`.
- [ ] Smoke test: tap Skip on card 1 → flag persists, no re-show on next launch.
- [ ] Smoke test: swipe to last card, tap Done → flag persists, navigates to menu.
