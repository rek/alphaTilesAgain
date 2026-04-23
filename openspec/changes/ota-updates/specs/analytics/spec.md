## ADDED Requirements

### Requirement: Event `app_update_available`

The analytics event catalog SHALL include `app_update_available`, fired exactly once per boot when `Updates.checkForUpdateAsync()` reports `isAvailable: true` before the fetch step runs. The event payload SHALL include `{ updateId: string, channel: string }`.

#### Scenario: Update available on boot

- **WHEN** the boot-time OTA check reports an available update
- **THEN** `track('app_update_available', { updateId, channel })` is called exactly once
- **AND** no duplicate fires in the same session

#### Scenario: No update available

- **WHEN** the boot-time OTA check reports `isAvailable: false`
- **THEN** `app_update_available` is NOT fired

### Requirement: Event `app_update_applied`

The analytics event catalog SHALL include `app_update_applied`, fired on the first boot after a successful `Updates.reloadAsync()` transitioned the app to a new `updateId`. The event payload SHALL include `{ fromUpdateId: string | null, toUpdateId: string, channel: string }`. The event SHALL NOT fire on first-ever app launch (when no previous `updateId` has been persisted).

#### Scenario: First-ever launch

- **WHEN** the app launches with no persisted `ota.lastUpdateId`
- **THEN** `app_update_applied` is NOT fired

#### Scenario: Launch after update

- **WHEN** the persisted `ota.lastUpdateId` differs from the current `Updates.updateId` at launch
- **THEN** `track('app_update_applied', { fromUpdateId, toUpdateId, channel })` fires exactly once
- **AND** the new `updateId` is persisted after the event fires

#### Scenario: Stable launch (no update)

- **WHEN** the persisted `ota.lastUpdateId` equals `Updates.updateId` at launch
- **THEN** `app_update_applied` is NOT fired

### Requirement: Event `app_update_failed`

The analytics event catalog SHALL include `app_update_failed`, fired at most once per boot when any stage of the OTA pipeline (check / fetch / reload) fails or times out. The event payload SHALL include `{ stage: 'check' | 'fetch' | 'reload', reason: 'timeout' | 'error', errorMessage?: string, channel: string }`. `errorMessage` SHALL be present on `reason: 'error'` and SHALL be truncated to at most 256 characters.

#### Scenario: Check timeout

- **WHEN** `Updates.checkForUpdateAsync()` has not resolved within 5 seconds
- **THEN** `track('app_update_failed', { stage: 'check', reason: 'timeout', channel })` is called exactly once
- **AND** `errorMessage` is omitted

#### Scenario: Check error

- **WHEN** `Updates.checkForUpdateAsync()` rejects
- **THEN** `track('app_update_failed', { stage: 'check', reason: 'error', errorMessage, channel })` is called exactly once
- **AND** `errorMessage` is the thrown error's `.message` truncated to 256 characters

#### Scenario: Fetch timeout

- **WHEN** `Updates.fetchUpdateAsync()` has not resolved within 10 seconds
- **THEN** `track('app_update_failed', { stage: 'fetch', reason: 'timeout', channel })` is called exactly once

#### Scenario: Fetch error

- **WHEN** `Updates.fetchUpdateAsync()` rejects
- **THEN** `track('app_update_failed', { stage: 'fetch', reason: 'error', errorMessage, channel })` is called exactly once

#### Scenario: Reload error

- **WHEN** `Updates.reloadAsync()` rejects
- **THEN** `track('app_update_failed', { stage: 'reload', reason: 'error', errorMessage, channel })` is called exactly once

#### Scenario: At most one failure per boot

- **WHEN** the OTA pipeline fails at one stage
- **THEN** the pipeline halts at that stage and no subsequent-stage `app_update_failed` fires for the same boot

### Requirement: OTA events carry the build's channel

Every `app_update_available`, `app_update_applied`, and `app_update_failed` event payload SHALL include a `channel: string` field whose value equals the compiled binary's OTA channel (i.e. `Updates.channel` or the `APP_LANG` fallback when `Updates.channel` is unavailable in dev).

#### Scenario: Production build event

- **WHEN** any OTA event fires from a production build whose channel is `"eng"`
- **THEN** the event payload has `channel: "eng"`

#### Scenario: Channel fallback

- **WHEN** `Updates.channel` is unavailable (null / undefined)
- **THEN** the event payload has `channel` set to the current `APP_LANG` env value
