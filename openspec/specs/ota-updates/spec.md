# ota-updates Specification

## Purpose
TBD - created by archiving change ota-updates. Update Purpose after archive.
## Requirements
### Requirement: OTA channel bound per language pack

Each language-pack build profile in `eas.json` SHALL declare a `channel` equal to its language code (e.g. the `eng` profile declares `"channel": "eng"`). Shared profiles (`development`, `preview`, `production`) SHALL NOT declare a channel and SHALL NOT be OTA update targets for end users.

#### Scenario: English build profile

- **WHEN** `eas.json` declares the `eng` profile
- **THEN** the profile includes `"channel": "eng"` and its builds receive only updates published to the `eng` channel

#### Scenario: Adding a new language

- **WHEN** a developer adds a new language-pack profile to `eas.json`
- **THEN** the profile MUST declare a `channel` matching its language code
- **AND** OTA publishes to that channel reach only that language's installs

#### Scenario: Shared profile has no channel

- **WHEN** the `development` or `preview` profile is inspected
- **THEN** it has no `channel` field
- **AND** no OTA updates are applied to builds produced by that profile

### Requirement: Runtime-version policy uses `appVersion`

`apps/alphaTiles/app.config.ts` SHALL set `runtimeVersion` to `{ policy: "appVersion" }`. An OTA update SHALL apply only when its publish-time `appVersion` equals the installed binary's `appVersion`. A mismatch SHALL cause the update to be ignored by the client runtime, and the installed binary SHALL continue using its bundled assets.

#### Scenario: Matching version

- **WHEN** an update is published against `appVersion = 1.2.0` and the installed binary is `1.2.0`
- **THEN** `Updates.checkForUpdateAsync()` reports `isAvailable: true` and the update can be fetched and applied

#### Scenario: Mismatched version (update is newer)

- **WHEN** an update is published against `appVersion = 1.3.0` and the installed binary is `1.2.0`
- **THEN** `Updates.checkForUpdateAsync()` reports `isAvailable: false` for the `1.2.0` binary
- **AND** the user is not served the `1.3.0` update via OTA (they must update the binary via the store)

#### Scenario: Mismatched version (update is older)

- **WHEN** an update is published against `appVersion = 1.1.0` and the installed binary is `1.2.0`
- **THEN** the `1.2.0` binary does not roll back to `1.1.0`
- **AND** the older update is ignored

### Requirement: Development builds skip the update check

A build with `Updates.isEnabled === false` (i.e. any development build run from Metro / `--dev-client`) SHALL NOT call `Updates.checkForUpdateAsync()`, `Updates.fetchUpdateAsync()`, or `Updates.reloadAsync()`. No OTA analytics events SHALL fire from development builds.

#### Scenario: Dev build boots

- **WHEN** the app boots with `Updates.isEnabled === false`
- **THEN** the OTA check is skipped silently
- **AND** no network request is made to the EAS Update endpoint
- **AND** no `app_update_*` analytics events are fired

### Requirement: Boot-time update check with 5-second metadata timeout

During the loading screen, after i18n initialization and before the game menu mounts, the app SHALL call `Updates.checkForUpdateAsync()` with a 5-second timeout. On timeout, the underlying call SHALL be abandoned (not awaited further) and the boot SHALL continue with bundled assets.

#### Scenario: Check resolves within timeout — no update

- **WHEN** `checkForUpdateAsync()` resolves with `isAvailable: false` in under 5 seconds
- **THEN** the boot continues with bundled assets
- **AND** no `app_update_*` event is fired

#### Scenario: Check resolves within timeout — update available

- **WHEN** `checkForUpdateAsync()` resolves with `isAvailable: true` in under 5 seconds
- **THEN** `app_update_available` is fired with `{ updateId, channel }`
- **AND** the app proceeds to the fetch step

#### Scenario: Check times out

- **WHEN** `checkForUpdateAsync()` has not resolved after 5 seconds
- **THEN** `app_update_failed` is fired with `{ stage: 'check', reason: 'timeout', channel }`
- **AND** the boot continues with bundled assets

#### Scenario: Check throws

- **WHEN** `checkForUpdateAsync()` rejects within 5 seconds
- **THEN** `app_update_failed` is fired with `{ stage: 'check', reason: 'error', errorMessage, channel }`
- **AND** the boot continues with bundled assets

### Requirement: Update fetch with 10-second timeout

