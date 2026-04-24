# Tasks

## 0. Preflight

- [ ] Confirm `game-engine-base` and its upstreams are merged.
- [ ] Read `Thailand.java` (Android source) to confirm distractor logic and layout constraints.

## 1. Library Scaffold

- [ ] Create `libs/alphaTiles/feature-game-thailand` via NX generator.
- [ ] Add `type:feature` and `scope:alphaTiles` tags.
- [ ] Configure `tsconfig.base.json` path alias.

## 2. Pure Logic & Utilities

- [ ] Implement `decodeThailandChallengeLevel(cl: number)` in `libs/alphaTiles/feature-game-thailand/src/lib/decodeChallengeLevel.ts`.
- [ ] Implement `pickDistractors({ correct, pool, count })` helper.
- [ ] Add Jest unit tests for decoding and distractor selection.

## 3. Presenter: `<ThailandScreen>`

- [ ] Create `ThailandScreen.tsx`.
- [ ] Implement Prompt display (Audio/Image/Word branches).
- [ ] Implement Choice grid (using `ui-game-board` and `ui-tile`).
- [ ] Add Storybook stories for key variants:
    - 2-choice Image-to-Word
    - 4-choice Audio-to-Tile
    - 6-choice Word-to-Word

## 4. Container: `<ThailandContainer>`

- [ ] Create `ThailandContainer.tsx`.
- [ ] Wrap with `<GameShellContainer>`.
- [ ] Implement `startRound()`:
    - Resolve `challengeLevel` params.
    - Pick `refWord` via `util-stages`.
    - Pick distractors.
    - Shuffle correct answer into choices.
- [ ] Implement `onChoicePress(i)`:
    - Check if `choices[i]` is correct.
    - Trigger `shell.incrementPointsAndTracker(true)` on success.
    - Play success/fail sounds.
    - Transition to next round after delay.

## 5. Route & Integration

- [ ] Create `apps/alphaTiles/app/games/thailand.tsx`.
- [ ] Manual smoke test with `engEnglish4` pack.
- [ ] Verify RTL behavior.

## 6. Cleanup

- [ ] Run `npx tsc --noEmit`.
- [ ] Run `nx lint alphaTiles-feature-game-thailand`.
- [ ] Run `nx test alphaTiles-feature-game-thailand`.
