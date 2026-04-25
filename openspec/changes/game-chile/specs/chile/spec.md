# Chile Identification Game Specification

## Requirements

### Requirement: Matching image to word

The game SHALL present a word image and four word choices, exactly one of which corresponds to the image.

#### Scenario: Selection of correct word
- **GIVEN** image for "apple" and choices ["apple", "banana", "cat", "bat"]
- **WHEN** user selects "apple"
- **THEN** shell.incrementPointsAndTracker(1) is called and round is won

#### Scenario: Selection of incorrect word
- **GIVEN** image for "apple" and choices ["apple", "banana", "cat", "bat"]
- **WHEN** user selects "banana"
- **THEN** shell.playIncorrect() is called and choice is visually disabled