When `checkForUpdateAsync()` reports an available update, the app SHALL call `Updates.fetchUpdateAsync()` with a 10-second timeout. On successful fetch with `isNew: true`, the app SHALL call `Updates.reloadAsync()`. On any failure, timeout, or `isNew: false`, the boot SHALL continue with bundled assets.

#### Scenario: Fetch succeeds

- **WHEN** `fetchUpdateAsync()` resolves with `isNew: true` in under 10 seconds
- **THEN** `Updates.reloadAsync()` is called
- **AND** the app restarts into the new update

#### Scenario: Fetch times out

- **WHEN** `fetchUpdateAsync()` has not resolved after 10 seconds
- **THEN** `app_update_failed` is fired with `{ stage: 'fetch', reason: 'timeout', channel }`
- **AND** the boot continues with bundled assets

#### Scenario: Fetch throws

- **WHEN** `fetchUpdateAsync()` rejects within 10 seconds
- **THEN** `app_update_failed` is fired with `{ stage: 'fetch', reason: 'error', errorMessage, channel }`
- **AND** the boot continues with bundled assets

#### Scenario: Reload throws

- **WHEN** `Updates.reloadAsync()` rejects
- **THEN** `app_update_failed` is fired with `{ stage: 'reload', reason: 'error', errorMessage, channel }`
- **AND** the boot continues with bundled assets (the previous update, not the new one)

### Requirement: Update-applied detection across reload boundary

The app SHALL persist `Updates.updateId` to storage after a successful mount. On boot, if `Updates.updateId` differs from the persisted value, the app SHALL fire `app_update_applied` with `{ fromUpdateId, toUpdateId, channel }`. On the first-ever launch (no persisted value), no event SHALL fire.

#### Scenario: First-ever launch

- **WHEN** the app boots with no persisted `ota.lastUpdateId`
- **THEN** no `app_update_applied` event is fired
- **AND** the current `Updates.updateId` is persisted after the mount succeeds

#### Scenario: Launch after a successful update apply

- **WHEN** the persisted `ota.lastUpdateId` differs from `Updates.updateId` at boot
- **THEN** `app_update_applied` is fired with `{ fromUpdateId: <persisted>, toUpdateId: <current>, channel }`
- **AND** the new `Updates.updateId` is persisted after the mount succeeds

#### Scenario: Launch with no change

- **WHEN** the persisted `ota.lastUpdateId` equals `Updates.updateId` at boot
- **THEN** no `app_update_applied` event is fired

### Requirement: `checkAutomatically` disabled in Expo config

`apps/alphaTiles/app.config.ts` SHALL set `updates.checkAutomatically = "NEVER"`. The app SHALL rely solely on the explicit `runOtaCheck` path invoked from the loading screen.

#### Scenario: Config inspection

- **WHEN** `app.config.ts` is resolved
- **THEN** the output config contains `updates.checkAutomatically = "NEVER"`
- **AND** `expo-updates` does not perform an automatic check on app launch or foreground

### Requirement: `util-ota` library surface

The `libs/alphaTiles/util-ota` library SHALL export exactly two functions: `runOtaCheck(opts)` (invoked from the loading-screen boot flow) and `reportApplyIfNeeded(opts)` (invoked from the app entry after mount). The library SHALL be tagged `type:util, scope:alphaTiles` and MUST NOT import from any `feature`, `data-access`, or `ui` library.

#### Scenario: Exports

- **WHEN** `libs/alphaTiles/util-ota/src/index.ts` is inspected
- **THEN** it exports `runOtaCheck` and `reportApplyIfNeeded`
- **AND** no other public symbols

#### Scenario: Dependency rules

- **WHEN** `nx graph` is inspected
- **THEN** `util-ota` depends only on `expo-updates`, `@react-native-async-storage/async-storage`, and a type-only import of the `AnalyticsTrack` type from `util-analytics`

### Requirement: EAS project prerequisite

A successful production build SHALL require `extra.eas.projectId` to be set in `app.config.ts`. If absent, the build SHALL fail with a message pointing the developer at `docs/GETTING_STARTED.md` and the `eas init` command.

#### Scenario: Missing projectId

- **WHEN** a build is attempted with `extra.eas.projectId` unset or empty
- **THEN** the build fails with a readable error naming `eas init` and `docs/GETTING_STARTED.md`

#### Scenario: Valid projectId

- **WHEN** `extra.eas.projectId` is set to a valid UUID
- **THEN** the build proceeds and the resulting binary embeds the EAS Update endpoint for its channel

