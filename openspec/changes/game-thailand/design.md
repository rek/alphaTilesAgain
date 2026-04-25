## Context

Thailand.java is a multiple-choice game mechanic. It is highly parameterized via its 3-digit `challengeLevel` code, allowing it to function as many different sub-games (e.g., Image-to-Word, Audio-to-Tile, Syllable-to-Word). It **always shows exactly 4 choices**.

This change establishes the pattern for multiple-choice games in the port, utilizing `feature-game-shell` for shared UI and logic.

### Required reading for implementers

- `AGENTS.md` — entry doc; read first.
- `docs/ARCHITECTURE.md` §3 (taxonomy), §11 (container/presenter), §14 (game taxonomy).
- `openspec/changes/archive/2026-04-24-game-china/design.md` — for the sliding-tile exemplar.
- `openspec/changes/archive/2026-04-24-game-engine-base/design.md` — provides `<GameShellContainer>`.

## Goals / Non-Goals

**Goals:**

- Port `Thailand.java` mechanic faithfully: 3-digit `challengeLevel` decoding, fixed 4-choice grid, correct/incorrect handling.
- Support all Reference Types from the TYPES enum (8 total, covering tiles, words, syllables — in text, image, or audio form).
- Support all Choice Types from the TYPES enum.
- Compose with `feature-game-shell` via the `children` slot.

**Non-Goals:**

- Custom animations for choice selection.
- Unit testing the full React tree.

## Decisions

### D1. Java surface → TS artifact mapping (Thailand.java)

| Java symbol | TS destination | Notes |
|---|---|---|
| `public class Thailand extends GameActivity` | `feature-game-thailand/src/ThailandContainer.tsx` | |
| `challengeLevelThai` (hundreds digit) | `distractorStrategy: 1 \| 2 \| 3` | Controls distractor selection strategy |
| `refType` (TYPES string) | `refType: ThailandType` | Decoded from tens digit |
| `choiceType` (TYPES string) | `choiceType: ThailandType` | Decoded from units digit |
| `fourTileChoices` / `fourWordChoices` / `fourSyllableChoices` | `choices: ThailandChoice[]` | Always length 4 |
| `playAgain()` | `startRound()` function | Resets state, chooses new ref + distractors |
| `respondToSelection(int selection)` | `onChoicePress(index)` handler | Checks against ref item |
| `refItem` (TextView) | `RefDisplay` sub-component | Renders text, image, or audio icon |

### D2. Challenge-level decoding

The 3-digit `challengeLevel` (e.g., `235`) is decoded as:

```ts
const TYPES = [
  'TILE_LOWER', 'TILE_UPPER', 'TILE_AUDIO',
  'WORD_TEXT', 'WORD_IMAGE', 'WORD_AUDIO',
  'SYLLABLE_TEXT', 'SYLLABLE_AUDIO',
] as const;
type ThailandType = typeof TYPES[number];

const clStr = String(challengeLevel);
const distractorStrategy = Number(clStr[0]);        // 1=random, 2=similar, 3=same-initial
const refType = TYPES[Number(clStr[1]) - 1];        // 1-indexed
const choiceType = TYPES[Number(clStr[2]) - 1];     // 1-indexed
```

**Distractor strategy** (`challengeLevelThai`):
- `1` = random distractors (easy to distinguish)
- `2` = phonetically-similar distractors (harder)
- `3` = same-initial-tile distractors (hardest)

**RefType** — what is shown/played as the prompt:
- `TILE_LOWER` — tile's primary text form
- `TILE_UPPER` — tile's uppercase/alternate form
- `TILE_AUDIO` — tile played as audio (show audio icon)
- `WORD_TEXT` — whole word as text
- `WORD_IMAGE` — whole word as image
- `WORD_AUDIO` — whole word played as audio (show audio icon)
- `SYLLABLE_TEXT` — syllable as text
- `SYLLABLE_AUDIO` — syllable played as audio

**ChoiceType** — what the 4 choice buttons display (same TYPES enum).

### D3. Distractor Selection (always 4 choices)

Thailand always presents exactly 4 choices (1 correct + 3 distractors). Distractor pool by choiceType:
- `TILE_LOWER` / `TILE_UPPER` → `tileListNoSAD.returnFourTileChoices(refTile, distractorStrategy, refTileType)`
- `WORD_TEXT` / `WORD_IMAGE` → `wordList.returnFourWords(refWord, refTile, distractorStrategy, refType)`
- `SYLLABLE_TEXT` → `syllableList.returnFourSyllableChoices(refString, distractorStrategy)`
- Syllable-ref + Word-choice → `syllableList.returnFourWordChoices(refString, distractorStrategy)`

### D4. Correct Answer Feedback

On correct selection: `shell.incrementPointsAndTracker(true)` (signature is `(isCorrect: boolean)`), highlight correct button with `refColor`, play correct sound then reference audio.
On incorrect selection: play incorrect sound; button remains selectable.

### D5. Reference Item Audio Replay

Tapping the reference item (`onRefClick`) replays its audio:
- TILE_AUDIO / TILE_LOWER / TILE_UPPER → `audio.playTile(tileRow.audioName)`
- WORD_TEXT / WORD_IMAGE / WORD_AUDIO → `audio.playWord(wordRow.wordInLWC)`
- SYLLABLE_TEXT / SYLLABLE_AUDIO → `audio.playSyllable(syllableRow.audioName)`

### D6. Container / Presenter split

**`<ThailandContainer>`** — owns:
- `useGameShell()` for shell context.
- Decodes `challengeLevel` into `distractorStrategy`, `refType`, `choiceType`.
- Manages ref item selection and `choices: ThailandChoice[]` (always length 4).
- Handles `onChoicePress` and `onRefPress`.

**`<ThailandScreen>`** — pure props → JSX:
- Renders the Prompt (`RefDisplay`: text, image, or audio icon).
- Renders a 2×2 grid of 4 `<Tile>` choice buttons.
- Props: `refDisplay`, `choices`, `onChoicePress`, `onRefPress`.

### D7. Route

`apps/alphaTiles/app/games/thailand.tsx` renders `<ThailandContainer>`.

## Testing strategy

| Area | Approach |
|---|---|
| Challenge level decoding | Jest unit tests |
| Distractor count (always 4) | Jest unit test asserting choices.length |
| `ThailandContainer` | Manual QA against `engEnglish4` |
| `ThailandScreen` | Storybook stories for TILE_LOWER→TILE_LOWER, WORD_IMAGE→WORD_TEXT, TILE_AUDIO→TILE_LOWER |
