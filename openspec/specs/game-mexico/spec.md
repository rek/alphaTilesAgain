## ADDED Requirements

### Requirement: Memory matching grid with challenge-level scaling

The Mexico mechanic SHALL render a grid of cards that can be flipped to reveal either text or images. The number of pairs SHALL be determined by `challengeLevel`.

- **Level 1**: 3 pairs (6 cards)
- **Level 2**: 4 pairs (8 cards)
- **Level 3**: 6 pairs (12 cards)
- **Level 4**: 8 pairs (16 cards)
- **Level 5**: 10 pairs (20 cards)

#### Scenario: Level 1 grid
- **WHEN** `<MexicoContainer>` mounts with `challengeLevel=1`
- **THEN** the screen renders 6 cards in a face-down state.

#### Scenario: Level 5 grid
- **WHEN** `<MexicoContainer>` mounts with `challengeLevel=5`
- **THEN** the screen renders 20 cards in a face-down state.

### Requirement: Pairs consist of one TEXT card and one IMAGE card

For each word chosen for the round, exactly two cards SHALL be created: one displaying the word's text (LOP) and one displaying the word's image.

#### Scenario: Card distribution
- **WHEN** a round starts with 3 pairs
- **THEN** the board contains 3 unique words, with 2 cards per word (1 text, 1 image), for a total of 6 cards.

### Requirement: Flip and Match State Machine

The mechanic SHALL track the sequence of card flips.

1. Tapping a face-down card reveals it.
2. Tapping a second face-down card reveals it.
3. After a short delay:
   - If the two revealed cards belong to the same word:
     - They transition to `PAIRED` state (stay revealed, change color).
     - The word's audio is played.
   - If they do not match:
     - After a further delay, they both transition back to `HIDDEN`.

#### Scenario: Successful match
- **WHEN** the player flips a TEXT card for "apple" and then an IMAGE card for "apple"
- **THEN** both cards stay revealed, turn to a theme color, and the "apple" audio plays.

#### Scenario: Incorrect match
- **WHEN** the player flips a TEXT card for "apple" and then an IMAGE card for "banana"
- **THEN** both cards are shown for a short duration, then flip back to face-down.

### Requirement: Win condition

When all cards on the board are in the `PAIRED` state, the mechanic SHALL invoke `shell.incrementPointsAndTracker(pairCount)` and `shell.playCorrectFinal()`.

#### Scenario: Last pair found
- **WHEN** the player matches the final pair in a 4-pair game
- **THEN** `shell.incrementPointsAndTracker(4)` is called and the celebration starts.

### Requirement: Precompute for asset availability

The Mexico mechanic SHALL register a precompute that identifies words having both an image and an audio file. If insufficient words are available for the requested `challengeLevel`, a friendly error SHALL be shown.

#### Scenario: Insufficient words
- **WHEN** a pack has only 5 words with both image and audio, but `challengeLevel=5` (requires 10) is requested
- **THEN** a "not enough content" message is displayed instead of a crash.
