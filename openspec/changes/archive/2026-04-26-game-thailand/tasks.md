# Tasks: Game Thailand

## 0. Preflight

- [x] Read `proposal.md`, `design.md`, and `specs/thailand/spec.md`.
- [x] Read `Thailand.java` (Android source) to confirm TYPES enum order and distractor selection methods.
- [x] Confirm `game-engine-base` and `game-china` are archived (upstream merged).
- [x] Read `docs/GAME_PATTERNS.md` for shell API and container/presenter conventions.

## 1. Library Scaffold

- [x] Generate library: `nx g @nx/react-native:lib feature-game-thailand --directory=libs/alphaTiles/feature-game-thailand --tags='type:feature,scope:alphaTiles'`.
- [x] Add path alias to `tsconfig.base.json`: `"@alphaTiles/feature-game-thailand": ["libs/alphaTiles/feature-game-thailand/src/index.ts"]`.
- [x] Create route: `apps/alphaTiles/app/games/thailand.tsx`. Renders `<ThailandContainer />`.

## 2. Pure Logic & Utilities

- [x] Implement `src/decodeThailandChallengeLevel.ts`:
  - `TYPES` constant: `['TILE_LOWER','TILE_UPPER','TILE_AUDIO','WORD_TEXT','WORD_IMAGE','WORD_AUDIO','SYLLABLE_TEXT','SYLLABLE_AUDIO']`.
  - Decode hundreds → `distractorStrategy: 1 | 2 | 3`.
  - Decode tens → `refType: ThailandType` (1-indexed into TYPES).
  - Decode units → `choiceType: ThailandType` (1-indexed into TYPES).
- [x] Unit tests for `decodeThailandChallengeLevel`: verify CL 235, 111, 544, boundary cases.

## 3. Presenter: `<ThailandScreen>`

- [x] Define `ThailandScreenProps`:
  - `refDisplay: { type: ThailandType; text?: string; imageSource?: ImageSource }`.
  - `choices: Array<{ type: ThailandType; text?: string; imageSource?: ImageSource; isCorrect: boolean }>`.
  - `onChoicePress: (i: number) => void`, `onRefPress: () => void`.
- [x] Implement `<ThailandScreen>`:
  - `RefDisplay` sub-component: text box, image, or audio icon depending on `refDisplay.type`.
  - 2×2 grid of 4 `<Tile>` choice buttons (always exactly 4).
- [x] Storybook stories:
  - TILE_LOWER ref → TILE_LOWER choices.
  - WORD_IMAGE ref → WORD_TEXT choices.
  - TILE_AUDIO ref (audio icon) → TILE_LOWER choices.

## 4. Container: `<ThailandContainer>`

- [x] Implement `<ThailandContainer>`:
  - `useGameShell()`, `useLangAssets()`.
  - Decode `challengeLevel` via `decodeThailandChallengeLevel`.
  - `startRound()`:
    - Select ref item based on `refType` (tile from `tileListNoSAD`, word from `wordList`, syllable from `syllableList`).
    - Fetch 4 choices via the appropriate list method (`returnFourTileChoices`, `returnFourWords`, `returnFourSyllableChoices`, `returnFourWordChoices`), passing `distractorStrategy`.
    - Play ref audio on round start.
  - `onChoicePress(i)`:
    - Correct → `updatePointsAndTrackers(1)` (integer), highlight correct button, play correct sound then ref audio.
    - Incorrect → play incorrect sound.
  - `onRefPress()`: replay ref audio.
- [x] Wrap with `<GameShellContainer>`.

## 5. Verification

- [x] Type-check: `npx tsc --noEmit -p libs/alphaTiles/feature-game-thailand/tsconfig.lib.json` — 1 pre-existing storybook error (same as China/Mexico).
- [x] Lint: `nx lint feature-game-thailand` — clean.
- [x] Test: `nx test feature-game-thailand` — 21/21 pass.
- [ ] Manual smoke test: `APP_LANG=eng nx serve alphaTiles` — verify all choice buttons always show (4 total), correct/incorrect feedback, ref audio replay on tap.
- [ ] Verify RTL behavior.
