## Context

Japan.java is a "Missing Tile" game. A word is shown with a gap, and the user must fill it from a selection of tiles.

## Goals / Non-Goals

**Goals:**
- Port Japan missing-tile mechanic.
- 1 word with a missing tile + N tile choices.
- Proper distractor selection (must be distinct from the correct tile).
- Use `GameShellContainer`.

## Decisions

### D1. Java surface → TS artifact mapping

| Java symbol | TS destination | Notes |
|---|---|---|
| `public class Japan extends GameActivity` | `JapanContainer.tsx` | |
| `Word refWord` | `refWord` state | The word being tested |
| `int missingTileIndex` | `missingTileIndex` state | Which tile in the word is removed |
| `Tile[] choices` | `choices` state | Tile choices (1 correct + distractors) |

### D2. Gap Representation

The missing tile in the word will be represented by an underscore `_` or a dedicated "EmptyTile" component in the presenter.

### D3. Container / Presenter Split

**`<JapanContainer>`**
- Picks a `refWord`.
- Parses `refWord` into tiles.
- Randomly selects one tile index to be "missing".
- Picks distractor tiles from the stage's tile list.
- Shuffles choices.
- Handles `onTileChoicePress`:
    - Correct: `shell.incrementPointsAndTracker(1)`, play correct sound, reveal missing tile, move to next round.
    - Incorrect: `shell.playIncorrect()`.

**`<JapanScreen>`**
- Renders the word tiles (optionally with an image of the word).
- The missing tile is visually distinct (e.g., a dashed border or `?`).
- Renders choice tiles in a grid or row.

### D4. Challenge-Level → Choice Count

`challengeLevel` maps to the number of tile choices displayed:
- `1` → 2 choices (1 correct + 1 distractor)
- `2` → 4 choices (1 correct + 3 distractors)
- `3` → 6 choices (1 correct + 5 distractors)
