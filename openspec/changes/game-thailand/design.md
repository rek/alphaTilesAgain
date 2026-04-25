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

| Java symbol | Java line(s) | TS destination | Notes |
|---|---|---|---|
| `public class Thailand extends GameActivity` | 21 | `feature-game-thailand/src/ThailandContainer.tsx` | |
| `private static final String[] TYPES` | 26-27 | `TYPES` const tuple | 8 values, 1-indexed when decoding |
| `challengeLevelThai` (hundreds digit) | 39, 85 | `distractorStrategy: 1 \| 2 \| 3` | Controls distractor selection strategy |
| `refType = TYPES[...digit-1]` | 86 | `refType: ThailandType` | Decoded from tens digit |
| `choiceType = TYPES[...digit-1]` | 87 | `choiceType: ThailandType` | Decoded from units digit |
| Layout switch (`thailand2` vs `thailand`) | 89-96 | conditional layout in presenter | `WORD_TEXT` choiceType uses larger choice layout |
| `fourTileChoices` / `fourWordChoices` / `fourSyllableChoices` | 22-24 | `choices: ThailandChoice[]` | Always length 4 |
| `playAgain()` | 130-422 | `startRound()` function | Resets state, picks fresh ref + distractors |
| `verifyFreshTile` (last-3 anti-repeat, max 25 retries) | 424-435 | `verifyFreshRef` util | |
| `firstAudibleTile(Word)` (skips LV-not-followed-by-PC, PC, AD, D, T) | 633-646 | `firstAudibleTile` util | Used for word-ref tile picks AND match checks |
| `respondToSelection(int selection)` | 438-631 | `onChoicePress(index)` handler | Match logic by (choiceType × refType) |
| `onRefClick` | 652-672 | `onRefPress` handler | Replays ref audio by refType |
| `refItem` (TextView) | 135 | `RefDisplay` sub-component | Renders text, image, or audio icon |
| `refColor` (random of 4 in `colorList`) | 140-142 | per-round `refColor` state | Used for ref bg AND correct-answer button bg |

### D2. Challenge-level decoding

The 3-digit `challengeLevel` (e.g., `235`) is decoded per Java lines 80-87:

```ts
const TYPES = [
  'TILE_LOWER', 'TILE_UPPER', 'TILE_AUDIO',
  'WORD_TEXT', 'WORD_IMAGE', 'WORD_AUDIO',
  'SYLLABLE_TEXT', 'SYLLABLE_AUDIO',
] as const; // matches Java line 26-27
type ThailandType = typeof TYPES[number];

const clStr = String(challengeLevel);
const distractorStrategy = Number(clStr[0]);        // 1|2|3
const refType = TYPES[Number(clStr[1]) - 1];        // 1-indexed
const choiceType = TYPES[Number(clStr[2]) - 1];     // 1-indexed
```

**Distractor strategy** (`challengeLevelThai`, hundreds digit) — semantics depend on which `returnFour…` helper fires (Java 322-335):
- `1` = random distractors (also: in CL1 the reference tile MUST NOT be type `T`/`AD`/`D`/`PC` — Java 157-164, 178-185, 258-265, 279-286)
- `2` = distractor-list-based wrong choices
- `3` = same-initial-tile wrong choices (only meaningful for word-choice paths; Java 330)

**RefType** — what is shown/played as the prompt (8 values, all confirmed in Java switch at lines 291-320):
- `TILE_LOWER` (idx 1) — tile.text on `refColor` background, white text (Java 293-298)
- `TILE_UPPER` (idx 2) — tile.upper on `refColor` background, white text (Java 294-298)
- `TILE_AUDIO` (idx 3) — `zz_click_for_tile_audio` icon (Java 299-301)
- `WORD_TEXT` (idx 4) — `stripInstructionCharacters(refWord.wordInLOP)` on white background, black text (Java 305-309)
- `WORD_IMAGE` (idx 5) — drawable matching `refWord.wordInLWC` (Java 310-314)
- `WORD_AUDIO` (idx 6) — `zz_click_for_word_audio` icon (Java 315-317)
- `SYLLABLE_TEXT` (idx 7) — syllable.text on `refColor` background, white text (Java 292-298)
- `SYLLABLE_AUDIO` (idx 8) — `zz_click_for_syllable_audio` icon (Java 302-304)

