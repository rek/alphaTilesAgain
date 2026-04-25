## ADDED Requirements

### Requirement: Required testID props are present on key interactive elements

The four key interactive components SHALL each expose a `testID` prop with the value specified in design D2. The props SHALL be passed through to the underlying React Native `View` or `Pressable` so Maestro can target them by `id:`.

#### Scenario: player-avatar-tile testID is present

- **GIVEN** the choose-player screen is rendered
- **WHEN** Maestro queries `id: player-avatar-tile`
- **THEN** a tappable element is found

#### Scenario: game-door-tile testID is present

- **GIVEN** the game door / home screen is rendered
- **WHEN** Maestro queries `id: game-door-tile`
- **THEN** a tappable element is found

#### Scenario: game-board-tile testID is present

- **GIVEN** a game is loaded and the board is rendered
- **WHEN** Maestro queries `id: game-board-tile`
- **THEN** a tappable element is found

#### Scenario: shell-back-button testID is present

- **GIVEN** a game is loaded and the shell header is rendered
- **WHEN** Maestro queries `id: shell-back-button`
- **THEN** a tappable element is found

### Requirement: All four named Maestro flow files exist

The `e2e/maestro/` directory at repo root SHALL contain exactly the four golden-path flow files: `01-player-creation.yaml`, `02-game-door-tap.yaml`, `03-correct-answer.yaml`, `04-back-navigation.yaml`. Each SHALL be a valid Maestro flow YAML parseable by `maestro test`.

#### Scenario: Flow files are present and valid

- **GIVEN** the repository is checked out
- **WHEN** `maestro test e2e/maestro/` is executed against a running simulator with the app installed
- **THEN** Maestro parses all four files without YAML error and begins execution

### Requirement: Flow 1 covers first-launch player creation

`01-player-creation.yaml` SHALL navigate from app launch to player selection and tap a player avatar tile, asserting the app transitions to the subsequent screen.

#### Scenario: Player creation golden path

- **GIVEN** the app is launched fresh
- **WHEN** the flow taps `id: player-avatar-tile`
- **THEN** the choose-player screen is no longer the active screen

### Requirement: Flow 2 covers game door tap and game load

`02-game-door-tap.yaml` SHALL navigate past player selection and tap `id: game-door-tile`, asserting `id: game-board-tile` becomes visible.

#### Scenario: Game door tap loads game board

- **GIVEN** a player has been selected
- **WHEN** the flow taps `id: game-door-tile`
- **THEN** `id: game-board-tile` is visible

### Requirement: Flow 3 covers correct answer tap

`03-correct-answer.yaml` SHALL reach the game board and tap `id: game-board-tile`, asserting the game advances (next round or celebration element is visible).

#### Scenario: Correct answer tap advances game

- **GIVEN** the game board is visible
- **WHEN** the flow taps `id: game-board-tile`
- **THEN** the game progresses (asserted via element presence, not score text)

### Requirement: Flow 4 covers back navigation to menu

`04-back-navigation.yaml` SHALL reach the game board and tap `id: shell-back-button`, asserting the game door / menu screen is visible again.

#### Scenario: Back button returns to menu

- **GIVEN** a game is active
- **WHEN** the flow taps `id: shell-back-button`
- **THEN** the game door or home screen is visible

### Requirement: NX target runs Maestro CLI

`apps/alphaTiles/project.json` SHALL contain a target named `e2e:maestro` that executes `maestro test e2e/maestro/` with `cwd` set to the workspace root. The target SHALL be runnable via `nx run alphaTiles:e2e:maestro`.

#### Scenario: NX target executes Maestro

- **WHEN** `nx run alphaTiles:e2e:maestro` is executed with a running simulator and installed app
- **THEN** the Maestro CLI is invoked with `e2e/maestro/` as the test path
- **AND** the NX target exits with the same code as the Maestro process

### Requirement: CI fails the build when any flow fails

The GitHub Actions workflow SHALL run on every pull request, execute `nx run alphaTiles:e2e:maestro`, and fail the PR check when the command exits non-zero.

#### Scenario: Failing flow blocks PR

- **GIVEN** a pull request introduces a change that causes a Maestro flow to fail
- **WHEN** the `e2e-maestro` GitHub Actions job runs
- **THEN** the job exits non-zero
- **AND** the PR check is marked as failed

#### Scenario: Passing flows allow PR merge

- **GIVEN** all four flows complete without error
- **WHEN** the `e2e-maestro` GitHub Actions job runs
- **THEN** the job exits 0
- **AND** the PR check is marked as passed

### Requirement: Flows are stable on iOS simulator (v1)

All four flows SHALL target iOS simulator only (v1). Flows SHALL use `id:` selectors exclusively for interactive element targeting to avoid locale or font rendering variance.

#### Scenario: Flows use testID selectors not text selectors

- **GIVEN** any of the four flow files
- **WHEN** the flow taps or asserts on a key interactive element
- **THEN** the assertion uses `id: <testID-value>` not raw text matching

#### Scenario: iOS simulator is the v1 target platform

- **GIVEN** the CI workflow
- **WHEN** the Maestro suite is executed
- **THEN** it runs against an iOS simulator (not Android emulator)
