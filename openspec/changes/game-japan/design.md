## Context

Japan.java is a syllable-segmentation game. The word is parsed into tiles displayed in a horizontal row with "link buttons" (dots/separators) between adjacent tiles. The player taps link buttons to join tiles into groups and taps joined tiles to separate them. The goal is to match the word's correct syllable structure.

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

| Java symbol | TS destination | Notes |
|---|---|---|
| `public class Japan extends GameActivity` | `JapanContainer.tsx` | |
| `parsedRefWordTileArray` (after SAD removal) | `tiles: string[]` state | Tile texts in order |
| `parsedRefWordSyllableArray` | `correctSyllables: string[][]` state | Each syllable = array of tile texts |
| `finalCorrectLinkButtonIDs` | `correctBoundaries: number[]` state | Indices after which a syllable boundary falls |
| `currentViews` (joined/separated state) | `groups: TileGroup[]` state | Current grouping of tiles |
| `joinTiles(linkButton)` | `onJoin(boundaryIndex)` handler | Merges tiles across a boundary |
| `separateTiles(tile)` | `onSeparate(tileIndex)` handler | Splits a tile from its group |
| `evaluateCombination()` | `evaluateGroupings()` — called after every join/separate | Returns set of correct boundary indices |
| `updatePointsAndTrackers(1)` | `shell.incrementPointsAndTracker(1)` on full win | |

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

**Join** (`onJoin(boundaryIndex)`): merge `groups[boundaryIndex]` and `groups[boundaryIndex + 1]` into one group; remove the boundary between them.

**Separate** (`onSeparate(groupIndex)`): split a non-locked group back into individual tiles (restoring all internal boundaries). Java separates on tile-click, restoring link buttons on both sides.

### D4. Evaluation

After every join or separate, call `evaluateGroupings()`:
1. For each group, join its tile texts into a string.
2. Compare against each correct syllable in order.
3. Any group that exactly matches its correct syllable AND sits at the right position in sequence → mark `isLocked = true`, color GREEN.
4. If all groups are locked → full win.

### D5. Challenge Level → Layout

| `challengeLevel` | Layout | Max tiles |
|---|---|---|
| 1 | `japan_7` | 7 |
| 2 | `japan_12` | 12 |

Words with more tiles than `MAX_TILES` are redrawn (`chooseWord` retries until tile count ≤ MAX_TILES).

### D6. Orientation

Japan forces landscape orientation. The container MUST set `ScreenOrientation.LANDSCAPE` on mount and restore on unmount.

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