**ChoiceType** — same 8 TYPES (Java switch 337-398), but only 5 choice rendering branches: TILE_LOWER, TILE_UPPER, WORD_TEXT, WORD_IMAGE, SYLLABLE_TEXT (audio-only choice types are not rendered as buttons — they don't appear as `choiceType` in shipped CLs).

### D3. Distractor Selection (always 4 choices)

Thailand always presents exactly 4 choices (1 correct + 3 distractors). Distractor pool dispatch (Java 322-335):
- `choiceType ∈ {TILE_LOWER, TILE_UPPER}` → `tileListNoSAD.returnFourTileChoices(refTile, challengeLevelThai, refTileType)` (Java 322-323)
- `choiceType ∈ {WORD_TEXT, WORD_IMAGE}` AND `!refType.contains("SYLLABLE")` → `wordList.returnFourWords(refWord, refTile, challengeLevelThai, refType)` (Java 326-327)
- `refType.contains("SYLLABLE")` AND `choiceType.contains("WORD")` → `syllableList.returnFourWordChoices(refString, challengeLevelThai)` (Java 331-332)
- `refType.contains("SYLLABLE")` AND `choiceType.contains("SYLLABLE")` → `syllableList.returnFourSyllableChoices(refString, challengeLevelThai)` (Java 333-334)

### D4. Correct Answer Feedback (Java 563-616)

On correct selection:
- `updatePointsAndTrackers(1)` (Java 583).
- All 4 buttons set non-clickable (Java 585-587).
- If `choiceType != WORD_IMAGE`: correct button background → `refColor`, text → white (Java 588-591).
- If `choiceType == WORD_IMAGE`: the OTHER 3 buttons background → white (Java 592-594).
- Audio sequence by refType (Java 598-616):
  - SYLLABLE_TEXT/SYLLABLE_AUDIO → `playCorrectSoundThenActiveSyllableClip` if `hasSyllableAudio`, else `playCorrectSound`.
  - TILE_* → `playCorrectSoundThenActiveTileClip`.
  - WORD_* → `playCorrectSoundThenActiveWordClip`.

On incorrect selection (Java 618-630): `playIncorrectSound`, increment `incorrectOnLevel`, append `chosenItemText` to `incorrectAnswersSelected` (cap 3 distinct entries). Buttons remain clickable.

### D5. Reference Item Audio (auto-play on round start AND replay on tap)

Both round-start (Java 399-416) and `onRefClick` (Java 652-672) dispatch by refType:
- TILE_LOWER / TILE_UPPER / TILE_AUDIO → `playActiveTileClip(false)` → `tileAudioPress(false, refTile)`
- WORD_TEXT / WORD_IMAGE / WORD_AUDIO → `playActiveWordClip(false)`
- SYLLABLE_TEXT / SYLLABLE_AUDIO → `playActiveSyllableClip(false)` (gated by `hasSyllableAudio`)

### D6a. Reference picking constraints (Java 146-290)

- Word-based ref OR word-based choice (with non-syllable ref): pick via `chooseWord()` + `firstAudibleTile(refWord)` (Java 146-211).
- Syllable ref + Syllable choice: random `syllableList[i]` (Java 213-227); last-3 anti-repeat in-line.
- Syllable ref + Word choice: `chooseWord()` + `parseWordIntoSyllables(refWord).get(0)` (Java 229-244).
- Standalone tile ref (no word/syllable): random `tileListNoSAD`, must be C-or-V (Java 249-289).
- **CL1 reference filter**: in `challengeLevelThai == 1`, reject ref tiles with type matching `T|AD|D|PC` (or `T|AD|C|PC` for TILE_LOWER per Java 258 — `C` here is silent-consonant, distinct from `CorV` consonant). Word-path filters only `T` (Java 157, 178, 199).
- **Freshness**: `verifyFreshTile(refString, freshChecks)` blocks last-3 strings (case-insensitive) until 25 retries elapse (Java 424-435).

### D6b. `firstAudibleTile` algorithm (Java 633-646)

Used both at ref-tile pick time AND at correct-answer comparison time when refType is WORD_*. Algorithm: start at index 0; if tile is `LV` followed by non-`PC`, OR matches `PC|AD|D|T`, skip to index 1, then while still matching `PC|AD|D|T` advance index. **Match comparisons MUST use the same `firstAudibleTile` result, not just text** — Java 525 also requires `typeOfThisTileInstance` parity.

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
