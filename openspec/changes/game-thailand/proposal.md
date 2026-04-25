## Why

`docs/ARCHITECTURE.md §17` declares that concrete game classes are ported from the original Java app as needed. Thailand is a foundational multiple-choice game mechanic that exercises the `feature-game-shell` in a different way than the sliding-tile China game.

Thailand is a highly configurable "Multiple Choice" game. It uses a 3-digit `challengeLevel` code to control (1) the distractor strategy, (2) the reference type (what the player sees/hears as a prompt), and (3) the choice type (what the player selects from). Always exactly 4 choices are shown.

This change ports `Thailand.java` as a thin mechanic layered on the shell established by the `game-engine-base` change.

## What Changes

- Add `libs/alphaTiles/feature-game-thailand` — `<ThailandContainer>` + `<ThailandScreen>`. Wraps `<GameShellContainer>` from `feature-game-shell` and provides a fixed 4-choice game interface.
- Port Thailand's 3-digit `challengeLevel` decoding:
    - Digit 1 (`challengeLevelThai`): Distractor strategy (1 = random, 2 = phonetically-similar, 3 = same-initial-tile).
    - Digit 2: Reference Type — 1-indexed into TYPES enum (TILE_LOWER, TILE_UPPER, TILE_AUDIO, WORD_TEXT, WORD_IMAGE, WORD_AUDIO, SYLLABLE_TEXT, SYLLABLE_AUDIO).
    - Digit 3: Choice Type — same TYPES enum.
- Port the distractor selection logic: always 4 choices (1 correct + 3 distractors). Distractor pool depends on choiceType: `tileListNoSAD` for tile choices, `wordList` for word choices, `syllableList` for syllable choices.
- Port the correct/incorrect feedback: correct → `updatePointsAndTrackers(1)` + play correct sound + play reference audio; incorrect → play incorrect sound.
- Hook `onRefClick` for audio replay of the reference item.
- Storybook stories for `<ThailandScreen>` covering key prompt/choice combinations.

## Capabilities

### New Capabilities

- `game-thailand` — Thailand game mechanic: Always 4-choice identification game with fully configurable reference type and choice type via 3-digit challenge level. Distractor strategy (random/similar/same-initial) controlled by first digit.

### Modified Capabilities

- `scoring` — `displayChallengeLevel` already handles Thailand by dividing by 100 to show only the first digit (distractor strategy level).

## Impact

- **New lib**: `libs/alphaTiles/feature-game-thailand` (`type:feature`, `scope:alphaTiles`).
- **New route**: `apps/alphaTiles/app/games/thailand.tsx` — resolves route params, renders `<ThailandContainer>`.
- **Exemplar value**: Demonstrates how a highly-parameterized multiple-choice mechanic fits into the shell architecture.

## Out of Scope

- Other game classes (`Chile`, `Italy`, etc.) — each is its own future change.
- Animated transitions between rounds.
