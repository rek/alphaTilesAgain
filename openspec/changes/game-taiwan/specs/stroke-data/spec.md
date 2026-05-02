# Capability: stroke-data

Per-character stroke data sourced from Make Me a Hanzi (MMH). Owned by `data-stroke-data` (type:data-access). Provides the typed shape, the per-pack on-disk layout, and the runtime accessor used by `feature-game-taiwan`.

## ADDED Requirements

### Requirement: StrokeData Shape

The library SHALL export a `StrokeData` type matching the MMH JSON shape. The shape MUST be:

```ts
export type StrokeData = {
  character: string;        // single hanzi
  strokes: string[];        // SVG path strings, one per stroke, in stroke order
  medians: number[][][];    // per-stroke median curve points, one [x, y] array per stroke
};
```

`strokes.length === medians.length` MUST hold for every entry.

#### Scenario: Type matches MMH JSON
- **GIVEN** an MMH entry from `graphics.txt` for `"醫"`
- **WHEN** loaded into a `StrokeData` value
- **THEN** the value's `strokes` and `medians` arrays come from the MMH entry verbatim
- **AND** `strokes.length === medians.length`

### Requirement: Per-Pack On-Disk Layout

A pack MAY provide stroke data at `languages/<code>/strokes/<char>.json`. Each file SHALL contain exactly one `StrokeData` JSON object. The filename's `<char>` portion SHALL be the single character glyph (URL-encoded if the filesystem requires it).

#### Scenario: Pack with stroke data
- **GIVEN** a Chinese-script pack at `languages/yue/`
- **WHEN** the prebuild emits stroke files
- **THEN** files like `languages/yue/strokes/醫.json` exist with valid `StrokeData` content

#### Scenario: Pack without stroke data
- **GIVEN** a non-Chinese pack at `languages/eng/`
- **WHEN** the prebuild runs
- **THEN** no `strokes/` directory is emitted

### Requirement: Runtime Accessor

The library SHALL export a `useStrokes()` hook (or equivalent context selector) returning `Record<string, StrokeData>` keyed by character. Lookup of a missing character MUST return `undefined`, not throw.

#### Scenario: Hit
- **GIVEN** the active pack has `strokes/醫.json`
- **WHEN** `useStrokes()["醫"]` is read
- **THEN** the returned value is a `StrokeData` whose `character === "醫"`

#### Scenario: Miss
- **GIVEN** the active pack has no `strokes/X.json`
- **WHEN** `useStrokes()["X"]` is read
- **THEN** the returned value is `undefined`
