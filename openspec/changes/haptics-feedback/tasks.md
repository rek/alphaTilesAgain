# Tasks

Implement lang-pack-gated haptic feedback.

## 0. Preflight

- [ ] Read `proposal.md` and `design.md`.
- [ ] Confirm `expo-haptics` not already pinned in `apps/alphaTiles/package.json`; add if missing.
- [ ] Read `useLangAssets` to confirm `settings.find()` shape.

## 1. Library Setup

- [ ] Generate library: `./nx g @nx/js:lib util-haptics --directory=libs/shared/util-haptics --tags='type:util,scope:shared'`.
- [ ] Add path alias to `tsconfig.base.json`: `"@shared/util-haptics": ["libs/shared/util-haptics/src/index.ts"]`.
- [ ] Add `expo-haptics` dep to `apps/alphaTiles/package.json` and the lib's package.json.

## 2. Hook Implementation

- [ ] Implement `libs/shared/util-haptics/src/lib/useHaptics.ts` per design D1.
- [ ] Export from `libs/shared/util-haptics/src/index.ts`.
- [ ] Unit test: with `Haptics` setting `'true'` → trigger fns call `Haptics.notificationAsync` with correct types.
- [ ] Unit test: with setting absent or `'false'` → trigger fns call nothing.
- [ ] Unit test: `triggerCelebration` fires twice with ~200ms gap (use jest fake timers).

## 3. Game Shell Wiring

- [ ] In `feature-game-shell` celebration trigger, call `triggerCelebration` alongside the existing celebration audio/animation.

## 4. Game Container Wiring

- [ ] `game-china` container: call `triggerCorrect` / `triggerIncorrect` next to existing audio calls.
- [ ] `game-mexico` container: same.
- [ ] `game-brazil` container: same.
- [ ] `game-colombia` container: same.
- [ ] `game-thailand` container: same.
- [ ] `game-romania` container: same.
- [ ] `game-chile`, `game-japan`, `game-united-states`: same.
- [ ] Any other ported game with an audio-on-answer call site: same.

## 5. Verification

- [ ] Type-check: `npx tsc --noEmit -p libs/shared/util-haptics/tsconfig.lib.json`.
- [ ] Lint: `nx lint shared-util-haptics`.
- [ ] Unit tests pass: `nx test shared-util-haptics`.
- [ ] Manual smoke (iOS sim or device): set lang-pack `Haptics=true`, play a game, feel haptics on correct/incorrect/celebration.
- [ ] Manual smoke (Web): no errors thrown; visible no-op.
- [ ] Manual smoke: lang pack with no `Haptics` key → no haptics fire.
