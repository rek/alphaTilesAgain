# Design: United States Game (Pairing/Spelling)

Tactical design for the "United States" game implementation, ported from `UnitedStates.java` (363 LOC).

## Context

- **Port of:** `UnitedStates.java` (363 LOC; line numbers verified against upstream `main`).
- **Upstream deps:** `feature-game-shell`, `data-language-assets`, `util-phoneme`.
- **Fixtures:** `engEnglish4` (Roman script pairing).

## Architecture Mapping (Java → TS, line-verified)

| Java symbol (line) | TS destination | Notes |
| -- | -- | -- |
| `class UnitedStates extends GameActivity` (22) | `<UnitedStatesContainer>` + `<UnitedStatesScreen>` | Feature lib |
| `int wordLengthLimitInTiles = 5` (24) | derived from `challengeLevel` (5/7/9) | Java sets default 5; switch overrides |
| `String[] selections` (26) | `selections: string[]` state (length = layout slot count) | Per-tile-button selected text or `""` |
| `boolean[] pairHasSelection` (30) | derived from `selections` (pair has selection iff either slot non-empty) | |
| `Tile[] tileSelections` (33) | `tileSelections: ParsedTile[]` (one per pair) | Used by `combineTilesToMakeWord` in tile mode |
| `GAME_BUTTONS` (35-38) | `<UnitedStatesScreen>` renders N pairs of `<Button>`s | Java renders fixed 18 buttons; hides extras |
| `onCreate` switch (73-91) | `useChallengeLevelLayout(challengeLevel)` returning `{ wordLengthLimitInTiles, fontSize, layoutId }` | |
| `playAgain()` word picker loop (130-134) | `pickUSAWord(words, capTiles, rng)` helper | `while (parsedLength > cap) chooseWord();` — no min |
| `parsedRefWordTileArray = tileList.parseWordIntoTiles(...)` (132) | `parseWordIntoTiles` from `@shared/util-phoneme` | |
| `numberOfPairs = parsedLengthOfRefWord` (150) | `pairs.length` derived from parsed tiles | |
| Pair build loop (172-223) | `setupRound(parsed, tileMap, rng)` pure helper | Returns `Pair[]` of `{ top, bottom, correctSlot, correctTile, distractorTile }` |
| `Random rand = new Random(); rand.nextInt(2)` (188-189) | `rng.nextInt(2)` per pair | Decides correct slot (top vs bottom) |
| `rand.nextInt(Start.ALT_COUNT)` (190) | `rng.nextInt(distractors.length)` | Picks distractor from tile's `distractors` |
| `colorList.get((buttonPair % 5) / 2)` (177) | `colors.hexByIndex[pairIdx % 5]` | Pair color cycling — `buttonPair` is even, so `(buttonPair % 5)/2` cycles 0..4 |
| Constructed-word init (227-231) | `initialDisplay = "__".repeat(numberOfPairs)` | Double underscore per pair |
| `buildWord(int tileIndex)` (236-301) | `useMemo` for `constructedWord` + `useEffect`-free win check via derived state | |
| `combineTilesToMakeWord(tilesSelected, refWord, lastSelectedIndex)` (277) | `combineTilesToMakeWord` from `@shared/util-phoneme` | |
| `wordInLOPWithStandardizedSequenceOfCharacters(refWord)` (282) | `standardizeWordSequence({...})` | |
| Win branch (282-296) | `onWin()` callback | Plays correct sound + word audio (NOT final), awards 2 points |
| `updatePointsAndTrackers(2)` (289) | `shell.incrementPointsAndTracker(true)` | Java passes integer 2; shell normalizes to boolean |
| `playCorrectSoundThenActiveWordClip(false)` (296) | `audio.playCorrect().then(() => audio.playWord(refWord.wordInLWC))` | Note `false` → no final fanfare |
| `onBtnClick(View)` (303-333) | `onTilePress(buttonIndex)` callback | Updates selection, recolors, calls `buildWord(selectionIndex)` |
| `setAllGameButtonsClickable/Unclickable` (335-348) | `interactionLocked` boolean prop on screen | |

## Library Structure

- `libs/alphaTiles/feature-game-united-states/`
  - `src/`
    - `index.ts` — Exports `UnitedStatesContainer`; registers precompute.
    - `UnitedStatesContainer.tsx` — Hooks, i18n, logic.
    - `UnitedStatesScreen.tsx` — Pure presenter.
    - `UnitedStatesScreen.stories.tsx` — Storybook stories.
    - `buildUnitedStatesData.ts` — Precompute builder (filters words by length).
    - `setupRound.ts` — Pair generation logic.

## Precompute: `united-states`

The precompute registry stores words bucketed by tile length to speed up round initialization.

```ts
type UnitedStatesData = {
  level1Words: Word[]; // parsedTileLength <= 5
  level2Words: Word[]; // parsedTileLength <= 7
  level3Words: Word[]; // parsedTileLength <= 9
};
```

