## Context

`Georgia.java` (~455 LOC) is a first-sound identification game. Player taps the tile (or syllable) that begins the prompt word from a 6/12/18-grid of choices. CL controls choice count and difficulty band:

- **CL 1–6 (T):** first-sound = `parsedTiles[0]` (start tile).
- **CL 7–12 (T):** first-sound = first non-LV tile (relevant for Thai/Lao); special PC handling.
- **CL 1–6 (S):** first-sound = `parsedSyllables[0]`.

Within each band: positions 1/4/7/10 → 6 tiles, 2/5/8/11 → 12, 3/6/9/12 → 18. Position 1–3/7–9 use random distractors; 4–6/10–12 use distractor-trio + similar-prefix.

### Required reading for implementers

- `AGENTS.md`, `openspec/AGENT_PROTOCOL.md`.
- `docs/ARCHITECTURE.md` §3, §11, §13.
- `docs/GAME_PATTERNS.md` (distractor-trio pattern, Java off-by-one quirks).
- `docs/decisions/ADR-010-testing-storybook-plus-unit.md`.
- **Upstream OpenSpec changes:** `game-engine-base` (merged).
- **Source Java files:** `Georgia.java`. `Start.java` for `CorV`/`tileHashMap`/`syllableHashMap`/`parseWordIntoTiles`/`parseWordIntoSyllables`.

## Goals / Non-Goals

**Goals:**
- 12 tile CLs (CL1–6 first-tile, CL7–12 first-non-LV) + 6 syllable CLs.
- Correct-tile derivation per CL band: simple first-tile vs. first-non-LV-tile (with PC→preceding-LV rule).
- Word filter (TILE variant only): `CorV.contains(initialTile)`; retry recursively.
- Match Java's `nextInt(CorV.size() - 1)` off-by-one in distractor-fill loops (preserved as quirk).
- Container/Presenter split; i18n-blind presenter.

**Non-Goals:**
- Audio of the isolated first sound (Java does not play it).
- New CL semantics not present in Java.
- Word filter for SYLLABLE variant (Java does not apply CorV check on S).

## Decisions

### D1. Java surface → TS artifact mapping

| Java symbol (Georgia.java line) | TS destination | Notes |
|---|---|---|
| `parsedRefWordTileArray` (~176) | `parsedTiles: Tile[]` | |
| `parsedRefWordSyllableArray` (~174) | `parsedSyllables: Syllable[]` (S only) | |
| `initialTile` (~52) | `correct: string` state | Per band; see D3 |
| `initialSyllable` (~53) | `correct: string` (S branch) | |
| `CorV` (~19) | `corV: Tile[]` (precompute) | C and V tiles only |
| `tileHashMap.get(tile).distractors` | `tile.distractors` (3 entries; pre-existing) | |
| `syllableHashMap.get(syl).distractors` | `syllable.distractors` (3 entries) | |
| `syllableListCopy = syllableList.clone()` (~129) | `syllablePool` shuffled per round (~153) | Mutated each round |
| `setWord()` (~173) | `pickWord(...)` recursive picker | See D3, D5 |
| `setUpTiles()` (~288) | `buildTileChoices(level, correct, corV, rng)` pure fn | See D4 |
| `setUpSyllables()` (~198) | `buildSyllableChoices(level, correct, syllablePool, rng)` pure fn | See D4 |
| `respondToTileSelection()` (~398) | `onChoice(text)` handler | |
| `playActiveWordClip(false)` (~161) | `shell.replayWord()` at round start | |
| `playCorrectSoundThenActiveWordClip(false)` (~432) | `audio.playCorrect().then(() => shell.replayWord())` | |
| `playIncorrectSound()` (~433) | `audio.playIncorrect()` | |
| `updatePointsAndTrackers(1)` (~416) | `shell.incrementPointsAndTracker(true)` (1 pt) | |

### D2. Visible Choice Count (Java parity, ~112–127)

```ts
function countForLevel(level: number): 6 | 12 | 18 {
  // Java switch: 11/8/5/2 → 12; 12/9/6/3 → 18; default → 6.
  // Equivalent: level % 3 === 1 → 6, level % 3 === 2 → 12, level % 3 === 0 → 18.
  const m = level % 3;
  return m === 1 ? 6 : m === 2 ? 12 : 18;
}
```

### D3. Correct Tile Derivation (Java `setWord` ~173–195)

| CL band | Variant | `correct` |
|---|---|---|
| 1–6 | T | `parsedTiles[0]` |
| 7–12 | T | walk `parsedTiles` advancing past LV-typed tiles. Stop at first non-LV. **If the stop tile is `PC`:** use `initialLV` (the most recent LV passed) if non-null; else use `parsedTiles[t+1]` (the tile after the PC). |
| 1–6 | S | `parsedSyllables[0]` |

