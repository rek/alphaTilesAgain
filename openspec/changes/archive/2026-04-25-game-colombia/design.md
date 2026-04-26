## Context

`Colombia.java` is a tile-keyboard word-builder. Player taps tiles to spell the prompted word; live colour feedback signals correctness; delete removes last keyed tile. Mechanic varies by `challengeLevel` (1–4) and `syllableGame` ("T"/"S").

### Required reading for implementers

- `AGENTS.md`, `openspec/AGENT_PROTOCOL.md`.
- `docs/ARCHITECTURE.md` §3, §11, §13.
- `docs/decisions/ADR-010-testing-storybook-plus-unit.md`.
- **Upstream OpenSpec changes:** `game-engine-base` (merged).
- **Source Java files:** `Colombia.java` — full mechanic. `KeyAdapter.java` / `Start.java` (`KEYBOARD` parsing).

## Goals / Non-Goals

**Goals:**
- Port all 4 CL × 2 variant configurations of the keyboard.
- Live partial-correctness colouring (yellow/orange/gray).
- Pagination for full-keyboard CL3/CL4.
- Container/Presenter split; i18n-blind presenter.

**Non-Goals:**
- Hard-mode requiring re-use of confirmed tiles.
- Audio prompts beyond standard correct/incorrect/word clip.

## Decisions

### D1. Java surface → TS artifact mapping

| Java symbol (Colombia.java line) | TS destination | Notes |
|---|---|---|
| `class Colombia extends GameActivity` | `<ColombiaContainer>` wrapping `<GameShellContainer>` | |
| `tilesPerPage = 35`, `syllablesPerPage = 18` (~28–29) | `TILES_PER_PAGE = 35`, `SYLS_PER_PAGE = 18` constants | |
| `keysInUse`, `keyboardScreenNo`, `totalScreens`, `partial` (~24–27) | container state | |
| `tileKeysList`, `syllableKeysList` (~30–31) | `keys: KeyTile[]` state | |
| `clickedKeys`, `tilesInBuiltWord` (~32–33) | `clickedKeys: WordPiece[]`, `tilesInBuiltWord: ParsedTile[]` state | |
| `onCreate()` (~67) | `useEffect` mount kickoff (per pattern) | If `S && CL===4` → `shell.goBackToCountryMenu()` immediately |
| `playAgain()` (~117) → `setWord()` (~133) → `chooseWord()` + `parseWordIntoTiles*` + `loadKeyboard()` | `startRound()` callback | |
| `loadKeyboard()` switch (~158) | `buildKeyboard({ level, variant, parsedTarget, pools, rng, scriptType })` pure fn | |
| CL1 path (~168–212) | shuffle-only branch | Java keeps duplicates intentionally (line 165 comment) |
| CL2 path (~215–253) | `parsedTarget + 1 random distractor per` shuffled branch | T uses `tileList.returnRandomDistractorTile`; S uses `syllableList.returnRandomDistractorSyllable` (random, NOT first-of-trio) |
| CL2 SAD-syllable special handling (~218–229) | SAD-aware syllable distractor draw | When `SAD_STRINGS.contains(syl.text)`, swap via `tileList.returnRandomDistractorTile`'s text and reshuffle distractors |
| CL3 T path (~274–303) | `keyList`-based keyboard with pagination | Source = `aa_keyboard.txt` parsed `keyList` |
| CL3 S path (~256–273) | `parsedTarget + (18 - parsed.size())` distractors, capped at 18 | Same SAD-aware draw as CL2 |
| CL4 T path (~308–366) | `tileList` deduped, type-colored, paginated | `typeOfThisTileInstance` → colorList[1..4] (C/V/T/else) |
| CL4 S path | unsupported → `goBackToEarth()` (~78) | Mirror in container before render |
| `respondToKeySelection()` (~404) | `onKeyPress(index)` handler | Branch: T-CL3 uses `keyList[idx].text`; S uses `syllableKeysList[idx].text`; T-CL1/2/4 uses `tileKeysList[idx]` and pushes to `tilesInBuiltWord` |
| `evaluateStatus()` (~432) | `onKeyPress` epilogue + `evaluateStatus({...})` pure helper | See D4 |
| `wordInLOPWithStandardizedSequenceOfCharacters(refWord)` (~434) | `standardizeWordSequence({...})` from `@shared/util-phoneme` | |
| `combineTilesToMakeWord(tilesInBuiltWord, refWord, -1)` (~410, 437) | `combineTilesToMakeWord(...)` from `@shared/util-phoneme` | |
| `updatePointsAndTrackers(4)` (~445) | `shell.incrementPointsAndTracker(true)` | TS shell increments by 1; Java's "+4" is documentational |
| `playCorrectSoundThenActiveWordClip(false)` (~446) | `audio.playCorrect().then(() => shell.replayWord())` | Mounted-guard required |
| `setAdvanceArrowToBlue()` (~449) | implicit via `incrementPointsAndTracker` | |
| `deleteLastKeyed(View)` (~502) | `onDelete()` handler | See D5 |
| `onBtnClick(View)` arrow detection (~525) | `onKeyPress` checks if button index is nav arrow slot (34/35 in tile mode, 17/18 in syll mode) | |
| `updateKeyboard()` (~558–605) | `paginateKeyboard({page, totalScreens, partial, keysInUse, ...})` pure helper + container state update | |
| `clickPicHearAudio(View)` (~609) | `onImagePress()` → `shell.replayWord()` | |
| `goBackToEarth(View)` | `shell.goBackToCountryMenu()` | |
| RTL mirroring (~80–93) | logical RTL props on icons + arrows | `setRotationY(180)` is N/A in RN |

