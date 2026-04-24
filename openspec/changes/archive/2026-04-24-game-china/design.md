## Context

China.java (390 LOC) is the first concrete game ported. It's a 4×4 sliding-tile puzzle — a "Game of 15" variant — rendered side-by-side with a vertical strip of 4 word-image prompts. The 15 non-blank tiles contain letter/character glyphs drawn from 3 four-tile words + 1 three-tile word; the player slides tiles into row-aligned sequences to form the four prompted words.

This change exists primarily to **prove `feature-game-shell` end-to-end**. Writing the first concrete game exposes any gap in the shell API before a second game is attempted. It also establishes the code pattern that every future concrete-game change (`game-chile`, `game-thailand`, …) mirrors: a `feature-game-<country>` lib with `<Container>` + `<Screen>`, an optional precompute registration, and a `apps/alphaTiles/app/games/<country>.tsx` route.

The Cantonese-compatible angle: China's mechanic is script-neutral. Tiles are whatever the pack declares in `aa_gametiles.txt`; words are whatever is in `aa_wordlist.txt`; audio plays via the shell. A Cantonese pack with Jyutping tiles or Hanzi tiles works without code changes as long as `util-phoneme.parseWordIntoTiles` yields 3-tile and 4-tile words.

### Required reading for implementers

- `AGENTS.md` — entry doc; read first.
- `openspec/AGENT_PROTOCOL.md` — pickup protocol.
- `docs/ARCHITECTURE.md` §3 (taxonomy), §11 (container/presenter), §13 (routing), §14 (game taxonomy — China is an exemplar).
- `docs/decisions/ADR-010-testing-storybook-plus-unit.md` — for testing posture (feature libs: pure logic Jest, rendering Storybook).
- **Upstream OpenSpec changes (must be merged before starting):**
  - `game-engine-base` — provides `<GameShellContainer>`, `<GameShellScreen>`, `util-phoneme`, `data-progress`.
  - Transitively: all of game-engine-base's upstreams (audio, theme, i18n, analytics, lang-assets, util-precompute).
  - Read `openspec/changes/game-engine-base/design.md` in full.
- **Source Java files being ported** (absolute paths):
  - `../AlphaTiles/app/src/main/java/org/alphatilesapps/alphatiles/China.java` (~389 LOC) — the mechanic being ported.
  - `../AlphaTiles/app/src/main/java/org/alphatilesapps/alphatiles/GameActivity.java` — for inherited behavior that the shell now provides.
  - `../AlphaTiles/app/src/main/java/org/alphatilesapps/alphatiles/Start.java` — `parseWordIntoTiles` reference.
  - `../AlphaTiles/app/src/main/res/layout/china.xml` — layout reference (4×4 grid + 4 word-image strip).
- **Fixture paths** (absolute, under `../PublicLanguageAssets/`):
  - `../PublicLanguageAssets/engEnglish4/res/raw/aa_wordlist.txt` — 3-tile and 4-tile words must exist post-parse.
  - `../PublicLanguageAssets/engEnglish4/res/raw/aa_gametiles.txt` — tile list.
  - `../PublicLanguageAssets/engEnglish4/res/raw/aa_games.txt` — locate the China row(s) and its `challengeLevel` + `instructionAudioName`.
  - `../PublicLanguageAssets/engEnglish4/res/raw/zzz_china*.mp3` — instruction audio (if present).
  - `../PublicLanguageAssets/engEnglish4/res/drawable/<word>.png` — word images for the right-hand strip.

## Goals / Non-Goals

**Goals:**

