## Why

Japan is a syllable-segmentation game. It builds phonological awareness by having players group a word's tiles into their correct syllable units. Unlike multiple-choice games, there are no distractors — all tiles shown are from the actual word.

## What Changes

- Add `libs/alphaTiles/feature-game-japan` — `<JapanContainer>` + `<JapanScreen>`.
- Port Japan's tile-linking mechanic:
    - A word is parsed into tiles (SAD tiles removed) and displayed as a horizontal row.
    - Between each pair of adjacent tiles sits a clickable "link button".
    - Tapping a link button **joins** the tiles on either side (link button disappears, tiles merge into one group).
    - Tapping a joined tile **separates** it back (link button reappears, tiles split).
    - Correctly-grouped syllables turn GREEN immediately (partial credit).
    - Win: the entire word is correctly segmented into its syllable groupings → `updatePointsAndTrackers(1)` + audio playback.
- `challengeLevel` controls max word tile count: L1 → max 7 tiles (landscape layout), L2 → max 12 tiles (landscape layout).
- Landscape-only orientation.
- Use `feature-game-shell` for UI chrome and navigation.

## Capabilities

### New Capabilities

- `game-japan` — Japan syllable-segmentation mechanic: tap link buttons between tiles to group them into syllables; partial credit as correct syllable groups turn green; landscape-only.

## Impact

- **New lib**: `libs/alphaTiles/feature-game-japan` (`type:feature`, `scope:alphaTiles`).
- **New route**: `apps/alphaTiles/app/games/japan.tsx`.

## Out of Scope

- Portrait orientation — Japan is landscape-only by design.
- Words longer than the layout maximum (filtered at word-selection time).
- Audio feedback per partial syllable match — win audio plays only on full completion.
