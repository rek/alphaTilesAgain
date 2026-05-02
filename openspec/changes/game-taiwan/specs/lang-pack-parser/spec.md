## ADDED Requirements

### Requirement: Stroke Directory Parsing

The parser SHALL recognise an optional `strokes/<char>.json` directory inside a language pack. For each `*.json` file, the parser MUST load the `StrokeData` shape from `data-stroke-data` and surface the loaded entries under `assets.strokes: Record<string, StrokeData>`. Missing or absent `strokes/` directory SHALL produce an empty `assets.strokes` object — not an error.

#### Scenario: Directory present, files load
- **GIVEN** a pack containing `strokes/醫.json` and `strokes/生.json`
- **WHEN** `parsePack` runs
- **THEN** `assets.strokes["醫"]` and `assets.strokes["生"]` are valid `StrokeData` values

#### Scenario: Directory absent
- **GIVEN** a pack with no `strokes/` directory
- **WHEN** `parsePack` runs
- **THEN** `assets.strokes === {}` (empty object, not undefined, not an error)

#### Scenario: Malformed JSON
- **GIVEN** a pack with `strokes/醫.json` containing invalid JSON
- **WHEN** `parsePack` runs
- **THEN** the parser logs a warning and skips that entry; the pack still loads
