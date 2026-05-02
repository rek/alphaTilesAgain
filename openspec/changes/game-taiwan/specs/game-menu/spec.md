## ADDED Requirements

### Requirement: Taiwan Tile Visibility Gating

The country menu SHALL hide the Taiwan game tile when the active pack has fewer than `MIN_STROKE_TILES` (5) characters with stroke data. This SHALL be evaluated at menu render time from `useLangAssets().strokes`.

The constant `MIN_STROKE_TILES = 5` MUST live in `feature-game-menu` (or a util adjacent to the menu) and MUST be a single source-of-truth constant — not duplicated.

#### Scenario: yue pack with 64 stroke entries — Taiwan visible
- **GIVEN** `assets.strokes` has 64 entries
- **WHEN** the menu renders
- **THEN** the Taiwan tile is visible and pressable

#### Scenario: Pack with 3 stroke entries — Taiwan hidden
- **GIVEN** `assets.strokes` has 3 entries
- **WHEN** the menu renders
- **THEN** the Taiwan tile is NOT rendered (no greyed-out placeholder, just absent)

#### Scenario: Non-Chinese pack — Taiwan hidden
- **GIVEN** `assets.strokes === {}`
- **WHEN** the menu renders
- **THEN** the Taiwan tile is NOT rendered

### Requirement: aa_settings.txt Disable Override

If `aa_settings.txt` contains a row `"Enable stroke order game"` set to `"false"` (case-insensitive), the menu SHALL hide the Taiwan tile regardless of stroke-data coverage.

#### Scenario: Settings opts out
- **GIVEN** the pack has full stroke coverage AND `aa_settings.txt § "Enable stroke order game" === "false"`
- **WHEN** the menu renders
- **THEN** the Taiwan tile is NOT rendered

#### Scenario: Settings absent → default true
- **GIVEN** the pack has full stroke coverage AND `aa_settings.txt` has no `"Enable stroke order game"` row
- **WHEN** the menu renders
- **THEN** the Taiwan tile IS rendered (default opt-in)
