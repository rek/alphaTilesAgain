## ADDED Requirements

### Requirement: Stroke-Data Prebuild Step

The prebuild SHALL run a new `tools/build-stroke-data.ts` step **after** `rsync-lang-packs` and **before** `lang-pack-validator`. The step SHALL:

1. Read `aa_langinfo.txt` for the pack at `languages/<APP_LANG>/`. If `Script type !== "Chinese"`, exit success without writing files.
2. Read `aa_gametiles.txt`; collect every distinct character glyph appearing in any tile.
3. Look up each character in the bundled MMH dataset. For each found character, write `languages/<APP_LANG>/strokes/<char>.json` containing the `StrokeData` value.
4. Log a summary: characters covered, characters missing.

Missing-from-MMH characters SHALL log warnings; the step SHALL NOT fail the build when characters are missing.

#### Scenario: Chinese pack emits stroke files
- **GIVEN** `APP_LANG=yue` and `aa_langinfo.txt § Script type === "Chinese"`
- **WHEN** the build runs
- **THEN** for every distinct character in `aa_gametiles.txt` that exists in MMH, a `languages/yue/strokes/<char>.json` file is emitted
- **AND** the build logs the count of covered vs missing characters

#### Scenario: Non-Chinese pack skips silently
- **GIVEN** `APP_LANG=eng` and script type `"Roman"`
- **WHEN** the build runs
- **THEN** no `strokes/` directory is created and no warnings about missing stroke data are emitted

### Requirement: Manifest Includes Stroke Data

`tools/generate-lang-manifest.ts` SHALL extend the generated `langManifest.ts` with a `strokes: Record<string, () => Promise<StrokeData>>` (or eager `Record<string, StrokeData>` — implementer's choice) populated from `languages/<APP_LANG>/strokes/`. The manifest entry MUST be empty `{}` when the directory does not exist.

#### Scenario: Manifest exposes strokes for yue
- **GIVEN** `languages/yue/strokes/醫.json` exists
- **WHEN** `generate-lang-manifest` runs
- **THEN** the emitted `langManifest.ts` includes `醫` as a key under its `strokes` field
