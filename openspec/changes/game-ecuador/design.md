## Context

`Ecuador.java` (~462 LOC) shows 8 word tiles scattered randomly on the screen and a prompt (word text + image). Player taps the matching tile. No CL/syllable variation. Random non-overlapping placement is the trickiest part of the port.

### Required reading for implementers

- `AGENTS.md`, `openspec/AGENT_PROTOCOL.md`.
- `docs/ARCHITECTURE.md` §3, §11, §13.
- `docs/GAME_PATTERNS.md` (audio sequencing, container/presenter split).
- `docs/decisions/ADR-010-testing-storybook-plus-unit.md`.
- **Upstream OpenSpec changes:** `game-engine-base` (merged).
- **Source Java files:** `Ecuador.java`.

## Goals / Non-Goals

**Goals:**
- 8 random scatter tiles with non-overlapping placement (Java `setBoxes()` ~129–276).
- Match Java's word-population mechanic exactly: shuffle pool, take first 8 entries `wordPool.get(1..8)` for tile text, then OVERWRITE one random slot with `refWord` text (Java `setWords()` ~331–347).
- Preserve Java's known duplicate-tile bug (JP TODO at line 32: "FILTER DUPLICATE ANSWER CHOICES" — Java does NOT dedupe; we don't either).
- Correct/incorrect feedback per Java mechanic (`updatePointsAndTrackers(2)` on win, line ~415).
- Container/Presenter split; i18n-blind presenter.

**Non-Goals:**
- Pixel-perfect parity with Java placement RNG output (algorithm-equivalent placement; not byte-for-byte).
- Challenge-level differentiation; precompute; syllable variant.
- Filtering duplicate tile texts (Java does not).

## Decisions

### D1. Java surface → TS artifact mapping

| Java symbol (Ecuador.java line) | TS destination | Notes |
|---|---|---|
| `class Ecuador extends GameActivity` (~34) | `<EcuadorContainer>` wrapping `<GameShellContainer>` | |
| `GAME_BUTTONS` 8 entries (~44) | `tiles: ScatterTile[]` length 8 | |
| `wordPool.addAll(cumulativeStageBasedWordList)` (~105) | `wordPool: Word[]` from `useLangAssets()` | |
| `onCreate()` (~78) → `playAgain()` (~115) | `useMountEffect(() => playAgain())` | Plus `setOnAdvance(playAgain)` |
| `setBoxes()` (~129–276) | `placeTiles(...)` pure fn | See D2 |
| `setTextBoxColors()` (~320) | per-tile `bgColor: colors.hexByIndex[i % 5]` | Java cycles 5 colors mod 5 |
| `setWords()` (~331) | `pickRound(...)` pure fn | See D3 |
| `wordList.stripInstructionCharacters(word.wordInLOP)` (~337) | `stripInstructionCharacters(word.wordInLOP)` from `@shared/util-phoneme` | |
| `refWord.wordInLWC + "2"` (~341) | `wordImage = images[refWord.wordInLWC + '2']` | Variant-2 image |
| `respondToWordSelection()` (~393) | `onTilePress(text)` handler | |
| `playCorrectSoundThenActiveWordClip(false)` (~428) | `audio.playCorrect().then(() => shell.replayWord())` | Sequenced |
| `updatePointsAndTrackers(2)` (~415) | `shell.incrementPointsAndTracker(true)` | 2 points on correct |
| `playIncorrectSound()` (~440) | `audio.playIncorrect()` | |
| `clickPicHearAudio` (~449) | `onImagePress()` → `shell.replayWord()` | |
| `setAdvanceArrowToBlue()` (~413) | Implicit via `incrementPointsAndTracker` | |

### D2. Scatter Placement Algorithm (Java parity)

