## ADDED Requirements

### Requirement: version check fetches latest.json from CDN

`checkForLangPackUpdate` SHALL fetch `<LANG_PACK_BASE_URL>/<APP_LANG>/latest.json` on each call when both env vars are present.

#### Scenario: Fetches correct URL

- **GIVEN** `LANG_PACK_BASE_URL` is `https://cdn.example.com/packs` and `APP_LANG` is `yue`
- **WHEN** `checkForLangPackUpdate()` is called
- **THEN** a fetch is made to `https://cdn.example.com/packs/yue/latest.json`

---

### Requirement: downloads when remote version is greater than local

`checkForLangPackUpdate` SHALL return the remote version string when the remote `version` field is semver-greater than the locally staged version.

#### Scenario: Remote newer than local

- **GIVEN** `current.txt` contains `1.0.0`
- **AND** `latest.json` returns `{ "version": "1.1.0", "minAppVersion": "1.0.0" }`
- **AND** the running app version satisfies `minAppVersion`
- **WHEN** `checkForLangPackUpdate()` is called
- **THEN** it returns `"1.1.0"`

#### Scenario: Remote not newer than local

- **GIVEN** `current.txt` contains `1.1.0`
- **AND** `latest.json` returns `{ "version": "1.1.0", "minAppVersion": "1.0.0" }`
- **WHEN** `checkForLangPackUpdate()` is called
- **THEN** it returns `null`

#### Scenario: No local version present

- **GIVEN** no `current.txt` exists (first install)
- **AND** `latest.json` returns `{ "version": "1.0.0", "minAppVersion": "1.0.0" }`
- **WHEN** `checkForLangPackUpdate()` is called
- **THEN** it returns `"1.0.0"` (treats local version as `0.0.0`)

---

### Requirement: respects minAppVersion — skips download when app is too old

`checkForLangPackUpdate` SHALL return `null` and not initiate a download when the running app version is less than `minAppVersion` in `latest.json`.

#### Scenario: App version satisfies minAppVersion

- **GIVEN** the running app version is `2.0.0`
- **AND** `latest.json` returns `{ "version": "1.5.0", "minAppVersion": "2.0.0" }`
- **WHEN** `checkForLangPackUpdate()` is called
- **THEN** it returns `"1.5.0"`

#### Scenario: App version below minAppVersion

- **GIVEN** the running app version is `1.9.0`
- **AND** `latest.json` returns `{ "version": "1.5.0", "minAppVersion": "2.0.0" }`
- **WHEN** `checkForLangPackUpdate()` is called
- **THEN** it returns `null`

---

### Requirement: writes downloaded pack to documentDirectory

`downloadLangPack` SHALL extract the pack ZIP to `${FileSystem.documentDirectory}downloaded/<langCode>/<version>/` and write the version to `downloaded/<langCode>/current.txt`.

#### Scenario: Successful download writes to correct path

- **GIVEN** `APP_LANG` is `yue` and `version` is `1.1.0`
- **WHEN** `downloadLangPack("1.1.0")` completes successfully
- **THEN** pack contents exist at `${FileSystem.documentDirectory}downloaded/yue/1.1.0/`
- **AND** `${FileSystem.documentDirectory}downloaded/yue/current.txt` contains `1.1.0`

---

### Requirement: loader prefers downloaded pack over bundled when present

`getActiveLangPackPath` SHALL return the downloaded pack path when `current.txt` is present and the corresponding directory exists; otherwise return `null`.

#### Scenario: Downloaded pack present

- **GIVEN** `current.txt` contains `1.1.0`
- **AND** the directory `downloaded/yue/1.1.0/` exists
- **WHEN** `getActiveLangPackPath()` is called
- **THEN** it returns the full path to `downloaded/yue/1.1.0/`

#### Scenario: No downloaded pack

- **GIVEN** no `current.txt` exists
- **WHEN** `getActiveLangPackPath()` is called
- **THEN** it returns `null`
- **AND** the caller falls back to the bundled pack

---

### Requirement: activation deferred to next boot

`downloadLangPack` SHALL write the pack to the staged directory and update `current.txt` but SHALL NOT hot-reload or invalidate in-memory asset state. The newly staged pack SHALL only be used after the next full app boot.

#### Scenario: Downloaded pack not active in current session

- **GIVEN** the app is running with the bundled pack
- **WHEN** `downloadLangPack` completes during the current session
- **THEN** the current session continues using the previously active pack
- **AND** the new pack is active on the next full app boot

---

### Requirement: failures do not crash the app

All public functions SHALL catch and swallow errors (logging via `console.warn`), returning `null` or resolving void rather than throwing.

#### Scenario: Network error on version check

- **GIVEN** the fetch to `latest.json` throws a network error
- **WHEN** `checkForLangPackUpdate()` is called
- **THEN** it returns `null`
- **AND** no exception propagates to the caller

#### Scenario: Download error leaves no partial staged directory

- **GIVEN** the ZIP download fails mid-way
- **WHEN** `downloadLangPack(version)` is called
- **THEN** it resolves without throwing
- **AND** no partial directory remains in `downloaded/<langCode>/<version>/`
- **AND** `current.txt` is not updated

#### Scenario: Invalid ZIP on unzip

- **GIVEN** the downloaded file is not a valid ZIP
- **WHEN** `downloadLangPack(version)` attempts to unzip
- **THEN** it resolves without throwing
- **AND** any partial extracted files are deleted

---

### Requirement: absent LANG_PACK_BASE_URL makes all functions no-ops

When `LANG_PACK_BASE_URL` is not set at build time, `checkForLangPackUpdate` SHALL return `null` immediately without making any network request, and `downloadLangPack` SHALL resolve immediately.

#### Scenario: BASE_URL absent — no network call

- **GIVEN** `LANG_PACK_BASE_URL` is not set
- **WHEN** `checkForLangPackUpdate()` is called
- **THEN** it returns `null`
- **AND** no fetch is made

#### Scenario: APP_LANG absent — no-op

- **GIVEN** `APP_LANG` is not set
- **WHEN** `getActiveLangPackPath()` is called
- **THEN** it returns `null`
- **AND** no file system access is attempted
