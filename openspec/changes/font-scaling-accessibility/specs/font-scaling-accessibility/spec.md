## ADDED Requirements

### Requirement: Lang pack "Font Scale" setting scales the typography ladder

The app shell (`AppShell`, via `effectiveSettingsOf(...).fontScale` in `@alphaTiles/data-settings`) SHALL read the `"Font Scale"` value from `aa_settings.txt`, parse it to a number, and pass it to `ThemeProvider`, which passes it as the third argument to `buildTheme`. When the key is absent or the parsed value is not a finite number, the provider SHALL pass `1.0`. The provider SHALL clamp parsed values to the closed range `[0.5, 2.5]`.

#### Scenario: Setting "1.3" scales every slot by 1.3

- **GIVEN** a lang pack whose `aa_settings.txt` contains `Font Scale\t1.3`
- **WHEN** the app shell builds the theme
- **THEN** `theme.typography.xs.fontSize` equals `12 * 1.3`
- **AND** `theme.typography.sm.fontSize` equals `14 * 1.3`
- **AND** `theme.typography.md.fontSize` equals `16 * 1.3`
- **AND** `theme.typography.lg.fontSize` equals `20 * 1.3`
- **AND** `theme.typography.xl.fontSize` equals `28 * 1.3`
- **AND** `theme.typography['2xl'].fontSize` equals `40 * 1.3`
- **AND** every slot's `lineHeight` is also scaled by `1.3`

#### Scenario: Absent setting yields default sizes

- **GIVEN** a lang pack whose `aa_settings.txt` does not contain `Font Scale`
- **WHEN** the app shell builds the theme
- **THEN** `theme.typography` matches the pre-change frozen values exactly

#### Scenario: Non-numeric setting falls back to 1.0

- **GIVEN** `aa_settings.txt` contains `Font Scale\tlarge`
- **WHEN** the app shell builds the theme
- **THEN** the theme is built with `fontScale = 1.0`

#### Scenario: Out-of-range setting is clamped

- **GIVEN** `aa_settings.txt` contains `Font Scale\t10`
- **WHEN** the app shell builds the theme
- **THEN** `fontScale` clamps to `2.5`
- **AND** `theme.typography.md.fontSize` equals `16 * 2.5`

### Requirement: `buildTheme` accepts an optional `fontScale` parameter

`util-theme` SHALL export `buildTheme(palette, fontMap, fontScale?: number)`. When `fontScale` is omitted, it SHALL default to `1.0`. The 6 slots `xs, sm, md, lg, xl, 2xl` SHALL be preserved by name and shape; only their numeric `fontSize` and `lineHeight` SHALL change with scale.

#### Scenario: Default keeps existing behavior

- **WHEN** a caller invokes `buildTheme(palette, fontMap)` with no third argument
- **THEN** `theme.typography` matches the pre-change frozen values

#### Scenario: Slot shape is preserved

- **WHEN** `buildTheme(palette, fontMap, anyScale)` is called
- **THEN** `theme.typography` has exactly the keys `xs, sm, md, lg, xl, 2xl`
- **AND** each value has exactly the keys `fontSize` and `lineHeight`

### Requirement: `buildTypography(fontScale)` is the single source of truth

`util-theme` SHALL export `buildTypography(fontScale: number)`. The function SHALL return all 6 slots with `fontSize` and `lineHeight` numerically multiplied by `fontScale`.

#### Scenario: Identity at 1.0

- **WHEN** a caller invokes `buildTypography(1.0)`
- **THEN** the return value's `xs.fontSize` is `12`, `sm.fontSize` is `14`, `md.fontSize` is `16`, `lg.fontSize` is `20`, `xl.fontSize` is `28`, `2xl.fontSize` is `40`

#### Scenario: Doubled at 2.0

- **WHEN** a caller invokes `buildTypography(2.0)`
- **THEN** every slot's `fontSize` and `lineHeight` is exactly twice the value at `1.0`

### Requirement: Non-geometry components scale with the pack font scale

Every non-geometry numeric `fontSize` / `lineHeight` literal in `libs/` SHALL be multiplied by the theme font scale (`useScaledStyles` / `useFontScale` from `@shared/util-theme`), keeping its numeric value so sizes are unchanged at scale `1.0`. (Re-validated: the earlier slot-snapping mapping changed default sizes; see design.md R2.) Outside `ThemeProvider` the scale SHALL be `1.0` rather than throwing.

#### Scenario: No unscaled numeric fontSize remains in non-geometry components

- **WHEN** `grep -rnE "(fontSize|lineHeight): [0-9.]+ *(,|\}|$)" libs/` is run after the migration
- **THEN** the only matches are lines marked with a `// geometry:` exemption comment

#### Scenario: Migrated component scales with `Font Scale`

- **GIVEN** a migrated component such as `<Tile>` rendered under a theme built with `fontScale=1.3`
- **WHEN** the component renders
- **THEN** its text uses `fontSize` equal to its literal size × 1.3 (e.g. `28 * 1.3`)

#### Scenario: Default scale is pixel-identical

- **GIVEN** a pack without `Font Scale`
- **WHEN** any migrated component renders
- **THEN** its `fontSize` equals the pre-change literal

### Requirement: Geometry-based font sizes are exempt

Font sizes derived from element geometry (DoorSvg `width * 0.35`, game-menu door sizes, Ecuador tile height, Myanmar cell side) SHALL NOT be scaled and SHALL carry a `// geometry:` comment. `DoorSvg.tsx` SHALL retain its geometry-based `fontSize = width * 0.35` calculation and SHALL NOT be migrated to `theme.typography`. The exemption SHALL be marked with an inline code comment so future audits do not flag it.

#### Scenario: Exemption is preserved

- **WHEN** `DoorSvg.tsx` is inspected after the migration
- **THEN** its text-sizing line still uses `width * 0.35`
- **AND** an inline comment marks the geometry-based exemption