```ts
// Java parity: lines 177–186. The PC check applies to the FIRST NON-LV tile, not parsedTiles[0].
function correctForTile(parsed: Tile[], level: number): Tile {
  if (level <= 6) return parsed[0];
  let t = 0;
  let initialTile = parsed[0];
  let initialLV: Tile | null = null;
  while (initialTile.typeOfThisTileInstance === 'LV' && t < parsed.length - 1) {
    initialLV = initialTile;
    t++;
    initialTile = parsed[t];
  }
  if (initialTile.typeOfThisTileInstance === 'PC' && t < parsed.length) {
    if (initialLV !== null) return initialLV;
    return parsed[t + 1];
  }
  return initialTile;
}
```

### D4. Choice Pool per CL Band

#### T (tile) random branch — CL 1, 2, 3, 7, 8, 9 (Java ~351–373)

Per slot `t < visibleGameButtons`:

```ts
let randomNum = floor(rng() * corV.length);             // Java: nextInt(CorV.size()) — NO off-by-one here
let text = corV[randomNum].text;
while (stringsAdded.includes(text)) {                   // dedupe
  randomNum = floor(rng() * corV.length);
  text = corV[randomNum].text;
}
stringsAdded.push(text);
// After loop, if stringsAdded does NOT include initialTile.text → set correctTileRepresented = false
```

If `correctTileRepresented` is false at the end, overwrite `GAME_BUTTONS[rand.nextInt(visibleGameButtons - 1)]` with `initialTile.text` (Java ~391–395). **This `nextInt(visibleGameButtons - 1)` excludes the last visible button — preserve.**

#### T (tile) hard branch — CL 4, 5, 6, 10, 11, 12 (Java ~294–339)

Build a `Set` then index it as a list:

```ts
const set = new Set<string>([
  initialTile.text,
  initialTile.distractors[0],
  initialTile.distractors[1],
  initialTile.distractors[2],
]);
// Pass A: tiles with same FIRST TWO chars (only if both lengths >= 2)
let i = 0;
while (set.size < N && i < corV.length) {
  const idx = floor(rng() * (corV.length - 1));         // Java: nextInt(CorV.size() - 1) — OFF BY ONE
  const opt = corV[idx].text;
  if (opt.length >= 2 && initialTile.text.length >= 2 &&
      opt[0] === initialTile.text[0] && opt[1] === initialTile.text[1]) {
    set.add(opt);
  }
  i++;
}
// Pass B: tiles with same FIRST char OR same LAST char
i = 0;
while (set.size < N && i < corV.length) {
  const idx = floor(rng() * (corV.length - 1));         // OFF BY ONE
  const opt = corV[idx].text;
  if (opt[0] === initialTile.text[0]) set.add(opt);
  else if (opt[opt.length - 1] === initialTile.text[initialTile.text.length - 1]) set.add(opt);
  i++;
}
// Pass C: pure random fill
while (set.size < N) {
  const idx = floor(rng() * (corV.length - 1));         // OFF BY ONE
  set.add(corV[idx].text);
}
const list = [...set];                                  // insertion order — correct is at index 0
```

In hard branch, `correctTileRepresented` is unconditionally set true at end of for-loop (Java ~387) — no fallback overwrite for hard.

#### S (syllable) random branch — CL 1, 2, 3 (Java ~247–259)

Per slot `t < visibleGameButtons`:

```ts
gameButton.setText(syllablePool[t].text);    // sequential after Collections.shuffle (Java ~153)
```

After loop, if no slot's text equals `initialSyllable.text`, overwrite `GAME_BUTTONS[rand.nextInt(visibleGameButtons - 1)]` with `initialSyllable.text` (Java ~279–284). Same off-by-one preserved.

#### S (syllable) hard branch — CL 4, 5, 6 (Java ~204–235)

```ts
const set = new Set<string>([
  initialSyllable.text,
  initialSyllable.distractors[0],
  initialSyllable.distractors[1],
  initialSyllable.distractors[2],
]);
let i = 0;
while (set.size < N && i < syllablePool.length) {
  const opt = syllablePool[i].text;
  if (opt.length >= 2 && initialSyllable.text.length >= 2) {
    if (opt[0] === initialSyllable.text[0] && opt[1] === initialSyllable.text[1]) set.add(opt);
    else if (opt[0] === initialSyllable.text[0]) set.add(opt);
  } else {
    if (opt[0] === initialSyllable.text[0]) set.add(opt);
    else if (opt[opt.length - 1] === initialSyllable.text[initialSyllable.text.length - 1]) set.add(opt);
  }
  i++;
}
// Pure-random fill from syllablePool sequentially:
let j = 0;
while (set.size < N) {
  set.add(syllablePool[j].text);
  j++;
}
```

S hard branch iterates `syllablePool` sequentially (NOT random index) — distinct from T hard branch's `rand.nextInt(CorV.size() - 1)`. After list rendering, if `challengingAnswerChoicesList[t] === initialSyllable.text` for any visible slot, mark represented; else fallback overwrite at random visible slot.

### D5. Word Filter (TILE variant only)

Java line 188: `if (!CorV.contains(initialTile)) { setWord(); }` — recursive retry, **inside the else (non-S) branch only**. The S variant does NOT apply CorV filtering.