```ts
type ScatterTile = { word: string; x: number; y: number; width: number; height: number };

// Java setBoxes() ~129–276. Constants from Java lines 152–169:
//   minX1 = 0
//   minY1 = usableHeight * 0.22
//   maxX2 = usableWidth
//   maxY2 = usableHeight * 0.85
//   minStartX = 0
//   maxStartX = usableWidth * 0.65
//   minWidth  = usableWidth * 0.25
//   maxWidth  = usableWidth * 0.50
//   bufferX   = usableWidth * 0.05
//   bufferY   = usableHeight * 0.05
//   hwRatio   = 4   // tile height = boxWidth / 4
//   minStartY = minY1 (22%)
//   maxStartY = usableHeight * 0.75
function placeTiles(
  count: 8,
  area: { width: number; height: number },
  rng: () => number
): ScatterTile[] | null {
  // For each tile slot (0..7):
  //   coordX1 = randInt(minStartX..maxStartX)
  //   coordY1 = randInt(minStartY..maxStartY)
  //   boxWidth = randInt(minWidth..maxWidth)
  //   coordX2 = coordX1 + boxWidth
  //   coordY2 = coordY1 + boxWidth / hwRatio   // height = width/4
  //
  // Reject if (a) overlaps any prior tile (treating each tile's bounding box
  // expanded by bufferX/bufferY when comparing) OR (b) coordX2 > maxX2 OR coordY2 > maxY2.
  //
  // On reject: extraLoops++. If extraLoops < 10000, retry SAME slot (currentBoxIndex--).
  // Else reset currentBoxIndex = 0 and extraLoops = 0 (start the entire layout over).
  // Java has no terminating cap on the outer restart loop; we add a hard cap of 5 outer
  // restarts to fail safely (return null). Container retries pickRound on null.
}
```

**Java parity notes:**
- Buffer is applied only when comparing two tiles: a candidate tile overlaps a placed tile when both `(coordX2 + bufferX) >= placed[0]` AND `(coordX1 - bufferX) <= placed[2]` AND analogous Y. (See Java ~193–203 and ~217–230.)
- Out-of-bounds is checked only against `maxX2`/`maxY2`, never against `minX1`/`minY1` — the random ranges already guarantee non-negative starts.
- Java has a quirky duplicated branch at ~189–214 that compares the first tile to `boxCoordinates[0]` (uninitialized zeros) — this is a no-op for placement intent (zeros never overlap a positive tile), so we omit it but document the discrepancy.
- Tile height is computed `params.height = params.width / hwRatio` after layout (line ~268). We compute it eagerly inside placeTiles.

### D3. Round Word Population (Java parity — `setWords()` ~331–347)

```ts
function pickRound(words: Word[], rng: () => number): {
  prompt: Word;
  tileWords: Word[]; // length 8, includes prompt slot via overwrite
  correctSlot: number; // 0..7
} {
  const shuffled = shuffle(words, rng);
  const prompt = shuffled[0];                         // refWord = wordPool.get(0)
  const tileWords = shuffled.slice(1, 9);             // wordPool.get(w + 1) for w in 0..7
  const correctSlot = Math.floor(rng() * 8);          // rand.nextInt(GAME_BUTTONS.length)
  // Java OVERWRITES tileWords[correctSlot] with prompt's stripped wordInLOP, NOT replacing the Word.
  // We track the slot index and render prompt's stripped text there at presentation time.
  return { prompt, tileWords, correctSlot };
}
```

**Java parity notes:**
- Java does NOT dedupe. If `prompt.wordInLOP` (stripped) matches another tile's stripped text, two tiles will share the same text. Per JP TODO at file head, this is a known bug that we preserve.
- Java does NOT check that `tileWords[correctSlot]`'s original stripped LOP differs from prompt; the overwrite happens unconditionally.
- The shuffle is per-round; `wordPool` is a copy of `cumulativeStageBasedWordList` made once at mount (~105).

### D4. Word Display

