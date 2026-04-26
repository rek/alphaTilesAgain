## Why

`docs/ARCHITECTURE.md` establishes a port-from-Java philosophy where each Android game class is ported as a React Native feature. **Mexico** is the second concrete game to be ported, providing a foundational "Matching/Memory" mechanic.

Mexico is a classic memory game where players match word-text cards with word-image cards. It exercises the shared `feature-game-shell` and establishes the pattern for games that use a subset of the pack's wordlist based on content availability (words must have both an image and an audio file).

## What Changes

- Add `libs/alphaTiles/feature-game-mexico` — `<MexicoContainer>` + `<MexicoScreen>`. Wraps `<GameShellContainer>` and provides a grid of cards (6 to 20 depending on challenge level).
- Register a per-class precompute (`registerPrecompute('mexico', ...)`): identifies all words in the pack that have both a valid image and a valid audio file. This avoids runtime "missing asset" failures.
- Port Mexico's challenge-level scaling:
  - Level 1: 3 pairs (6 cards)
  - Level 2: 4 pairs (8 cards)
  - Level 3: 6 pairs (12 cards)
  - Level 4: 8 pairs (16 cards)
  - Level 5: 10 pairs (20 cards)
- Port the state machine for card flipping:
  - Cards start face-down (showing AlphaTiles logo).
  - Tapping a card reveals it (text or image).
  - Second card tap reveals it, then triggers match check after a short delay (800ms).
  - Match: cards stay revealed, change color, play word audio.
  - No match: cards flip back face-down after a configurable delay.
- Port win condition: all pairs matched -> `updatePointsAndTrackers(pairCount)` -> `playCorrectFinalSound`.
- Storybook stories for `<MexicoScreen>` at various states (empty, partially matched, won).

## Capabilities

### New Capabilities

- `game-mexico` — Mexico game mechanic: memory matching of text-to-image pairs, challenge-level-scaled grid size, match-and-reveal logic, win at all-matched.

### Modified Capabilities

_None_

## Impact

- **New lib**: `libs/alphaTiles/feature-game-mexico` (`type:feature`, `scope:alphaTiles`).
- **New route**: `apps/alphaTiles/app/games/mexico.tsx`.
- **Registry entry**: `registerPrecompute('mexico', buildMexicoData)` in the feature's `index.ts`.
- **No breaking changes**.

## Out of Scope

- Variations of Memory (e.g., text-to-audio or audio-to-image) — these can be future doors using the same lib with different config.
- Advanced card animations (flipping 3D effect) — v1 uses instant reveal/hide per Java behavior.

## Unresolved Questions

- Should the "flip back" delay be hardcoded or read from settings? Java reads from `settingsList` with a default. We'll use a reasonable default (1500ms) for now.
