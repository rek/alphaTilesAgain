# Capability: Thailand Game

Thailand is a multiple-choice game class where players match a prompt (Reference) to one of several options (Choices).

## Requirements

### R1. Challenge Level Decoding
The game MUST decode the 3-digit `challengeLevel` into:
- **Difficulty**: Number of choices displayed (1=2, 2=4, 3=6, 4=8).
- **RefType**: The type of prompt (1=Audio, 2=Image, 3=Word).
- **ChoiceType**: The type of options (1=Tile, 2=Word).

### R2. Round Setup
On each round, the game MUST:
- Select a correct `refWord` based on the current stage.
- Select `N-1` unique distractors from the available word/tile pool.
- Shuffle the correct answer and distractors into a grid of `N` choices.

### R3. User Interaction
- Selecting the correct choice MUST increment points and trackers via the game shell.
- Selecting an incorrect choice MUST provide negative feedback and (optionally) allow retry.
- Tapping an image/word prompt or the audio icon MUST replay the prompt's audio.

### R4. Win Condition
- The round is complete when the correct choice is selected.
- The game shell handles the transition to the next door or celebration after 12 successful rounds.

## Scenarios

### Scenario 1: 2-choice Image-to-Word (CL 122)
- **Given** challengeLevel is 122
- **When** the game starts
- **Then** difficulty is 1 (2 choices)
- **And** refType is 2 (Image prompt)
- **And** choiceType is 2 (Word options)
- **And** 2 word buttons are displayed, one showing the correct word.

### Scenario 2: 4-choice Audio-to-Tile (CL 211)
- **Given** challengeLevel is 211
- **When** the game starts
- **Then** difficulty is 2 (4 choices)
- **And** refType is 1 (Audio prompt - show play icon)
- **And** choiceType is 1 (Tile options)
- **And** 4 tile buttons are displayed, one showing the correct tile.
