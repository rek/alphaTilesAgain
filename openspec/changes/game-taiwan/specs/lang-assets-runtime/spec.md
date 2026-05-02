## ADDED Requirements

### Requirement: Strokes Surface On LangAssets Context

The `LangAssetsProvider` SHALL expose `strokes: Record<string, StrokeData>` on its context value. The map SHALL be populated at boot from the generated `langManifest.ts § strokes` field. When the manifest has no strokes entry, `assets.strokes` MUST equal `{}`.

#### Scenario: yue boot loads strokes
- **GIVEN** the build is `APP_LANG=yue` and the generated manifest has 64 stroke entries
- **WHEN** `LangAssetsProvider` mounts
- **THEN** consumers calling `useLangAssets().strokes` see all 64 entries

#### Scenario: Non-Chinese pack boot has empty strokes
- **GIVEN** the build is `APP_LANG=eng` with no `strokes/` directory
- **WHEN** `LangAssetsProvider` mounts
- **THEN** `useLangAssets().strokes === {}`

### Requirement: Boot-Immutable

`assets.strokes` SHALL be boot-immutable per the existing context contract (`docs/ARCHITECTURE.md § 6`). It SHALL NOT mutate at runtime, and it SHALL NOT be moved into a Zustand store.

#### Scenario: No mutation API
- **WHEN** `LangAssets` is statically analysed
- **THEN** there is no setter or update method that writes to `strokes`
