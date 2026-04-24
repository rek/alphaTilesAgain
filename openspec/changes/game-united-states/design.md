# Design: United States Game (Pairing/Spelling)

Tactical design for the "United States" game implementation.

## Context

- **Port of:** `UnitedStates.java`
- **Upstream deps:** `feature-game-shell`, `data-language-assets`, `util-phoneme`
- **Fixtures:** `engEnglish4` (for Roman script pairing)

## Architecture Mapping (Java → TS)

| Java | TS | Notes |
| ---- | -- | ----- |
| `UnitedStates` class | `UnitedStatesContainer.tsx` + `UnitedStatesScreen.tsx` | Feature lib |
| `onCreate` / `wordLengthLimitInTiles` | `usePrecompute('united-states')` + `challengeLevel` logic | Precompute filters words by length |
| `GAME_BUTTONS` (18 buttons) | `UnitedStatesScreen` props | Flat list of 18 tile states |
| `onBtnClick` | `onTilePress` callback | Updates selection state |
| `buildWord` | `useMemo` for constructed word + win check | Derived state |
| `combineTilesToMakeWord` | `util-phoneme` / `util-scoring` | Re-use existing word reconstruction logic |

## Library Structure

- `libs/alphaTiles/feature-game-united-states/`
  - `src/`
    - `index.ts` — Exports `UnitedStatesContainer`.
    - `UnitedStatesContainer.tsx` — Hooks, i18n, logic.
    - `UnitedStatesScreen.tsx` — Pure presenter.
    - `UnitedStatesScreen.stories.tsx` — Storybook stories.
    - `buildUnitedStatesData.ts` — Precompute builder (filters words by length).
    - `setupRound.ts` — Logic to select word and generate pairs with distractors.

## Precompute: `united-states`

The precompute registry will store words bucketed by tile length to speed up round initialization.

```ts
type UnitedStatesData = {
  level1Words: Word[]; // 2–5 tiles
  level2Words: Word[]; // 2–7 tiles
  level3Words: Word[]; // 2–9 tiles
};
```

## State Management (Zustand/React)

- **Container State:**
  - `currentWord`: The target word object.
  - `parsedTiles`: Array of tile objects for the current word.
  - `pairs`: Array of `{ top: TileState, bottom: TileState }` where `TileState` includes text and whether it's selected.
  - `selections`: Array of indices (0 for top, 1 for bottom, or `null`) for each pair.

## UI Design

- **Grid:** 2 rows, N columns (where N = word length in tiles).
- **Tiles:**
  - `ui-tile` from `libs/shared/ui-tile`.
  - Unselected in a pair: Dark Gray (`#A9A9A9`) background, Black text.
  - Selected in a pair: Game-themed color from `aa_colors.txt`, White text.
- **Word Display:** Text component below or above the grid showing the constructed word with underscores for missing selections.
- **Colors:** Cycle through the first 5 colors in `aa_colors.txt` for the pairs.

## Logic: Round Setup

1. Filter precomputed words by `challengeLevel`.
2. Pick a random word.
3. Parse into tiles.
4. For each tile:
   - Identify the correct text.
   - Pick a distractor (randomly selected from the tile's alternatives in the pack).
   - Randomly assign one to "top" and one to "bottom".
5. Initialize `selections` to `null` for all pairs.

## Logic: Win Condition

1. Check if all pairs have a selection.
2. If yes, join selected tiles.
3. Compare joined string with target word (standardized).
4. If match:
   - Play "correct" sound.
   - Mark as solved in `game-shell` (advances tracker/points by 2).
   - Lock interaction.
   - Timeout → Next round.

## i18n Strategy

- **Presenter:** Receives `tilePairs` (pre-translated tile text), `constructedWord` (pre-joined string), and chrome strings (`scoreLabel`, `backLabel`).
- **Container:** Uses `useTranslation` for chrome; fetches content strings from `assets` and `i18n`.

## Unresolved Questions

1. Should we support Syllable-based pairing (Java `syllableGame`)? V1 focuses on Tile-based pairing. If `aa_settings.txt` specifies syllable games, we may need a separate precompute/logic path.
2. How to handle words with length < max? Java hides buttons. We should do the same (render only N pairs).
