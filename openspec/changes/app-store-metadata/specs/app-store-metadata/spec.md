## ADDED Requirements

### Requirement: Required iOS metadata files exist for Yue zh-Hant

`store-metadata/yue/ios/zh-Hant/` SHALL contain `title.txt`, `full-description.txt`, `keywords.txt`, and `release-notes.txt`. Each file SHALL be non-empty.

#### Scenario: iOS zh-Hant file set complete

- **GIVEN** the `store-metadata/yue/ios/zh-Hant/` directory exists
- **WHEN** its contents are listed
- **THEN** `title.txt`, `full-description.txt`, `keywords.txt`, and `release-notes.txt` are all present and non-empty

### Requirement: Required iOS metadata files exist for Yue en-US

`store-metadata/yue/ios/en-US/` SHALL contain `title.txt`, `full-description.txt`, `keywords.txt`, and `release-notes.txt`. Each file SHALL be non-empty.

#### Scenario: iOS en-US file set complete

- **GIVEN** the `store-metadata/yue/ios/en-US/` directory exists
- **WHEN** its contents are listed
- **THEN** `title.txt`, `full-description.txt`, `keywords.txt`, and `release-notes.txt` are all present and non-empty

### Requirement: Required Android metadata files exist for Yue zh-Hant

`store-metadata/yue/android/zh-Hant/` SHALL contain `title.txt`, `short-description.txt`, `full-description.txt`, and `release-notes.txt`. Each file SHALL be non-empty.

#### Scenario: Android zh-Hant file set complete

- **GIVEN** the `store-metadata/yue/android/zh-Hant/` directory exists
- **WHEN** its contents are listed
- **THEN** `title.txt`, `short-description.txt`, `full-description.txt`, and `release-notes.txt` are all present and non-empty

### Requirement: Required Android metadata files exist for Yue en-US

`store-metadata/yue/android/en-US/` SHALL contain `title.txt`, `short-description.txt`, `full-description.txt`, and `release-notes.txt`. Each file SHALL be non-empty.

#### Scenario: Android en-US file set complete

- **GIVEN** the `store-metadata/yue/android/en-US/` directory exists
- **WHEN** its contents are listed
- **THEN** `title.txt`, `short-description.txt`, `full-description.txt`, and `release-notes.txt` are all present and non-empty

### Requirement: Titles are within platform character limits

Every `title.txt` across both platforms and both locales SHALL contain no more than 30 characters (Unicode code points, excluding trailing newline).

#### Scenario: iOS zh-Hant title within limit

- **GIVEN** `store-metadata/yue/ios/zh-Hant/title.txt` exists
- **WHEN** its character count is measured (excluding trailing newline)
- **THEN** the count is ≤ 30

#### Scenario: iOS en-US title within limit

- **GIVEN** `store-metadata/yue/ios/en-US/title.txt` exists
- **WHEN** its character count is measured (excluding trailing newline)
- **THEN** the count is ≤ 30

#### Scenario: Android zh-Hant title within limit

- **GIVEN** `store-metadata/yue/android/zh-Hant/title.txt` exists
- **WHEN** its character count is measured (excluding trailing newline)
- **THEN** the count is ≤ 30

#### Scenario: Android en-US title within limit

- **GIVEN** `store-metadata/yue/android/en-US/title.txt` exists
- **WHEN** its character count is measured (excluding trailing newline)
- **THEN** the count is ≤ 30

### Requirement: Android short descriptions are within character limit

Every `short-description.txt` SHALL contain no more than 80 characters (excluding trailing newline).

#### Scenario: Android zh-Hant short description within limit

- **GIVEN** `store-metadata/yue/android/zh-Hant/short-description.txt` exists
- **WHEN** its character count is measured (excluding trailing newline)
- **THEN** the count is ≤ 80

#### Scenario: Android en-US short description within limit

- **GIVEN** `store-metadata/yue/android/en-US/short-description.txt` exists
- **WHEN** its character count is measured (excluding trailing newline)
- **THEN** the count is ≤ 80

### Requirement: iOS keywords are within character limit

Every `keywords.txt` SHALL contain no more than 100 characters (excluding trailing newline).

#### Scenario: iOS zh-Hant keywords within limit

- **GIVEN** `store-metadata/yue/ios/zh-Hant/keywords.txt` exists
- **WHEN** its character count is measured (excluding trailing newline)
- **THEN** the count is ≤ 100

#### Scenario: iOS en-US keywords within limit

- **GIVEN** `store-metadata/yue/ios/en-US/keywords.txt` exists
- **WHEN** its character count is measured (excluding trailing newline)
- **THEN** the count is ≤ 100

### Requirement: Screenshots exist at required dimensions for each slot

Screenshot directories SHALL contain at least 5 PNG files. Files in `iphone-6.7/` SHALL be 1290×2796 px. Files in `ipad-12.9/` SHALL be 2048×2732 px. Files in `android-phone/` SHALL be at least 1080×1920 px.

#### Scenario: iPhone 6.7" screenshots present

- **GIVEN** `store-metadata/yue/screenshots/iphone-6.7/` exists
- **WHEN** its PNG files are listed
- **THEN** at least 5 PNG files are present
- **AND** each PNG is 1290 px wide and 2796 px tall

#### Scenario: iPad 12.9" screenshots present

- **GIVEN** `store-metadata/yue/screenshots/ipad-12.9/` exists
- **WHEN** its PNG files are listed
- **THEN** at least 5 PNG files are present
- **AND** each PNG is 2048 px wide and 2732 px tall

#### Scenario: Android phone screenshots present

- **GIVEN** `store-metadata/yue/screenshots/android-phone/` exists
- **WHEN** its PNG files are listed
- **THEN** at least 5 PNG files are present
- **AND** each PNG is at least 1080 px wide and 1920 px tall

### Requirement: eas.json contains a yue-production submit profile

`eas.json` SHALL contain a `submit.yue-production` profile. The profile SHALL include an `ios` section with a `metadataPath` pointing to `store-metadata/yue/ios` and an `android` section with a `metadataPath` pointing to `store-metadata/yue/android`.

#### Scenario: iOS submit profile references metadata directory

- **GIVEN** `eas.json` is parsed as JSON
- **WHEN** `submit.yue-production.ios.metadataPath` is read
- **THEN** the value is `"store-metadata/yue/ios"`

#### Scenario: Android submit profile references metadata directory

- **GIVEN** `eas.json` is parsed as JSON
- **WHEN** `submit.yue-production.android.metadataPath` is read
- **THEN** the value is `"store-metadata/yue/android"`

### Requirement: eng pack has no submit profile

`eas.json` SHALL NOT contain any submit profile whose key or metadata path references `eng`. No `store-metadata/eng/` directory SHALL exist.

#### Scenario: No eng submit profile in eas.json

- **GIVEN** `eas.json` is parsed as JSON
- **WHEN** all keys under `submit` are enumerated
- **THEN** none of the keys contain `"eng"`
- **AND** no `metadataPath` value contains `"eng"`

#### Scenario: No eng store-metadata directory

- **GIVEN** the repository root is inspected
- **WHEN** `store-metadata/` is listed
- **THEN** no `eng` subdirectory exists