```ts
function pickWord(rng, attempts = 0): Word {
  if (attempts > 50) throw 'insufficient-content';
  const refWord = chooseWord(rng);
  if (variant === 'S') return refWord;          // no CorV filter for S
  const parsed = parseWordIntoTiles(refWord);
  const correct = correctForTile(parsed, level);
  if (!corV.includes(correct)) return pickWord(rng, attempts + 1);
  return refWord;
}
```

### D6. Container / Presenter Split

**`<GeorgiaContainer>`** — owns:
- `usePrecompute('georgia')`, `useGameShell()`, `useLangAssets()`, `useAudio()`.
- State: `prompt`, `parsed`, `correct`, `choices: { text; bgColor; grayed }[]`, `revealed: boolean`, `wrongPicks: string[]`.
- Refs: `isMountedRef`.
- Handlers: `onChoicePress(text)`, `onImagePress() = shell.replayWord()`, `onPlayAgain()`.
- `useMountEffect`: kickoff `playAgain()`; register `shell.setOnAdvance(playAgain)`.
- On round start: `audio.playWord(refWord.wordInLWC)` (Java `playActiveWordClip(false)` ~161).

**`<GeorgiaScreen>`** — pure props → JSX:
- `wordImage`, `wordText (only after reveal)`, `choices: TileChoice[]`, `gridShape: '6'|'12'|'18'`, `interactionLocked`, `onChoicePress(text)`, `onImagePress()`.
- Hidden buttons (slots `>= visibleGameButtons`) render `String(t+1)` with bordered/black-text style and are non-interactive (Java ~254–259, ~270–275, ~368–373, ~381–386). Presenter MAY render only visible slots; spec only requires count parity.
- No hooks; no i18n.

### D7. Precompute: `georgiaPreProcess`

```ts
type GeorgiaData = {
  corV: Tile[];   // C and V tiles only — built from tileList filtered by typeOfThisTileInstance ∈ {C, V}
};
```

Hard-band similar-prefix lookups are computed at runtime per round (matches Java).

### D8. Audio sequencing on correct

```ts
audio.playCorrect().then(() => {
  if (!isMountedRef.current) return;
  shell.replayWord();
});
shell.incrementPointsAndTracker(true);
```

Matches Java `playCorrectSoundThenActiveWordClip(false)` (~432).

### D9. Reveal text on correct

Java line ~414: `fullWordTextView.setText(stripInstructionCharacters(refWord.wordInLOP)); setVisibility(VISIBLE)`. Until correct, the full-word text is empty/invisible.

## Java parity notes (quirks preserved)

1. **`nextInt(CorV.size() - 1)` off-by-one** in T hard branch passes A/B/C and in tile/syllable fallback overwrite — last entry of pool is never picked. Preserve.
2. **T random branch uses `nextInt(CorV.size())`** (no off-by-one). The contrast with hard branch is intentional in Java.
3. **S random branch is sequential** after `Collections.shuffle(syllableListCopy)` — equivalent to `syllablePool.slice(0, visibleGameButtons)`.
4. **CorV filter is TILE-only.** Java's `setWord()` recursion lives inside the non-syllable branch.
5. **PC fallback `parsed[t+1]`** when `initialLV == null` and the first non-LV is PC — would IOB for a 1-tile word; Java doesn't guard. We retain Java behavior; in practice CorV filter discards such words.
6. **`syllableListCopy.clone()`** is shuffled once at mount (~129) and re-shuffled at each `playAgain` (~153). The Java random branch indexes this re-shuffled list by tile slot.
7. **`correctTileRepresented` fallback writes** to `GAME_BUTTONS[rand.nextInt(visibleGameButtons - 1)]` — last visible slot is never the fallback. Preserve.

## Unresolved Questions

1. **`parseWordIntoSyllables` API.** Confirm `Start.syllableList.parseWordIntoSyllables(refWord)` returns `Syllable[]` matching `parsedRefWordSyllableArray`. (Cross-reference `Start.java`.)
2. **`Tile.distractors` shape on syllables.** Confirm syllable distractor list always has at least 3 entries (Java unconditionally indexes 0/1/2 at ~205–207).
3. **Chrome buttons (slots `>= visibleGameButtons`).** Java renders them invisible+non-clickable but still in layout. RN: easier to omit. Spec leaves this implementation-defined.

## Testing strategy

| Area | Approach |
|---|---|
| `countForLevel` covers all 12 CLs | Jest unit |
| `correctForTile` (CL1–6 → parsed[0]; CL7–12 LV-skip; PC→initialLV; PC→parsed[t+1] when initialLV null) | Jest unit |
| T random branch dedup + fallback overwrite | Jest unit (seeded RNG) |
| T hard branch 3-pass set fill, off-by-one preserved | Jest unit |
| S random branch is sequential post-shuffle | Jest unit |
| S hard branch length≥2 vs <2 paths | Jest unit |
| CorV filter retries on T but not S | Jest unit |
| `<GeorgiaContainer>` round flow | Manual QA across CL1, CL4, CL7, CL10, S-CL1, S-CL4 |
| `<GeorgiaScreen>` | Storybook stories: 6/12/18 grid sizes, won state with revealed text |
