## Why

First-time users open the app to a player-picker with no orientation. There is no app-level walkthrough explaining how to choose a player, what the door grid means, or how scoring works. Per-game audio instructions exist (`instructionAudioName` mp3s) but cover only mid-game help, not first-launch onboarding.

A one-time, swipeable card walkthrough closes that gap without adding a permanent UI surface.

## What Changes

- Add `libs/alphaTiles/feature-onboarding` (`type:feature`, `scope:alphaTiles`).
- Add `<OnboardingContainer>` + `<OnboardingScreen>` — swipeable card sequence (3–5 static cards: welcome, choose player, door grid, scoring).
- Persist `hasSeenOnboarding` boolean in a bare `AsyncStorage` key `@alphaTiles/hasSeenOnboarding` (no Zustand store — single flag, no reactivity needed).
- Add route `apps/alphaTiles/app/onboarding.tsx` rendering the container.
- Modify `feature-loading` post-boot routing: read `hasSeenOnboarding`; if false → navigate to `/onboarding`; if true → navigate to `/menu` as today.
- Skip and Done buttons both set `hasSeenOnboarding = true` and navigate to `/menu`.
- New i18n namespace `onboarding` (device-locale only — no lang-pack content; container owns translations).

## Capabilities

### New Capabilities

- `onboarding-tutorial` — first-launch swipeable walkthrough; one-shot persisted via AsyncStorage; navigates to menu on dismiss.

### Modified Capabilities

- `feature-loading` — branches to `/onboarding` vs `/menu` based on persisted flag.

## Impact

- New lib `libs/alphaTiles/feature-onboarding`.
- New route `apps/alphaTiles/app/onboarding.tsx`.
- `feature-loading` post-boot navigation gains async flag read.
- Adds `onboarding` i18n namespace + translation keys for default locales (eng minimum).
- No breaking changes; users mid-game keep their existing progress (flag is per-install).

## Out of Scope

- Per-game tutorials (already covered by `instructionAudioName`).
- Re-show onboarding from a settings screen (no settings UI yet).
- Animated illustrations or video — static images only in v1.
- Lang-pack-driven onboarding content — device-locale i18n only.

## Unresolved Questions

- Exact card count and copy for v1 (3 vs 5)? Default to 4: welcome, player picker, door grid, scoring.
- Static images: bundled with the feature lib or pulled from a shared asset folder? Default: bundle inside `feature-onboarding/assets/`.
