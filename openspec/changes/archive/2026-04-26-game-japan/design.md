## Context

Japan.java (561 lines) is a syllable-segmentation game. The word is parsed into tiles displayed in a horizontal row with "link buttons" (dots/separators) between adjacent tiles. The player taps link buttons to join tiles into groups and taps joined tiles to separate them. The goal is to match the word's correct syllable structure.

Java line landmarks: `onCreate` 71-115; `play` 117-189; `displayRefWord` 191-197; `displayTileChoices` 199-217; `onClickLinkButton` 233-236; `onClickTile` 238-241; `separateTiles` 253-444; `removeSADFromWordInLOP` 446-452; `evaluateCombination` 454-526; `joinTiles` 529-560.

### Required reading for implementers

- `AGENTS.md` — entry doc; read first.
- `openspec/AGENT_PROTOCOL.md` — pickup protocol.
- `docs/ARCHITECTURE.md` §3 (taxonomy), §11 (container/presenter), §13 (routing).
- `docs/decisions/ADR-010-testing-storybook-plus-unit.md`.
- **Upstream OpenSpec changes:** `game-engine-base` (merged).
- **Source Java files:**
  - `Japan.java` — full mechanic. Layout IDs: `japan_7` (L1, up to 7 tiles), `japan_12` (L2, up to 12 tiles).
  - `GameActivity.java` — inherited `chooseWord`, `parsedRefWordTileArray`, `parsedRefWordSyllableArray`.

## Goals / Non-Goals

**Goals:**
- Port Japan tile-linking mechanic: join/separate tiles via link buttons, partial-credit syllable matching.
- `challengeLevel` controls layout: L1 → max 7 tiles, L2 → max 12 tiles.
- Landscape-only orientation.
- Container/Presenter split; i18n-blind presenter.

**Non-Goals:**
- Portrait orientation.
- Audio per partial syllable match.
- Multiple-choice distractors (there are none in Japan).

## Decisions

### D1. Java surface → TS artifact mapping

| Java symbol (line) | TS destination | Notes |
|---|---|---|
| `class Japan extends GameActivity` (24) | `JapanContainer.tsx` | |
| `parsedRefWordTileArray` after `removeAll(SAD)` (122-123) | `tiles: string[]` state | Tile texts in order, SAD stripped |
| `parsedRefWordSyllableArray` (124-129) | `correctSyllables: string[][]` state | Each syllable = array of tile texts; SAD-string syllables removed |
| `finalCorrectLinkButtonIDs` (175-181) | `correctBoundaries: number[]` state | Boundary indices computed by accumulating tile-counts per re-parsed syllable |
| `currentViews` joined/separated state (132) | `groups: TileGroup[]` state | Interleaved tile/link-button list mirrors Java |
| `joinTiles(linkButton)` (529-560) | `onJoin(boundaryIndex)` handler | Hides link button, merges adjacent tiles |
| `separateTiles(tile)` (253-444) | `onSeparate(tileIndex)` handler | Restores link buttons on one or both sides of clicked tile (peel, not full split) |
| `evaluateCombination()` (454-526) | `evaluateGroupings()` after every join/separate | Win check + partial green-locking |
| `removeSADFromWordInLOP` (446-452) | `stripSAD(word)` helper | Strip SAD chars before comparison |
| `playCorrectSoundThenActiveWordClip(false)` (468) | `shell.playCorrectThenWord()` on win | Correct chime first, then word audio |
| `updatePointsAndTrackers(1)` (469) | `shell.incrementPointsAndTracker(1)` on win | Called after correct sound trigger |

### D2. State Model

```ts
type TileGroup = {
  tiles: string[];       // tile texts merged into this group
  isLocked: boolean;     // true once this group is correctly matched (GREEN)
};

type JapanState = {
  tiles: string[];               // original tile array (post-SAD removal)
  groups: TileGroup[];           // current grouping
  correctBoundaries: Set<number>; // boundary indices that form a correct syllable
  isWon: boolean;
};
```

### D3. Join / Separate Logic

**Join** (`onJoin(boundaryIndex)`, Java `joinTiles` 529-560): hide that link button, mark left+right tiles clickable, remove the link button from `currentViews`. Tiles to either side become tappable (so they can be separated later).

