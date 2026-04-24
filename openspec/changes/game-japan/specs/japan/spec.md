# Japan Missing Tile Game Specification

## Requirements

### Requirement: Identifying missing tile

The game SHALL present a word with one tile replaced by a gap, and multiple tile choices.

#### Scenario: Selection of correct tile
- **GIVEN** word "a_ple" (correct tile "p") and choices ["p", "b", "c", "d"]
- **WHEN** user selects "p"
- **THEN** shell.incrementPointsAndTracker(1) is called, word is completed as "apple", and round is won

#### Scenario: Selection of incorrect tile
- **GIVEN** word "a_ple" and choices ["p", "b", "c", "d"]
- **WHEN** user selects "b"
- **THEN** shell.playIncorrect() is called