- Prompt image: `<wordInLWC>2.png` (variant-2 image; Java line ~341).
- Tile text: `wordList.stripInstructionCharacters(word.wordInLOP)` (~337). For `correctSlot`, render `stripInstructionCharacters(prompt.wordInLOP)` (~346).
- Active-word text view (`R.id.activeWordTextView`, ~339) is rendered above/beside the image showing the prompt's stripped LOP text.
- Tile colors cycle: `colors.hexByIndex[i % 5]` (Java ~324). Tile text color `#FFFFFF`.

### D5. Correct/Incorrect Handling (Java ~393–442)

- Correct (`chosenWordText.equals(stripped(refWord.wordInLOP))`):
  - Set advance arrow to blue.
  - `updatePointsAndTrackers(2)` → `shell.incrementPointsAndTracker(true)` (2 pts).
  - All 8 tiles become non-clickable; the 7 non-correct turn `bg=#A9A9A9 fg=#000000`.
  - `playCorrectSoundThenActiveWordClip(false)` → `audio.playCorrect().then(() => shell.replayWord())`.
- Incorrect:
  - Increment `incorrectOnLevel`.
  - Track distinct wrong texts up to `visibleGameButtons - 1 = 7` slots (insertion order, no duplicates per Java ~432–440).
  - `playIncorrectSound()`; tile remains clickable.

### D6. Container / Presenter Split

**`<EcuadorContainer>`** — owns:
- `useGameShell()`, `useLangAssets()`, `useAudio()`.
- State: `prompt`, `tileWords`, `correctSlot`, `placements`, `grayed: boolean`, `wrongPicks: string[]`.
- Refs: `isMountedRef`.
- Handlers: `onTilePress(slot)`, `onImagePress()`, `onPlayAgain()`.
- `useMountEffect`: kickoff `playAgain()`; register `shell.setOnAdvance(playAgain)`.

**`<EcuadorScreen>`** — pure props → JSX:
- `promptImage: ImageSourcePropType | undefined`, `promptLabel: string`, `tiles: { text; x; y; width; height; bgColor; grayed }[]`, `interactionLocked`, `onTilePress(slot)`, `onImagePress()`.
- No hooks beyond `useWindowDimensions` for `area`; no i18n.

### D7. Audio sequencing on correct

```ts
audio.playCorrect().then(() => {
  if (!isMountedRef.current) return;
  shell.replayWord();
});
shell.incrementPointsAndTracker(true);
```

Matches Java `playCorrectSoundThenActiveWordClip(false)` (~428).

### D8. RTL handling

Java rotates `instructionsImage` and `repeatImage` 180° on Y-axis and runs `fixConstraintsRTL` (~85–93). RN: container/screen do not flip layout manually. Logical props (`marginStart`, `gap`) are RTL-aware. The chrome icons inherit RN's automatic RTL flip.

### D9. Insufficient-content fallback

If `placeTiles` returns null after the outer-restart cap (5 attempts) or `wordPool.length < 9`, render an empty/locked screen (`error: 'insufficient-content'`).

## Unresolved Questions

1. **Outer-restart cap.** Java has unbounded outer restart on placement failure (~252). We cap at 5 to avoid infinite loops in degenerate sizes; confirm 5 is enough on smallest target (320×480).
2. **Duplicate-tile bug parity.** Confirm we preserve Java's behavior of allowing the prompt's stripped text to coincide with another tile's stripped text (a single tap on either matches `correctString`, so two slots can both be "correct" in the wild). User direction: "match java".

## Testing strategy

| Area | Approach |
|---|---|
| `placeTiles` non-overlap invariant (with buffers) | Jest unit — fuzz with seeded RNG |
| `placeTiles` returns null after cap | Jest unit |
| `pickRound` (correctSlot in [0,8), tileWords length 8) | Jest unit |
| `pickRound` does NOT dedupe (Java parity) | Jest unit |
| Tile color cycle `i % 5` | Jest unit |
| `<EcuadorContainer>` round flow | Manual QA on `engEnglish4` |
| `<EcuadorScreen>` | Storybook stories: fresh round, wrong tap (1 grayed text tracked), won state |
