## ADDED Requirements

### Requirement: Stroke Coverage Warnings For Chinese Packs

The validator SHALL emit warnings (NOT errors) when a Chinese-script pack's `aa_gametiles.txt` contains characters that lack a corresponding `strokes/<char>.json` entry. Non-Chinese-script packs SHALL skip this check entirely.

A pack is "Chinese-script" iff `aa_langinfo.txt § "Script type"` equals `"Chinese"` (case-insensitive).

#### Scenario: Chinese pack missing stroke for tile char
- **GIVEN** `aa_langinfo.txt` script type `"Chinese"` and a tile glyph `"醫生"` whose `"生"` has no `strokes/生.json`
- **WHEN** the validator runs
- **THEN** the validator emits a warning naming `"生"` as missing stroke data
- **AND** the validator exits with success (warnings, not errors)

#### Scenario: Non-Chinese pack skips check
- **GIVEN** `aa_langinfo.txt` script type `"Roman"`
- **WHEN** the validator runs
- **THEN** no stroke-coverage warnings are emitted regardless of `strokes/` directory state

### Requirement: Stroke File Shape Validation

When `strokes/*.json` files are present, the validator SHALL ensure every file matches the `StrokeData` shape (`character: string`, `strokes: string[]`, `medians: number[][][]`, with `strokes.length === medians.length`). Shape failures SHALL be errors (not warnings).

#### Scenario: Mismatched array lengths
- **GIVEN** `strokes/醫.json` with `strokes.length === 5` but `medians.length === 4`
- **WHEN** the validator runs
- **THEN** the validator reports an error and exits non-zero
