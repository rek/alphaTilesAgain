# Tasks: Game Romania

## 0. Preflight
- [ ] Confirm `game-engine-base` and `game-china` are archived.

## 1. Data Precomputation
- [ ] Create `libs/alphaTiles/feature-game-romania/src/buildRomaniaData.ts`.
- [ ] Implement tile-to-word mapping logic.
- [ ] Register precompute in `libs/alphaTiles/feature-game-romania/src/index.ts`.

## 2. Stateless UI (Presenter)
- [ ] Create `libs/alphaTiles/feature-game-romania/src/RomaniaScreen.tsx`.
- [ ] Implement focus tile display.
- [ ] Implement word display with optional bolding logic.
- [ ] Add Storybook stories.

## 3. Game Logic (Container)
- [ ] Create `libs/alphaTiles/feature-game-romania/src/RomaniaContainer.tsx`.
- [ ] Implement `scanSetting` filtering logic.
- [ ] Manage state for current tile and word index.
- [ ] Integrate with `GameShellContainer`.

## 4. Wiring
- [ ] Create `apps/alphaTiles/app/games/romania.tsx` route.
- [ ] Add library to `tsconfig.base.json` if needed.

## 5. Verification
- [ ] Manual smoke test with `engEnglish4`.
- [ ] Verify `scanSetting` 1, 2, 3 behavior.
- [ ] Verify `boldInitialFocusTiles` behavior.
