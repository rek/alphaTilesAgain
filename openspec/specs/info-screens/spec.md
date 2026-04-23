# info-screens Specification

## Purpose
TBD - created by archiving change about-share-resources-screens. Update Purpose after archive.
## Requirements
### Requirement: About screen renders pack identity and app version

The About screen SHALL display the app version (from `expo-application`), the local-language pack name (from `aa_langinfo.txt` item 1), the pack's English name + country (items 2 + 5), credits (items 9 + 14), an email link (item 12), and a privacy policy link (item 13). Items 12, 13, and 14 MAY be absent / `"none"` / empty — the corresponding surface SHALL hide when absent.

#### Scenario: Full pack

- **WHEN** the pack supplies all optional fields (email, privacy policy URL, secondary credits)
- **THEN** the About screen renders the app version line, credits block, secondary credits block, email link, and privacy policy link

#### Scenario: Minimal pack (optionals absent)

- **WHEN** `aa_langinfo.txt` item 12 is `"none"`, item 13 is empty, and item 14 is `"none"`
- **THEN** the email link, privacy policy link, and secondary credits block are not rendered
- **AND** no broken-link placeholder is shown

#### Scenario: Same-name packs

- **WHEN** the local-lang name equals the English name (item 1 equals item 2)
- **THEN** the screen renders one name plus country (mirroring Java's `names_plus_countryB` branch) rather than duplicating

### Requirement: About screen opens external links via platform-appropriate handler

The About screen SHALL open the privacy policy URL via `expo-web-browser` (in-app browser on iOS/Android, new tab on web). Email links SHALL open via `Linking.openURL('mailto:…')`.

#### Scenario: Privacy policy tap on iOS/Android

- **WHEN** the user taps the privacy policy link
- **THEN** the URL opens in the in-app browser (SFSafariViewController / Custom Tabs)

#### Scenario: Privacy policy tap on web

- **WHEN** the user taps the privacy policy link in a web build
- **THEN** the URL opens in a new browser tab

#### Scenario: Email tap

- **WHEN** the user taps the email link
- **THEN** `Linking.openURL('mailto:<address>')` is called and the device's mail composer opens

### Requirement: Share screen renders a QR code and a native share affordance

The Share screen SHALL render a QR code encoding the pack's Play Store URL (from `aa_share.txt` row 2) plus a button that invokes the native share sheet with the same URL. The QR code SHALL be rendered via `react-native-qrcode-svg` so it works identically on iOS, Android, and web.

#### Scenario: Valid share URL

- **WHEN** `aa_share.txt` row 2 contains a well-formed URL
- **THEN** the screen renders a QR code encoding that URL
- **AND** the share button, when tapped, invokes `Share.share({ message: url, url })`

#### Scenario: Missing share URL

- **WHEN** `aa_share.txt` is missing, empty, or row 2 does not parse to a URL
- **THEN** the QR code is not rendered
- **AND** the screen shows the `chrome:share.unavailable` message
- **AND** the share button is hidden

#### Scenario: QR code accessibility

- **WHEN** the QR code is rendered
- **THEN** it is wrapped in a view with `accessibilityRole="image"` and `accessibilityLabel` set to `chrome:share.qrAlt`

### Requirement: Resources screen lists pack-authored external links

The Resources screen SHALL parse `aa_resources.txt` (tab-delimited; columns `Name`, `Link`, `Image`; header row skipped) and render each row as a tappable entry whose label is `Name` and whose tap opens `Link` via `expo-web-browser`. The `Image` column is stored on the row model for future use but is not rendered in v1.

#### Scenario: Non-empty resources

- **WHEN** `aa_resources.txt` contains two or more data rows
- **THEN** each row renders as a tappable entry in order of appearance
- **AND** the list is vertically scrollable (no pagination)

#### Scenario: Empty resources

- **WHEN** `aa_resources.txt` contains only the header row (or is empty)
- **THEN** the screen renders the `chrome:resources.empty` string
- **AND** no list is rendered

#### Scenario: Resource link tap

- **WHEN** the user taps a resource entry
- **THEN** the `Link` URL opens via `expo-web-browser` (in-app browser on native, new tab on web)

### Requirement: Every tappable link has link accessibility metadata

Every tappable link on all three screens SHALL expose `accessibilityRole="link"` and a descriptive `accessibilityLabel`. Tappable buttons (share sheet) SHALL expose `accessibilityRole="button"`. Hit targets SHALL include a `hitSlop` of at least 10 logical pixels on all sides.

#### Scenario: Privacy policy link metadata

- **WHEN** the privacy policy link is rendered on the About screen
- **THEN** the rendered element has `accessibilityRole="link"` and `accessibilityLabel` equal to `chrome:about.privacy` translation

#### Scenario: Share button metadata

- **WHEN** the share button is rendered on the Share screen
- **THEN** the element has `accessibilityRole="button"` and `accessibilityLabel` equal to `chrome:share.button` translation

#### Scenario: Resource entry metadata

- **WHEN** a resource entry is rendered on the Resources screen
- **THEN** the element has `accessibilityRole="link"` and `accessibilityLabel` equal to the resource's `Name` column value

### Requirement: Each screen fires `screen_viewed` on mount

Each of the About, Share, and Resources containers SHALL call `track('screen_viewed', { screen: <name> })` exactly once on mount, where `<name>` is `'about'`, `'share'`, or `'resources'` respectively. No other analytics events SHALL fire from these screens in v1.

#### Scenario: About mount

- **WHEN** the About container mounts
- **THEN** `track('screen_viewed', { screen: 'about' })` is called exactly once

#### Scenario: Share mount

- **WHEN** the Share container mounts
- **THEN** `track('screen_viewed', { screen: 'share' })` is called exactly once

#### Scenario: Resources mount

- **WHEN** the Resources container mounts
- **THEN** `track('screen_viewed', { screen: 'resources' })` is called exactly once

#### Scenario: No other events from these screens

- **WHEN** a user interacts with links, share buttons, or resource entries
- **THEN** no additional analytics events are fired by these screens

### Requirement: Container/presenter split

Each of the three screens SHALL be implemented as a container component (reads hooks, i18n, analytics) plus a presenter component (pure props→JSX). The presenter component MUST NOT import `react-i18next`, `useLangAssets`, `expo-application`, or any analytics API. All translated strings and handler callbacks MUST be passed as props from the container.

#### Scenario: Presenter purity

- **WHEN** `AboutScreen`, `ShareScreen`, or `ResourcesScreen` is rendered with fixture props in a test or Storybook environment
- **THEN** the component renders correctly without any hook providers, i18n setup, or asset-loading context

#### Scenario: Container ownership

- **WHEN** a new i18n key is added to any of these screens
- **THEN** it is consumed via `useTranslation()` in the container and passed as a prop, not referenced directly from the presenter

### Requirement: Routes are thin re-exports

`apps/alphaTiles/app/about.tsx`, `apps/alphaTiles/app/share.tsx`, and `apps/alphaTiles/app/resources.tsx` SHALL each be one-line modules that re-export the corresponding container from its feature library as the default export. The route file MUST NOT contain layout, state, or navigation logic.

#### Scenario: About route

- **WHEN** `apps/alphaTiles/app/about.tsx` is inspected
- **THEN** the file contains a single re-export of `AboutContainer` from `@alphaTiles/feature-about` as the default export, with no additional logic