**Separate** (`onSeparate(tileIndex)`, Java `separateTiles` 253-444): "peel" the clicked tile out by restoring the link button(s) adjacent to it, NOT splitting the entire group into individuals. Three branches:
- First tile (idx 0): restore right-side link button only.
- Last tile: restore left-side link button only.
- Middle tile: restore left link button; if the right neighbour is also a tile (i.e., joined on both sides), restore the right link button too.
After restoring, neighbours' background colors are randomised from `colorList[i % 5]`, and the clicked tile becomes unclickable.

### D4. Evaluation (`evaluateCombination`, Java 454-526)

Called after every join or separate.

**Full-win path** (lines 463-482): concatenate text of all `currentViews` (tiles AND remaining link-button "." chars); compare against `removeSADFromWordInLOP(refWord.wordInLOP)`. If equal:
1. `repeatLocked = false`; advance arrow blue.
2. `playCorrectSoundThenActiveWordClip(false)` — correct chime then word audio.
3. `updatePointsAndTrackers(1)`.
4. Set every tile (even-index view) green + white text + unclickable; every link-button view unclickable.
5. `setOptionsRowClickable()`.

**Partial-credit path** (lines 484-525): walk `currentViews`. Track a `firstLinkButton` cursor and an `intermediateTiles` accumulator. When a link button matches one in `finalCorrectLinkButtonIDs` AND the immediately-prior correct boundary equals `firstLinkButton`'s id (i.e., a *consecutive pair* of correct boundaries surrounds the accumulated tiles), AND the accumulator size != total tile count, color those intermediate tiles green/white and disable the bookend link buttons + tiles. Encountering a non-correct link button clears the accumulator and pauses building. The unit of partial credit is therefore "tiles between two adjacent correct-boundary link buttons" (the first/last syllable case uses tile index 0 / final position as a sentinel — see `firstLinkButton = currentViews.get(0)` initialiser at 499).

**Important**: Java does not require that the player has *joined* tiles to credit a syllable — having both adjacent boundary link-buttons present (un-joined) and the tiles between them in place is sufficient for the partial-green path to fire. The TS port MUST mirror this.

### D5. Challenge Level → Layout (Java `onCreate` 76-92)

| `challengeLevel` | Layout | Max tiles | `ALL_GAME_VIEW_IDS` length |
|---|---|---|---|
| 1 | `japan_7` | 7 | 13 (7 tiles + 6 link buttons) |
| 2 | `japan_12` | 12 | 23 (12 tiles + 11 link buttons) |

Words exceeding `MAX_TILES` are redrawn (`while (parsedSize > MAX_TILES) chooseWord();` at lines 119-121).

### D6. Orientation (Java line 94)

`setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE)`. Container MUST set `ScreenOrientation.LANDSCAPE` on mount and restore on unmount. RTL scripts mirror instruction + repeat icons (Java 96-104).

### D7. Container / Presenter Split

**`<JapanContainer>`** — owns:
- `useGameShell()`, `useLangAssets()`.
- All state: `tiles`, `groups`, `correctBoundaries`, `isWon`.
- Handlers: `onJoin`, `onSeparate`.
- Calls `evaluateGroupings()` after every interaction.
- Forces landscape orientation.

**`<JapanScreen>`** — pure props → JSX:
- Renders a horizontal row of tile boxes interleaved with link buttons.
- Link buttons between unlocked, non-adjacent groups are shown (tappable).
- Link buttons between locked tiles are hidden.
- Locked tile groups are GREEN.
- Props: `groups`, `lockedBoundaries`, `onJoin`, `onSeparate`, `wordText`, `wordImage`.

## Testing strategy

| Area | Approach |
|---|---|
| `evaluateGroupings` — correct syllable detection | Jest unit tests with mock tile/syllable arrays |
| Join / separate state transitions | Jest unit tests |
| `JapanContainer` | Manual QA against `engEnglish4` (words with clear syllable boundaries) |
| `JapanScreen` | Storybook stories: 3-tile word, 7-tile word, partially locked, fully won |