### D2. Keyboard Builder per (variant, CL)

```ts
type KeyTile = { text: string; bgColor: string; type?: string };

function buildKeyboard({
  level, variant, parsedTiles, parsedSyllables,
  tileList, syllableList, keyList,
  colorList, rng = Math.random,
}: {
  level: 1|2|3|4;
  variant: 'T'|'S';
  parsedTiles: ParsedTile[];
  parsedSyllables?: Syllable[];
  tileList: Tile[];
  syllableList: Syllable[];
  keyList: KeyboardKey[];
  colorList: string[];
  rng?: () => number;
}): { keys: KeyTile[]; visible: number; paginated: boolean; totalScreens: number; partial: number } {
  // Per-CL logic per Java loadKeyboard(). See D1 row mapping for exact branches.
  // NOTE: Java preserves duplicates in CL1 ("Will list <a> twice if <a> is needed twice").
  // NOTE: CL2 distractor draw is RANDOM (returnRandomDistractorTile/Syllable), not "first of trio".
  // NOTE: CL3-T and CL4-T paginate when keysInUse > 35; CL3-S is capped at 18 (single page).
}
```

### D3. Pagination

```ts
const TILES_PER_PAGE = 35;        // CL3-T and CL4-T when keysInUse > 35; 33 keys + 2 nav arrows
const SYLS_PER_PAGE = 18;         // CL3-S: capped at 18 (no pagination triggers)

// Pagination MUST trigger only for T-CL3/T-CL4 with keysInUse > 35.
// keyIndex per tap: (33 * (page - 1)) + slotIndex
// totalScreens = ceil(keysInUse / 33); partial = keysInUse % 33
```

### D4. Live Evaluation (matches Java `evaluateStatus()`)

```ts
type EvalResult = { color: 'yellow' | 'orange' | 'gray' | 'green'; isWin: boolean };

function evaluateStatus({
  level, variant,
  clickedKeys, tilesInBuiltWord,
  parsedTiles, parsedSyllables,
  refWord, scriptType,
}): EvalResult {
  // Java line 434–500.
  // 1) Build correctString = standardizeWordSequence(refWord, ...)
  // 2) Build currentAttempt:
  //    - if S OR (T && CL===3): use displayed text (clickedKeys.text concat)
  //    - else: combineTilesToMakeWord(tilesInBuiltWord, refWord, -1)
  // 3) If currentAttempt === correctString → green/win.
  // 4) Else default = gray.
  //    Then if correctString.length > currentAttempt.length:
  //      build firstNCorrectTiles[] = parsedRefWord*[0..clickedKeys.length).
  //      if currentAttempt === correctString.substring(0, currentAttempt.length)
  //         OR clickedKeys.equals(firstNCorrectTiles):
  //        // on track by text
  //        if (CL===1 || CL===2 || CL===4 || S):
  //          // tile-identity check too
  //          orange = any clickedKeys[i].text !== parsedRefWord*[i].text;
  //          color = orange ? 'orange' : 'yellow';
  //        else: // CL===3 T (Java comment: "AGH: unclear why CL=3 is excluded")
  //          color = 'yellow';
  // 5) Overlong (currentAttempt.length > correctString.length) falls through to gray (default).
}
```

