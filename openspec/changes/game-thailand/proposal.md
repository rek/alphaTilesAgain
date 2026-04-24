## Why

`docs/ARCHITECTURE.md §17` declares that concrete game classes are ported from the original Java app as needed. Thailand is a foundational multiple-choice game mechanic that exercises the `feature-game-shell` in a different way than the sliding-tile China game.

Thailand is a highly configurable "Multiple Choice" game. It uses a 3-digit `challengeLevel` code to determine the difficulty (number of choices), the reference type (what the player sees/hears as a prompt), and the choice type (what the player selects from). This makes it a versatile tool for various literacy exercises.

This change ports `Thailand.java` as a thin mechanic layered on the shell established by the `game-engine-base` change.

## What Changes

- Add `libs/alphaTiles/feature-game-thailand` — `<ThailandContainer>` + `<ThailandScreen>`. Wraps `<GameShellContainer>` from `feature-game-shell` and provides a multiple-choice game interface.
- Port Thailand's 3-digit `challengeLevel` decoding:
    - Digit 1: Difficulty (number of choices: 2, 4, 6, 8).
    - Digit 2: Reference Type (1 = Audio, 2 = Image, 3 = Word).
    - Digit 3: Choice Type (1 = Tile, 2 = Word).
- Port the distractor selection logic: based on the `choiceType`, pick one correct answer and N-1 distractors from the pack's word or tile list, ensuring they are distinct.
- Port the win/loss feedback: selecting the correct option triggers `shell.incrementPointsAndTracker(true)`, while incorrect selections provide visual/audio feedback and lock the choice (or allowed retries based on original logic).
- Hook `clickPicHearAudio` for audio-based prompts.
- Storybook stories for `<ThailandScreen>` covering various prompt/choice combinations (Image-Word, Audio-Tile, Word-Word, etc.).

## Capabilities

### New Capabilities

- `game-thailand` — Thailand game mechanic: Multiple-choice game with configurable prompt (Audio/Image/Word) and options (Tile/Word), and variable number of choices (2-8).

### Modified Capabilities

- `scoring` — `displayChallengeLevel` already handles Thailand by dividing by 100 to show only the first digit (difficulty).

## Impact

- **New lib**: `libs/alphaTiles/feature-game-thailand` (`type:feature`, `scope:alphaTiles`).
- **New route**: `apps/alphaTiles/app/games/thailand.tsx` — resolves route params, renders `<ThailandContainer>`.
- **Exemplar value**: Demonstrates how a highly-parameterized multiple-choice mechanic fits into the shell architecture.

## Out of Scope

- Other game classes (`Chile`, `Italy`, etc.) — each is its own future change.
- Syllable-mode choices — deferred until a pack demands them.
- Animated transitions between rounds.