Note: Java does not enforce a *minimum* word length (line 130: `while (parsedLengthOfRefWord > wordLengthLimitInTiles) chooseWord();`). A 1-tile word at level 1 is acceptable. The buckets above mirror this — `<= cap`, no lower bound.

## Round Setup Logic (matches Java line 172-223)

```ts
function setupRound({ word, parsed, tileMap, rng, layoutSlotCount }): {
  pairs: Array<{ topText: string; bottomText: string; correctSlot: 'top'|'bottom'; correctTile: ParsedTile; distractorTile: ParsedTile }>;
  hiddenPairCount: number;
} {
  const pairs = [];
  for (let i = 0; i < parsed.length; i++) {
    const correctTile = parsed[i];
    const distractors = correctTile.distractors;          // length = ALT_COUNT
    const distractorIdx = rng.nextInt(distractors.length); // Java: rand.nextInt(ALT_COUNT)
    const distractorBase = distractors[distractorIdx];
    const distractorTile = tileMap.get(distractorBase);
    const correctSlot = rng.nextInt(2) === 0 ? 'top' : 'bottom';
    pairs.push({
      topText: correctSlot === 'top' ? correctTile.text : distractorTile.text,
      bottomText: correctSlot === 'top' ? distractorTile.text : correctTile.text,
      correctSlot,
      correctTile,
      distractorTile,
    });
  }
  return { pairs, hiddenPairCount: layoutSlotCount - pairs.length };
}
```

## State Management

- **Container State:**
  - `currentWord: Word`
  - `parsedTiles: ParsedTile[]`
  - `pairs: Pair[]` — built once per round.
  - `selections: (0 | 1 | null)[]` length = `pairs.length`. `0` = top selected, `1` = bottom selected.
  - `tileSelections: (ParsedTile | EmptyTile)[]` length = `pairs.length` (mirrors Java's tile mode).
  - `interactionLocked: boolean` — set true on win.

- **Derived (`useMemo`):**
  - `constructedWord: string` = `combineTilesToMakeWord(tileSelections, refWord, lastSelectedIndex)` for tile mode; placeholder `"__"` repeated for syllable-mode unselected pairs.
  - `isWin: boolean` = `constructedWord === standardizeWordSequence(currentWord)`.

## UI Design

- **Grid:** 2 rows × N columns. N = `pairs.length` (= word's tile length, <= 5/7/9).
- **Tiles:**
  - Unselected in a pair: Dark Gray `#A9A9A9` background, Black text (Java line 326-329).
  - Selected in a pair: theme color from `colorList[(pairIdx) % 5]`, White text (Java line 321-324).
- **Word display:** Text component showing the constructed word; `"__"` per pair when unselected; on win turns `#006400` (dark green) and bold.
- **Pair colors at setup:** `colorList[(buttonPair % 5) / 2]` — same color used for both buttons in a pair before selection (Java line 177-180).

## i18n Strategy

- **Presenter:** Receives `tilePairs: { topText, bottomText, selectedSlot, themeColor }[]`, `constructedWord: string`, `isWin: boolean`, and chrome strings (`scoreLabel`, `backLabel`).
- **Container:** Uses `useTranslation` for chrome; tile/word texts come from assets.

## Win Logic (matches Java line 282-296)

1. Compute `constructedWord` from `tileSelections` via `combineTilesToMakeWord`.
2. Compare against `standardizeWordSequence(refWord)`.
3. If equal:
   - `repeatLocked = false` (let advance arrow re-enable round).
   - `setAdvanceArrowToBlue` → shell handles via `shell.incrementPointsAndTracker(true)`.
   - Constructed-word turns dark green + bold.
   - All tile buttons unclickable.
   - `audio.playCorrect()` then `audio.playWord(refWord.wordInLWC)`. **Important: Java passes `false` to `playCorrectSoundThenActiveWordClip` so the *final/celebration* fanfare is NOT played.**

## Audio Sequencing

```ts
async function onWin() {
  setInteractionLocked(true);
  shell.incrementPointsAndTracker(true);
  await audio.playCorrect();
  if (!isMountedRef.current) return;
  await audio.playWord(refWord.wordInLWC);
  // No playCorrectFinal — Java passes `false` (line 296)
}
```

## Unresolved Questions

1. **Syllable variant.** Java has a `syllableGame.equals("S")` branch (line 137-139, 192, 202) that uses syllable distractors and a different join algorithm. V1 ports tile mode only; if any pack ships `aa_settings.txt` with `syllableGame=S`, we need a separate path.
2. **Layout slot count.** Java pre-renders 10/14/18 buttons regardless of word length and hides extras (line 215-220). Our presenter dynamically renders only `pairs.length` columns; visually equivalent but structurally simpler. Confirm parity is acceptable.
3. **Win-points mapping.** Java passes `2` to `updatePointsAndTrackers`; the TS shell API takes a boolean. Documented gap (same as Mexico) — feature-game-shell is the scoring authority.
