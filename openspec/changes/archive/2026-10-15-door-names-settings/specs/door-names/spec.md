## ADDED Requirements

### Requirement: Optional game name column

`aa_games.txt` MAY carry a 9th column `GameName`. The parser SHALL expose it as `gameName` (`''` when the column or cell is absent) and SHALL keep accepting 8-column files.

#### Scenario: Named door
- **WHEN** a row's `GameName` is `聽字揀圖`
- **THEN** that Door's `name` is `聽字揀圖` and the menu door shows it under the number

#### Scenario: No name
- **WHEN** the column is absent or the cell empty
- **THEN** `Door.name` is undefined and the menu door renders as today (number only)

### Requirement: Names hidden by preference

When the effective `showGameNames` is false the menu SHALL render every door unlabelled.

#### Scenario: Toggle off
- **WHEN** the active player turns "Show game names on doors" off
- **THEN** the menu shows numbers only

### Requirement: Next-door search skips hidden doors

`findNextUncompletedGame` SHALL never return a Door with `enabled: false`.

#### Scenario: Taiwan hidden
- **WHEN** Taiwan doors are disabled and the player finishes the door before them
- **THEN** the next door is the first enabled, unmastered door after them
