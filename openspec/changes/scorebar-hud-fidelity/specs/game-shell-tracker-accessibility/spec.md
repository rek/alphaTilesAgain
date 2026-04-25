## ADDED Requirements

### Requirement: Tracker dots expose individual accessibility labels

Each of the 12 tracker dots in `ScoreBar` SHALL be accessible to screen readers with an `accessibilityLabel` of the form `"Tracker N of 12"` (where N is 1–12). The dots MUST NOT use `accessibilityElementsHidden` or `importantForAccessibility="no"`. This matches Java's `android:contentDescription="@string/trackerNof12"`.

#### Scenario: First tracker label

- **WHEN** a screen reader inspects the first tracker dot
- **THEN** it reads `"Tracker 1 of 12"`

#### Scenario: Twelfth tracker label

- **WHEN** a screen reader inspects the last tracker dot
- **THEN** it reads `"Tracker 12 of 12"`

#### Scenario: Complete vs incomplete state conveyed

- **WHEN** a tracker dot is in `complete` state
- **THEN** its `accessibilityLabel` reads `"Tracker N of 12, complete"`

- **WHEN** a tracker dot is in `incomplete` state
- **THEN** its `accessibilityLabel` reads `"Tracker N of 12, incomplete"`

### Requirement: Tracker icons use drawable images when provided

`ScoreBar` SHALL accept an optional `trackerIcons` prop of shape `{ complete: ImageSourcePropType; incomplete: ImageSourcePropType }`. When provided, each dot SHALL render an `<Image>` from the appropriate source instead of a colored `<View>`. When absent, the colored-circle fallback MUST remain.

#### Scenario: Icon rendering with assets provided

- **WHEN** `trackerIcons` prop is supplied
- **THEN** each complete tracker renders `<Image source={trackerIcons.complete} />`
- **AND** each incomplete tracker renders `<Image source={trackerIcons.incomplete} />`

#### Scenario: Fallback without assets

- **WHEN** `trackerIcons` prop is omitted
- **THEN** tracker dots render as colored `<View>` circles (existing behavior)