Background colors (Java verbatim):
- Yellow `#FFEB3B` (Java line 124)
- Orange `#F44336` (Java line 484)
- Gray `#A9A9A9` (Java line 454)
- Green `#4CAF50` (Java line 442)

### D5. Delete Behavior (matches Java `deleteLastKeyed`)

```ts
function onDelete(): void {
  if (clickedKeys.length === 0) return; // line 504
  const last = clickedKeys[clickedKeys.length - 1];
  if (variant === 'S' || (variant === 'T' && level === 3)) {
    // trim displayed text by last.text.length characters (line 514–515)
    setDisplayed(displayed.slice(0, displayed.length - last.text.length));
  } else {
    // T-CL1/2/4: pop tilesInBuiltWord and recombine (line 517–518)
    setTilesInBuiltWord(tilesInBuiltWord.slice(0, -1));
  }
  setClickedKeys(clickedKeys.slice(0, -1));
  evaluateStatus(); // re-run colour rule
}
```

### D6. S-CL4 Unsupported

When `syllableGame === 'S'` and `challengeLevel === 4`, container MUST call `shell.goBackToCountryMenu()` immediately at mount and render nothing (Java `Colombia.java:78`).

### D7. Audio sequencing on win

```ts
shell.setInteractionLocked(true);
shell.incrementPointsAndTracker(true);
audio.playCorrect().then(() => {
  if (!isMountedRef.current) return;
  shell.replayWord();
});
```

Mirrors Java `playCorrectSoundThenActiveWordClip(false)` (line 446). Use `isMountedRef` to guard against unmount during the awaited `playCorrect`.

### D8. RTL Handling

Container does NOT call `setRotationY(180)`. Logical RN props (`marginStart`, `gap`) handle RTL automatically. The pagination arrow icons (`zz_forward_green`, `zz_backward_green`) MUST be authored with logical orientation OR mirrored via `transform: [{ scaleX: I18nManager.isRTL ? -1 : 1 }]`.

### D9. Container / Presenter Split

**`<ColombiaContainer>`** owns:
- Hooks: `useGameShell`, `useLangAssets`, `useAudio`.
- State: `attempt: string` (displayed text), `clickedKeys: WordPiece[]`, `tilesInBuiltWord: ParsedTile[]`, `keys: KeyTile[]`, `page: number`, `status: EvalResult['color']`, `error: 'insufficient-content' | null`.
- Handlers: `onKeyPress(idx)`, `onDelete()`, `onPageChange(delta)`, `onImagePress()`.
- `useMountEffect`-style kickoff: `startRound()` + `shell.setOnAdvance(startRound)`.
- **No `usePrecompute('colombia')`** — Java has no precompute; `keyList`, `tileList`, `syllableList` are loaded by language-pack runtime.

**`<ColombiaScreen>`** — pure props → JSX:
- Props: `wordImage`, `wordLabel`, `displayedText`, `displayBgColor`, `displayTextColor`, `keys: KeyTile[]`, `page`, `totalScreens`, `paginated: boolean`, `interactionLocked`, callbacks.
- No hooks beyond `useWindowDimensions`. No `react-i18next`.

## Unresolved Questions

1. **CL3-T orange exclusion (Java line 466 comment "AGH: unclear why CL=3 is excluded")** — preserve the Java behavior; this is a known quirk in the reference impl.
2. **CL2 SAD syllable mutation** — Java mutates the syllable in place (`distractorSADSyllable.text = ...`) which can leak SAD identity into duplicated entries. We MUST clone the syllable before mutation in TS to avoid aliasing the original parsed array.
3. **Pagination math: Java uses literal `33` rather than `tilesPerPage - 2`** in `keyIndex = (33 * (keyboardScreenNo - 1)) + ...`. Preserve `33` to keep parity even though `tilesPerPage = 35`.

## Testing strategy

| Area | Approach |
|---|---|
| `buildKeyboard` per (variant, CL) | Jest unit (with mock pools) |
| `evaluateStatus` (yellow/orange/gray/green/win) | Jest unit |
| Pagination math (`totalScreens`, `partial`, `keyIndex`) | Jest unit |
| Delete branches (S, T-CL3, T-CL1/2/4) | Jest unit |
| `<ColombiaContainer>` round flow per CL | Manual QA |
| `<ColombiaScreen>` | Storybook: idle, building (yellow), wrong-tile (orange), gray (overlong), win (green), paginated keyboard |
