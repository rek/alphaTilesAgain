# Capability: stroke-data-svg

Per-character stroke data extracted from Wikimedia Commons stroke-order SVGs. Owned by `tools/build-stroke-data-deva.ts` (Phase 1). Output shape matches `data-stroke-data` `StrokeData`.

## ADDED Requirements

### Requirement: SVG Source Selection

The extractor SHALL fetch SVGs from `Category:Devanagari stroke order (SVG)` via the Wikimedia API. Files whose `extmetadata.LicenseShortName` is not in the allowlist `{cc-by-3.0, cc-by-sa-3.0, cc0, public-domain}` SHALL be skipped with a warning. Per-file license + artist metadata SHALL be captured and emitted to an attribution registry.

#### Scenario: License rejection
- **GIVEN** an SVG file whose license is `proprietary` or `gfdl`
- **WHEN** the extractor processes the category
- **THEN** the file is skipped, a warning logs the title + license, and no JSON is emitted

#### Scenario: License accept + attribution capture
- **GIVEN** an SVG file licensed `cc-by-sa-3.0` with `Artist=User:Saurmandal`
- **WHEN** the extractor processes the file
- **THEN** the file is downloaded into `tools/data/wikimedia-deva-cache/<char>.svg`
- **AND** an entry `{ character, artist: 'User:Saurmandal', license: 'cc-by-sa-3.0', sourceUrl }` is added to `_attribution.json`

### Requirement: Stroke Group Identification

The parser SHALL identify the stroke group as the `<g>` element whose `inkscape:label` attribute is the maximum numeric label in the document. Non-numeric labels (`Arrows`, `Start markers`) SHALL be ignored.

#### Scenario: Standard 4-group SVG
- **GIVEN** an SVG with groups labelled `"1"`, `"2"`, `"3"`, `"4"`, `"Arrows"`, `"Start markers"`
- **WHEN** the parser runs
- **THEN** the chosen group is the one labelled `"4"`

#### Scenario: Non-standard 5-stroke character
- **GIVEN** an SVG with groups labelled `"1"` through `"5"`
- **WHEN** the parser runs
- **THEN** the chosen group is the one labelled `"5"`

### Requirement: Stroke Path Extraction

Within the chosen group, every child `<path>` whose bounding box exceeds 1% of the character's bounding box SHALL be treated as one stroke, in document order. Smaller paths (start dots, ornaments) SHALL be filtered out and logged.

#### Scenario: Stroke order preserved
- **GIVEN** a chosen group with paths `[d1, d2, d3, d4, d5]` in document order
- **WHEN** strokes are extracted
- **THEN** the output `strokes` array has exactly 5 elements in the order `[d1..d5]`

#### Scenario: Ornament filter
- **GIVEN** a chosen group with 5 normal-size paths plus 1 tiny path (start marker leaked into the group)
- **WHEN** strokes are extracted
- **THEN** the tiny path is dropped and the output has 5 strokes
- **AND** the rejection is logged

### Requirement: Coordinate Normalization

All extracted coordinates SHALL be linearly transformed to a 0..1024 box. The Y-axis SHALL be flipped (origin top-left in SVG → bottom-left in MMH). Coordinates SHALL be rounded to integers.

#### Scenario: Bounding box rescale
- **GIVEN** stroke paths whose combined bounding box is `(x_min=10, y_min=20, x_max=110, y_max=80)`
- **WHEN** normalization runs
- **THEN** coordinate `(10, 20)` maps to `(0, 1024)` (Y-flipped to bottom-left)
- **AND** coordinate `(110, 80)` maps to `(1024, 0)`

### Requirement: Median Sampling

For each normalized stroke path, the extractor SHALL sample 10 points along arc length (uniform spacing) and emit them as `medians[strokeIdx]`. Sample 0 is the path start; sample 9 is the path end.

#### Scenario: Median count
- **GIVEN** a stroke path of any length
- **WHEN** medians are sampled
- **THEN** `medians[strokeIdx].length === 10`
- **AND** the first sample matches the path's start coordinate
- **AND** the last sample matches the path's end coordinate

### Requirement: Output Shape

For each successfully processed character, the extractor SHALL emit `tools/data/devanagari-strokes/<char>.json` with:
```json
{ "character": "<char>", "strokes": [<svgPath>...], "medians": [[[x,y]...]...] }
```
where `strokes.length === medians.length`. The output type matches `data-stroke-data` `StrokeData`.

#### Scenario: Output validates against StrokeData shape
- **GIVEN** the extractor produces `अ.json`
- **WHEN** the output is loaded as `StrokeData`
- **THEN** `character === "अ"`
- **AND** `strokes.length === medians.length`
- **AND** every median is a `[number, number]` pair

### Requirement: Cache Behaviour

The extractor SHALL cache raw SVGs under `tools/data/wikimedia-deva-cache/<char>.svg` (gitignored). On subsequent runs, cached files SHALL be reused without network access. The generated `<char>.json` files SHALL be committed to the repo.

#### Scenario: Cached re-run
- **GIVEN** `tools/data/wikimedia-deva-cache/अ.svg` already exists from a previous run
- **WHEN** the extractor runs again
- **THEN** no network call is made for अ
- **AND** the JSON is regenerated from the cached SVG
