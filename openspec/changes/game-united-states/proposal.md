# Proposal: United States Game (Pairing/Spelling)

Implement the "United States" game mechanic, a pairing-based spelling game where players select the correct tile from pairs to reconstruct a target word.

## Problem

The AlphaTiles port needs to support more game mechanics from the original Java app to achieve parity and support diverse language pack requirements. The "United States" game is a core mechanic that focuses on word reconstruction from phonemes/tiles with distractors.

## Proposed Solution

Port `UnitedStates.java` to the Expo/React Native monorepo as a new feature library `libs/alphaTiles/feature-game-united-states`.

### Key Mechanics
- **Pairs of Tiles:** For each position in the target word, two tiles are presented (one correct, one distractor).
- **Word Building:** Selecting a tile from a pair updates the "constructed word" display.
- **Progressive Difficulty:**
  - Level 1: 5 pairs (max word length 5)
  - Level 2: 7 pairs (max word length 7)
  - Level 3: 9 pairs (max word length 9)
- **Visuals:** Target word image is shown.
- **Audio:** Target word audio is playable.
- **Feedback:** Selected tiles change color; dark gray for unselected in a pair, game-themed color for selected.

## Technical Architecture

- **Library:** `libs/alphaTiles/feature-game-united-states` (`type:feature`, `scope:alphaTiles`)
- **Pattern:** Container/Presenter split.
  - `UnitedStatesContainer.tsx`: Logic, data fetching (via `useGameShell`), i18n strings.
  - `UnitedStatesScreen.tsx`: Pure UI, 18-button grid (9 pairs), word display.
- **Data:**
  - Uses `util-precompute` to register a data builder that selects words and generates distractor pairs during app boot.
  - Consumes `useGameShell` for shared game state (score, stage, etc.).
- **i18n:**
  - Chrome strings: `chrome:score`, `chrome:back`.
  - Content: Word and tile text from language pack.

## Impact

- Adds a second game mechanic to the port.
- Exercises the `game-engine-base` and `util-precompute` systems.
- Enables language packs that rely on pairing mechanics.
