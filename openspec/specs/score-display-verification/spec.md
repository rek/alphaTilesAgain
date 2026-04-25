# score-display-verification Specification

## Purpose

Verify that score display is split correctly between the game shell header and the game menu screen: the header shows a static label, the menu shows a live interpolated value.

## Requirements

### Requirement: Chrome score header shows label only

The game shell header (`ScoreBar`) SHALL display `t('chrome:chrome.score')` as a plain label with no interpolation. The score number SHALL be rendered as a separate text node next to the label, not embedded in the i18n string.

#### Scenario: Header label text

- **WHEN** the game shell header renders during an active game
- **THEN** the score label reads `"Score"` (not `"Score: {{points}}"` or `"Score: 3"`)
- **AND** the numeric point count is displayed as a separate adjacent text element

#### Scenario: No template literal in locales

- **WHEN** `locales/en.json` is inspected at key `chrome.score`
- **THEN** the value is the string `"Score"` with no `{{` interpolation tokens

### Requirement: Menu score shows interpolated live points

The game menu screen (`GameMenuScreen`) SHALL display `t('menu:menu.score', { points })` where `points` is the live score from the game shell context. The string SHALL render as `"Score: <N>"` with the actual numeric value substituted.

#### Scenario: Menu shows current points

- **WHEN** the player has scored 5 points and opens the game menu
- **THEN** the menu score label reads `"Score: 5"`
- **AND** the value updates if the player scores again and reopens the menu

#### Scenario: Menu score at zero

- **WHEN** the player has scored 0 points and opens the game menu
- **THEN** the menu score label reads `"Score: 0"`
