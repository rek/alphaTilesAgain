# Capability: build-pipeline (modified)

The existing build pipeline gains a Devanagari-script gate for the new SVG-extractor prebuild step.

## MODIFIED Requirements

### Requirement: Stroke-Data Prebuild Step (Devanagari)

In addition to the existing Chinese-script `tools/build-stroke-data.ts`, a new `tools/build-stroke-data-deva.ts` SHALL run for packs whose `aa_langinfo.txt § Script type === "Devanagari"`. Other scripts skip silently.

The new step has these phases:
1. List Wikimedia Commons category `Devanagari stroke order (SVG)` via the API.
2. For each file, fetch metadata and reject any non-permissively-licensed file (per `stroke-data-svg § Requirement: SVG Source Selection`).
3. Cache the raw SVG under `tools/data/wikimedia-deva-cache/<char>.svg`.
4. Parse + extract strokes per `stroke-data-svg` capability.
5. Emit `tools/data/devanagari-strokes/<char>.json` (committed to repo).
6. Update an attribution registry for the NOTICE generator.

#### Scenario: Devanagari pack
- **GIVEN** a pack with `aa_langinfo.txt § Script type === "Devanagari"`
- **WHEN** `nx prebuild-lang` runs
- **THEN** `build-stroke-data-deva` runs and emits per-character JSONs
- **AND** an attribution registry is updated

#### Scenario: Non-Devanagari pack
- **GIVEN** a pack with `Script type === "Roman"` or `"Chinese"`
- **WHEN** `nx prebuild-lang` runs
- **THEN** `build-stroke-data-deva` exits 0 silently (no API calls, no JSON written)

### Requirement: NOTICE.md Attribution

`apps/alphaTiles/NOTICE.md` SHALL include a "Devanagari stroke data — Wikimedia Commons" section listing every artist whose SVG contributed to a shipped character. Entries MUST include artist name, license short-name, and a link to the source file. (CC BY-SA 3.0 attribution requirement.)
