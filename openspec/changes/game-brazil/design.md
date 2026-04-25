## Context

`Brazil.java` is a multiple-choice tile-identification game. A word is displayed with one tile blanked; the player taps the correct tile from a row of choices. Mechanic varies sharply across `challengeLevel` (1–7) and `syllableGame` ("T"/"S").

### Required reading for implementers

- `AGENTS.md` — entry doc; read first.
- `openspec/AGENT_PROTOCOL.md` — pickup protocol.
- `docs/ARCHITECTURE.md` §3 (taxonomy), §11 (container/presenter), §13 (routing).
- `docs/decisions/ADR-010-testing-storybook-plus-unit.md`.
- **Upstream OpenSpec changes:** `game-engine-base` (merged).
- **Source Java files:** `Brazil.java` — full mechanic. `GameActivity.java` — base for `chooseWord`, `parseWordIntoTiles`, audio helpers.

## Goals / Non-Goals

**Goals:**
- Port all 7 challenge levels (vowels CL1–3, consonants CL4–6, tones CL7) and 2 syllable levels.
- Tile/syllable selection logic that filters words by required tile type for the level.
- Container/Presenter split; i18n-blind presenter.

**Non-Goals:**
- Layout differences between Java's `brazil_cl1` and `brazil_cl3` XML — RN uses one responsive presenter that renders 4 or up to 15 tiles.
- Audio prompts beyond standard correct/incorrect/word clip helpers.

## Decisions

### D1. Java surface → TS artifact mapping

| Java symbol | TS destination | Notes |
|---|---|---|
| `Set<String> answerChoices` | `choices: TileChoice[]` state | Array of 4–15 tile/syllable choices |
| `Tile correctTile` / `Syllable correctSyllable` | `correct: TileChoice` state | Active answer |
| `String correctString` | derived from `correct.text` | |
| `parsedRefWordTileArray` | `parsedTiles: string[]` from `useLangAssets()` parser | One blanked entry replaced with `"__"` |
| `parsedRefWordSyllableArray` | `parsedSyllables: string[]` (when `syllableGame==='S'`) | |
| `VOWELS`, `CONSONANTS`, `TONES`, `SYLLABLES` | precomputed pools, loaded via `usePrecompute('brazil')` | Shuffled at boot |
| `MULTITYPE_TILES` | precompute field | Multi-type tile texts |
| `chooseWord()` | `pickWord()` from shell utils | Retry until word has tile of required type |
| `removeTile()` | `blankRandomTileOfType(parsedTiles, type)` pure fn | Never blank SAD tiles |
| `setUpTiles()` | `buildChoices(level, correct, pool, distractors)` pure fn | Per-CL logic |
| `setUpSyllables()` | `buildSyllableChoices(level, correct, syllablePool)` pure fn | |
| `respondToTileSelection()` | `onTileChoice(text)` handler | |
| `updatePointsAndTrackers(1)` | `incrementPointsAndTracker(1)` | On correct only |
| `playCorrectSoundThenActiveWordClip(false)` | `playCorrectThenWord()` | |
| `playIncorrectSound()` | `playIncorrect()` | |

### D2. Visible Choice Count

```ts
function visibleChoices(level: number, syllable: boolean, vowels: number, consonants: number, tones: number): number {
  if (syllable) return 4;
  switch (level) {
    case 3: return Math.min(vowels, 15);
    case 6: return Math.min(consonants, 15);
    case 7: return 4; // tones; hide buttons beyond TONES.length up to 4
    default: return 4;
  }
}
```

### D3. Required Tile Type per Challenge Level

| CL | `syllableGame` | Required tile type in word | Choice pool |
|---|---|---|---|
| 1–3 | T | vowel (`LV`/`AV`/`BV`/`FV`/`V`) | VOWELS |
| 4–6 | T | consonant (`C`) | CONSONANTS |
| 7 | T | tone (`T`) | TONES |
| 1–2 | S | any (syllable picked) | SYLLABLES |

CL3 / CL6: if `correct` not in the random sample of the pool, overwrite a random slot with `correct`.

### D4. Distractor Trio Source

- CL2/CL5: `correct` + its 3 distractors from `tile.distractorTrio` (Java `tileHashMap`).
- SL2: `correct` + its 3 syllable distractors from `syllableHashMap`.

### D5. Precompute: `brazilPreProcess`

Run at boot; stored under key `'brazil'`:

```ts
type BrazilData = {
  vowels: Tile[];        // tiles where typeOfThisTileInstance ∈ {LV,AV,BV,FV,V}
  consonants: Tile[];    // tiles where typeOfThisTileInstance == 'C'
  tones: Tile[];         // TONES list
  syllables: string[];   // syllableList.toString()
  multitypeTiles: string[]; // tiles where tileTypeB != 'none'
};
```

### D6. Container / Presenter Split

**`<BrazilContainer>`** — owns:
- `usePrecompute('brazil')`, `useGameShell()`, `useLangAssets()`, `useAudio()`, `useProgress()`.
- State: `parsedTiles`/`parsedSyllables`, `choices`, `correct`, `finished`, `wrongPicks`.
- Handlers: `onTileChoice`, `onPlayAgain`, `onRepeatWord`.

**`<BrazilScreen>`** — pure props → JSX:
- `displayTiles: { text: string; isBlank: boolean; color?: string }[]`.
- `choices: { text: string; color: string; visible: boolean; disabled: boolean }[]`.
- `wordImage: ImageSource`, `onChoice(text)`, `onRepeat()`.
- No hooks.

## Testing strategy

| Area | Approach |
|---|---|
| `buildChoices` / `buildSyllableChoices` per CL | Jest unit — verify count, presence of correct, distractor inclusion |
| `blankRandomTileOfType` | Jest unit — never picks SAD, picks tile of correct type |
| Word filter (must contain tile of type) | Jest unit with synthetic wordlist |
| `BrazilContainer` | Manual QA against `engEnglish4` across CL1–7 |
| `BrazilScreen` | Storybook stories: CL1 (4 tiles), CL3 (15 tiles), CL7 (2 visible tones), SL1, won state |
