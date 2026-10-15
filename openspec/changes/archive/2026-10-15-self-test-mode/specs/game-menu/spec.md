## ADDED Requirements

### Requirement: Menu offers the self-test

The game menu SHALL show a "Check yourself" button below the door grid when the pack can build a self-test, navigating to `/self-test`.

#### Scenario: yue menu
- **GIVEN** the yue build
- **WHEN** the menu renders
- **THEN** the "Check yourself" button appears after the last door
