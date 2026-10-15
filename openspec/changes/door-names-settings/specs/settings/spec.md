## ADDED Requirements

### Requirement: Per-player preferences

The app SHALL persist sparse per-player preferences keyed by player id; deleting a player SHALL delete its preferences.

#### Scenario: Unset preference
- **WHEN** a player never touched a setting
- **THEN** the effective value is the pack default

### Requirement: One effective-settings lookup

Cross-cutting settings SHALL be read through `effectiveSettingsOf` / `useEffectiveSettings`, which combine pack `aa_settings.txt` values (labels + defaults defined once) with the active player's preferences.

#### Scenario: Player override
- **WHEN** the pack says `Show game names = TRUE` and the player preference is `false`
- **THEN** `showGameNames` is false

### Requirement: Settings screen

A settings screen SHALL be reachable from the menu; its first entry SHALL be a toggle "Show game names on doors", default on.

#### Scenario: Default
- **WHEN** a new player opens settings
- **THEN** the toggle is on
