# Romania Scanning Game Specification

## Requirements

### Requirement: Word filtering based on scanSetting

The game SHALL filter the words displayed for a focus tile based on the `scanSetting` defined in the language pack's settings.

#### Scenario: scanSetting 1 (Initial Only)
- **GIVEN** a focus tile "a" and words ["apple", "banana", "cat", "bat"]
- **WHEN** scanSetting is 1
- **THEN** the game only displays ["apple"]

#### Scenario: scanSetting 3 (All Positions)
- **GIVEN** a focus tile "a" and words ["apple", "banana", "cat", "bat"]
- **WHEN** scanSetting is 3
- **THEN** the game displays ["apple", "banana", "cat", "bat"] (all contain "a")

### Requirement: Focus Tile Bolding

The game SHALL bold the focus tile within each word if the `boldInitialFocusTiles` setting is enabled.

#### Scenario: Bolding enabled
- **GIVEN** focus tile "a", word "apple", and `boldInitialFocusTiles` is true
- **THEN** the word is rendered with "**a**pple" logic (focus tile bolded)