- Port `China.java` mechanic faithfully: 4×4 board, 1 three-tile + 3 four-tile words, challenge-level-scaled shuffle (`5/10/15` moves for levels `1/2/3`), row-solve detection, correct-final sound on all-rows-solved.
- Register a precompute that buckets the pack's `wordList` into 3-tile and 4-tile sets once at boot.
- Compose with `feature-game-shell` via the `children` slot — no shell behavior is re-implemented.
- Stay under 500 LOC in the feature lib (matching the Java source's relative slimness vs. `GameActivity`).
- Document how a future Cantonese pack plugs in without code changes.

**Non-Goals:**

- Syllable-mode variant (`SyllOrTile = S`) — deferred until a pack demands it.
- Animated slides — Android does not animate and neither does this port.
- Win-state celebration owned by China — celebration triggers happen in the shell at the 12-tracker boundary, not per-board-solve.
- Unit testing the full React tree — `type:feature` row of ADR-010 has no mandatory automated tests; pure logic has Jest, rendering has Storybook.

## Decisions

### D1. Java surface → TS artifact mapping (China.java, 389 lines)

| Java symbol | TS destination | Notes |
|---|---|---|
| `public class China extends GameActivity` | `feature-game-china/src/ChinaContainer.tsx` wrapping `<GameShellContainer>` | |
| `ArrayList<Word> threeFourTileWords`, `threeTileWords`, `fourTileWords`, `Word oneThreeTileWord` | `useChinaGameState()` hook (container-local) | 3-tile/4-tile buckets come from precompute cache (boot-time, not per-game) |
| `Boolean[] solvedLines = new Boolean[4]` | `solvedLines: boolean[]` state (`useState`, length-4) | |
| `TextView blankTile` | `blankTileIndex: number` state | track by index 0..15 |
| `int moves` | derived from `challengeLevel` via D2 below | |
| `GAME_BUTTONS[]`, `WORD_IMAGES[]` | N/A — RN indexes by array position, not view id | |
| `hideInstructionAudioImage()` | `showInstructionsButton={false}` passed to `<GameShellContainer>` (ports `China.java:48`) | |
| `getAudioInstructionsResID()` | `instructionAudioName={gameList[gameNumber-1].instructionAudioName}` prop to shell | shell resolves ID via `useAudio().resolveInstruction(name)` |
| `onCreate(Bundle)` | `<ChinaContainer>` mount + `useMountEffect` calling `playAgain()` | |
| `context = this; setContentView(R.layout.china)` | N/A — RN renders the tree | |
| `ActivityLayouts.applyEdgeToEdge(…)`, `setStatusAndNavColors(…)` | N/A — theme-fonts change handles status bar at app shell | |
| `if (scriptDirection.equals("RTL"))` block | N/A — logical props in `<GameBoard>` handle RTL automatically |
| `visibleGameButtons = 16` | constant `VISIBLE_BUTTONS = 16` |
| `updatePointsAndTrackers(0)` initial call | shell shows points/trackers unconditionally; no explicit kick needed |
| `playAgain()` | `startRound()` function in container — resets `solvedLines`, calls `chooseWords()` + `setUpTiles()` |
| `repeatGame(View)` | `onRepeatPress` handler wired to shell's advance-arrow action |
| `chooseWords()` | pure `chooseWords(threeTileWords, fourTileWords, rng)` helper in `feature-game-china/src/chooseWords.ts` |
| `preprocessWords()` | `buildChinaData(assets)` precompute — registered via `util-precompute` at module load |
| `setUpTiles()` | pure `setUpTiles({ threeTileWord, fourTileWords, moves, rng })` in `setUpTiles.ts`; returns `{ boardText: string[16], blankIndex: number }` |
| `swapTiles(t1, t2)` | pure `swapTiles(board, indexA, indexB)` in `swapTiles.ts`; returns `{ board, blankIndex }` |
| `respondToTileSelection(int justClickedTile)` | `onTilePress(index)` handler in container |
| `onBtnClick(View)` | maps to `<Tile onPress={() => onTilePress(i)} />` |
| `checkLineForSolve(int tileInRowToCheck)` | pure `checkRowSolved(board, row, targetWord, blankIndex, scriptType, tileList)` in `checkRowSolved.ts` — uses `util-phoneme.combineTilesToMakeWord` + `standardizeWordSequence` |
| `areAllLinesSolved()` | trivial: `solvedLines.every(Boolean)` |
| `isSlideable(int tileNo)` | pure `isSlideable(tileIndex, blankIndex, columns=4)` in `isSlideable.ts` |
| `clickPicHearAudio(View)` | `onImagePress(index)` handler — calls `shell.replayWord(words[index])` |
| `updatePointsAndTrackers(4)` on win | `shell.incrementPointsAndTracker(4)` — `+4` matches Java line 262 |
| `playCorrectFinalSound()` | `shell.playCorrectFinal()` on win (after increment) |

### D2. Challenge-level decoding

`China.java:111–120` maps `challengeLevel` to shuffle-move count:

- `1` → 5 moves (default)
- `2` → 10 moves
- `3` → 15 moves

This is decoded locally in the container via a simple constant:

```ts
const MOVES_BY_CHALLENGE: Record<number, number> = { 1: 5, 2: 10, 3: 15 };
const moves = MOVES_BY_CHALLENGE[challengeLevel] ?? 5;
```

No other interpretation of `challengeLevel` for China exists in the Java source. (Contrast with Thailand's 3-digit encoding; China's is a simple 1..3 difficulty scale.)

### D3. Precompute: word bucketing by tile count

The board requires 1 three-tile word + 3 four-tile words. Bucketing the pack's `wordList` by parsed-tile-count is expensive (one `parseWordIntoTilesPreliminary` per word) and pack-immutable — ideal for `util-precompute`.

```ts
// libs/alphaTiles/feature-game-china/src/buildChinaData.ts
import { registerPrecompute } from '@alphaTiles/util-precompute';
import { parseWordIntoTiles } from '@alphaTiles/util-phoneme';

export type ChinaData = {
  threeTileWords: Word[];
  fourTileWords: Word[];
};

function buildChinaData(assets: LangAssets): ChinaData {
  const scriptType = assets.langInfo.scriptType;
  const three: Word[] = [];
  const four: Word[] = [];
  for (const word of assets.wordList) {
    const tiles = parseWordIntoTiles(word.wordInLOP, assets.tileList, word, scriptType);
    if (tiles.length === 3) three.push(word);
    else if (tiles.length === 4) four.push(word);
  }
  return { threeTileWords: three, fourTileWords: four };
}

registerPrecompute('china', buildChinaData);
export { buildChinaData };
```

Read in the container: `const chinaData = usePrecompute<ChinaData>('china');`.

This matches `docs/ARCHITECTURE.md §9` and is the first real consumer of the `port-foundations` precompute registry.

### D4. `chooseWords` — pure selection

Ports `China.java:130–156`. Returns a deterministic selection given an RNG.

```ts
export function chooseWords({
  threeTileWords,
  fourTileWords,
  rng = Math.random,
}: {
  threeTileWords: Word[];
  fourTileWords: Word[];
  rng?: () => number;
}): { threeTileWord: Word; fourTileWords: [Word, Word, Word] } | { error: 'insufficient-content' };
```

Guardrail: Java logs and silently returns when the pools are too small. Port returns an explicit `{ error: 'insufficient-content' }` discriminated union. Container renders a friendly error screen with a back button.

### D5. `setUpTiles` — pure board construction + shuffle

Ports `China.java:171–221`. Accepts the four words + the move count + an RNG; returns the final 16-element `boardText` array and `blankIndex`.

Shuffle logic: pick a random tile index, verify `isSlideable(idx) && idx !== lastSwappedIdx`, `swapTiles`, decrement `moves`. Loop until `moves === 0`. Deterministic with injected RNG for tests.

```ts
export function setUpTiles({
  threeTileWord,
  fourTileWords,
  parseWordIntoTiles,     // injected to avoid importing util-phoneme directly
  moves,
  rng = Math.random,
}): { boardText: string[]; blankIndex: number };
```

Java's invariant `tiles.size() !== 15` re-runs `chooseWords()` + `setUpTiles()` (recursive call at lines 189–193). Port hoists this to the caller — the container calls `chooseWords` + `setUpTiles` in a `while` loop bounded by 5 retries; after 5 failures it shows the insufficient-content error. This avoids stack-grown infinite recursion on malformed packs.

### D6. `checkRowSolved` — pure row-solve detection

Ports `China.java:278–335`. Given the board and a row (0..3), returns whether the row matches the target word. The complication: row 3 (the bottom row, index 12..15) holds the three-tile word and is only considered solved when the blank is at index 14 or 15 — i.e. `|c|a|t| |` or `| |c|a|t|`, never `|c| |a|t|` or `|c|a| |t|` (China.java:300–304).

```ts
export function checkRowSolved({
  board,
  row,            // 0..3
  targetWord,
  blankIndex,
  tileList,
  scriptType,
}): boolean;
```

Row visual feedback (green on solved, black on unsolved, white on blank) is computed in the container as `rowColors: ('solved' | 'unsolved' | 'blank')[][]` and passed to `<ChinaScreen>`.

### D7. `isSlideable` — pure slideability predicate

Ports `China.java:348–373`. On a 4-column board, tile at `index` is slideable iff its 4-connected neighbor (up/down/left/right, respecting row boundaries) is the blank.

```ts
export function isSlideable(index: number, blankIndex: number, columns = 4): boolean;
```

### D8. Container / Presenter split

**`<ChinaContainer>`** — owns:

- `useGameShell()` — reads `refWord` setter, score helpers, audio replay, interaction lock.
- `usePrecompute<ChinaData>('china')` — the 3-tile/4-tile buckets.
- `useLangInfo()` — `scriptType`.
- `useTileList()` — the pack's full tile list (for `checkRowSolved`).
- `useState` for `board: string[]`, `blankIndex: number`, `solvedLines: boolean[]`, `moves: number`, `currentWords: {threeTile, four[0], four[1], four[2]}`.
- Event handlers: `onTilePress(i)`, `onImagePress(i)`, `onRepeatPress()`.

**`<ChinaScreen>`** — pure props → JSX:

```tsx
type ChinaScreenProps = {
  board: string[];               // length 16
  blankIndex: number;
  rowColors: ('solved' | 'unsolved' | 'blank')[][];  // 4 rows × 4 cells
  wordImages: Array<{ src: ImageSourcePropType; label: string }>;  // length 4
  interactionLocked: boolean;
  onTilePress: (index: number) => void;
  onImagePress: (index: number) => void;
};
```

Renders a `<GameBoard columns={4}>` of 16 `<Tile>`s plus a vertical strip of 4 `<Tile imageSource={…}>`. The screen has zero hook imports and zero i18n imports.

### D9. Route

`apps/alphaTiles/app/games/china.tsx`:

```tsx
import { ChinaContainer } from '@alphaTiles/feature-game-china';
import { useLocalSearchParams } from 'expo-router';

export default function ChinaRoute() {
  const params = useLocalSearchParams();
  return <ChinaContainer {...params} />;
}
```

(Exact param shape matches the route declared by `game-engine-base`.)

### D10. Cantonese-compatibility path

The mechanic uses `aa_wordlist.txt` + `aa_gametiles.txt` exclusively — nothing script-specific is baked in. A Cantonese pack's plug-in checklist (**no code change**):

1. Content team produces a Cantonese pack with Jyutping or Hanzi tile glyphs in `aa_gametiles.txt` and Cantonese words in `aa_wordlist.txt`.
2. Pack includes door 88 in its `aa_games.txt` with `Country = China, ChallengeLevel = 1, SyllOrTile = T`.
3. Repo adds a `yue` → `yueCantonese` mapping in `tools/rsync-lang-packs.ts` (per `lang-pack-sourcing` capability) and an `eas.json` profile.
4. `APP_LANG=yue nx start alphaTiles` works; door 88 plays the Cantonese China game.

Script-type handling: if a Cantonese pack sets `aa_langinfo.txt` `Script type = Chinese`, it SHOULD also ship a `registerScriptParser('Chinese', …)` call from a new `libs/alphaTiles/util-phoneme-chinese` lib (or equivalent). Until that lands, the default parser is used — acceptable for Jyutping (Latin-script, decomposes cleanly) but may fail for Hanzi (where a single character can map to multiple tiles). This path is a **future change**, not a blocker for this one.

### D11. Testing strategy

| Area | Approach |
|---|---|
| `chooseWords`, `setUpTiles`, `checkRowSolved`, `isSlideable`, `swapTiles`, `buildChinaData` | Jest unit tests with seeded RNG and a minimal fixture (5 tiles, 10 words) |
| `ChinaContainer` | No automated tests (per ADR-010) — manual QA against `engEnglish4` pack |
| `ChinaScreen` | Storybook stories at states: fresh shuffle, mid-game, row-3-solved, all-rows-solved, insufficient-content error |
| End-to-end (eng) | Manual: launch `APP_LANG=eng nx start alphaTiles`, navigate to Earth → door 88, play a round |

## Risks / Trade-offs

### R1. Small packs with insufficient 3-tile / 4-tile words

English fixture has plenty; minority packs may not. `chooseWords` returns `{ error: 'insufficient-content' }` instead of crashing; container renders an error screen. Downstream `lang-pack-validator` (future change) can add a pack-level warning for packs that can't support China.

### R2. Tile-size layout on narrow screens

16 tiles + 4 image prompts in portrait leaves narrow tile cells on small phones. Android layout uses `layout_constraintDimensionRatio="1"` per tile to keep them square even at tight widths. Port mirrors via the `<GameBoard>` cell-aspect constraint. If cells become unreadable on e.g. a 320×480 device, adjust via a `useWindowDimensions`-driven font-size scale inside `<Tile>` (already provided by `ui-tile`'s `adjustsFontSizeToFit`).

### R3. Board swap vs. TextView swap (Java) vs. immutable array (TS)

Java's `swapTiles` mutates two TextViews' text and the `blankTile` reference. Port uses an immutable `string[16]` board + a `blankIndex`, re-rendered on each swap. Correctness is the same; performance on 16 cells is trivial.

### R4. Row 3 blank-position constraint

`China.java:300–304`: row 3 ("the three-tile word row") only accepts the blank at index 14 or 15, not 12 or 13. Port's `checkRowSolved` must respect this or the bottom row will flash "solved" on any permutation that combines to the right characters. Explicit test coverage for this branch.

### R5. The Java code uses `String.valueOf(blankTile.getTag())`

Ports to indexed math in TS — no string parsing of view tags.

## Migration Plan

Purely additive. No existing users, no data migration. Depends on `game-engine-base` landing first.

## Open Questions

_None blocking._ Noted for follow-up:

- When the first Cantonese pack ships, confirm that door-88 in `aa_games.txt` uses `SyllOrTile = T` (word-tile mode). If instead it uses `SyllOrTile = S`, `feature-game-china` needs a syllable-mode branch (read from `aa_syllables.txt` instead of `aa_gametiles.txt`). This is a future-change concern; the current v1 fixtures are all `T`.
- Final design of the per-game "insufficient content" error screen — copy and layout to be confirmed with design. Placeholder is fine for v1.
