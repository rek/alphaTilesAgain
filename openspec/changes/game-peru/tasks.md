# Tasks: Game Peru (4-Choice Word Recognition)

## 0. Preflight

- [x] Read `proposal.md`, `design.md`, `specs/peru/spec.md`.
- [x] Read `Peru.java` to confirm CL1/2/3 distractor strategies, `للہ` filter, image-tap-replay.
- [x] Confirm `game-engine-base` archived; `game-china`/`game-mexico` patterns absorbed.

## 1. Library Scaffold

- [ ] Create `libs/alphaTiles/feature-game-peru/` with `project.json`, `tsconfig.json`, `tsconfig.lib.json`, `tsconfig.spec.json`, `jest.config.ts`, `__mocks__/` (mirror `feature-game-mexico` setup, no precompute).
- [ ] Add path alias to `tsconfig.base.json`: `"@alphaTiles/feature-game-peru": ["libs/alphaTiles/feature-game-peru/src/index.ts"]`.
- [ ] Create route: `apps/alphaTiles/app/games/peru.tsx`. Renders `<PeruContainer />` (mirror china route).
- [ ] `src/index.ts` re-exports `PeruContainer` only.

## 2. Pure Logic & Helpers

- [ ] `src/pickPeruWord.ts` — pick a random `Word` whose `parseWordIntoTiles` returns ≥ 2 parsed tiles. Return `{ word } | { error: 'insufficient-content' }`.
- [ ] `src/pickPeruWord.test.ts` — unit tests with seeded RNG.
- [ ] `src/buildWrongCL1.ts` — replace tile[0] with `i`-th entry of shuffled trio. Pure function.
- [ ] `src/buildWrongCL1.test.ts`.
- [ ] `src/buildWrongCL2.ts` — `idx = floor(rng() * (len - 1))`; replace with random tile of same type from shuffled-at-mount pools. Loop until non-collision and non-forbidden, max 200 iterations. Returns `null` on degenerate.
- [ ] `src/buildWrongCL2.test.ts` — assert never picks last-tile index, replacement type matches.
- [ ] `src/buildWrongCL3.ts` — `idx = floor(rng() * (len - 1))`; replace with random distractor of `parsed[idx]`. Loop until non-collision/non-forbidden.
- [ ] `src/buildWrongCL3.test.ts`.
- [ ] `src/buildAllChoices.ts` — orchestrates: standardize correct text, build 3 wrongs per CL, insert correct in random slot (length 4).
- [ ] `src/buildAllChoices.test.ts` — unique invariant, correct present, slot randomization.
- [ ] `src/containsForbidden.ts` (one-line `s.includes('للہ')`) + test.

## 3. Presenter: `<PeruScreen>`

- [ ] Define `PeruScreenProps`: `{ wordImage, wordLabel, choices: { text; grayed; bgColor }[], interactionLocked, onChoicePress, onImagePress }`.
- [ ] Implement `<PeruScreen>`:
  - Image at top (Pressable, tappable).
  - 2×2 grid of 4 choice buttons (Pressable). Grayed = `#A9A9A9` bg + black text. Otherwise `bgColor` from prop + white text.
  - Use `useWindowDimensions` for responsive sizing only.
- [ ] Storybook `PeruScreen.stories.tsx`: `Default` (fresh), `MidRound` (3 grayed), `InsufficientContent` (empty/locked).

## 4. Container: `<PeruContainer>`

- [ ] `<PeruContainer>` route-level component (RouteParams) wraps `<GameShellContainer>` with `instructionAudioId` resolution (mirror china/mexico).
- [ ] Inner `<PeruGame>` consumes `useGameShell`, `useLangAssets`, `useAudio`.
- [ ] At mount (`useEffect` empty-deps kickoff per pattern): if `challengeLevel === 2`, build per-type pools shuffled once. Then call `playAgain()`.
- [ ] `playAgain()`:
  1. Clear interactionLocked. Pick word via `pickPeruWord`. On error → `setError('insufficient-content')`.
  2. Parse with `parseWordIntoTiles`; build choices via `buildAllChoices`. Up to 5 retries with new word if `degenerate`.
  3. Set choices state, set `shell.refWord`. No additional audio (Java does not play word audio on round start).
- [ ] `onChoicePress(i)`: if grayed/locked → ignore. If correct → gray non-correct, `shell.incrementPointsAndTracker(true)`, sequence `audio.playCorrect()` then `shell.replayWord()`. Else → `audio.playIncorrect()`, track wrong (cap 3 distinct).
- [ ] `onImagePress()`: `shell.replayWord()`.
- [ ] Wire `shell.setOnAdvance(playAgain)` in mount effect; cleanup with `setOnAdvance(null)`.
- [ ] Render `InsufficientContent` empty state when `error` set.

## 5. Verification

- [ ] `nx lint feature-game-peru`
- [ ] `nx test feature-game-peru`
- [ ] `npx tsc --noEmit -p libs/alphaTiles/feature-game-peru/tsconfig.lib.json`
- [ ] Manual smoke: `APP_LANG=eng nx serve alphaTiles` — verify CL1 first-tile-only mutation, CL2 same-type mutation, CL3 distractor mutation, image tap replays audio.
