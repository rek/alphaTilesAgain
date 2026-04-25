## Why

Italy is a Lotería-style (Bingo) word game. A 4×4 board of word tiles (text + image) is laid out; a "caller" reads words one at a time. The player taps the matching tile to drop a bean on it. Forming a row, column, or diagonal of 4 beans wins. Combines listening, visual recognition, and pattern awareness.

## What Changes

- Add `libs/alphaTiles/feature-game-italy` — `<ItalyContainer>` + `<ItalyScreen>`.
- Port Italy mechanic:
    - Read `deckSize` from `Italy Deck Size` setting (default 54).
    - Shuffle `wordList` and take the first `deckSize` entries as `gameCards`.
    - Place the first 16 (`CARDS_ON_BOARD`) on a 4×4 board with text + variant-2 image.
    - Shuffle `gameCards` again; advance through them via `nextWordFromGameSet()`.
    - Each "call": `deckIndex++`, set `refWord = gameCards[deckIndex]`, play active word clip.
    - On match (player taps correct board tile): drop bean (`zz_bean.png`).
    - On lotería (4-in-a-row): swap winning beans for `zz_bean_loteria.png`, advance arrow blue, `playCorrectThenWord(true)`, `incrementPointsAndTracker(4)`.
    - Wrong tile tap: incorrect sound only.
    - If `deckIndex == deckSize` without lotería: incorrect sound ×2, then `playAgain()` reset.
    - Variants:
        - `syllableGame === "T"` → tiles = `wordInLOP` from `wordList`.
        - `syllableGame === "S"` → tiles from `syllableList` (`sortableSyllArray`).
- Need >= `deckSize` words available, otherwise navigate back to the country menu.
- 10 winning sequences: 4 rows + 4 columns + 2 diagonals.
- Use `feature-game-shell` for chrome/navigation.

## Capabilities

### New Capabilities

- `game-italy` — Lotería 4×4 board where a caller advances through a deck and the player marks matches; first 4-in-a-row wins.

## Impact

- **New lib**: `libs/alphaTiles/feature-game-italy` (`type:feature`, `scope:alphaTiles`).
- **New route**: `apps/alphaTiles/app/games/italy.tsx`.

## Out of Scope

- Multi-card boards (only one 4×4 board).
- Free play / endless (round resets after deck exhausted).
- Custom deck sizes beyond the settings file.
