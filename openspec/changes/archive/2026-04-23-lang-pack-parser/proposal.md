## Why

`port-foundations` wires a prebuild that materializes `languages/<APP_LANG>/` and inlines each `aa_*.txt` file as a raw string under `langManifest.rawFiles`. Nothing yet turns those strings into typed domain models. Every downstream consumer — the full validator (`lang-pack-validator`), the runtime loader (`lang-assets-runtime`), future per-class precomputes, and the eventual engine — needs the same typed view of a pack. Without a single parser, each consumer would re-implement tab splitting and column mapping, guaranteeing drift from the `Start.java` reference implementation and from each other.

This change ports the Java-side pack-reading logic (`Start.java` `buildTileList` / `buildWordList` / `buildSyllableList` / `buildKeyList` / `buildGameList` / `buildLangInfoList` / `buildSettingsList` / `buildColorList` + the supporting `aa_names.txt`, `aa_resources.txt`, `aa_share.txt` readers) into a **pure** TypeScript library that takes raw string inputs and returns typed domain objects. No file IO, no React, no runtime deps — testable under Node, reusable under Metro, and importable from any `type:util` or above.

## What Changes

- Add `libs/shared/util-lang-pack-parser/` library (type `util`, scope `shared`). Generated with `nx g @nx/js:lib util-lang-pack-parser --directory=libs/shared/util-lang-pack-parser --tags='type:util,scope:shared'`.
- One parse function per `aa_*.txt` file, one file per function, named export matching the filename:
  - `parseGametiles(src: string): TileList`
  - `parseWordlist(src: string): WordList`
  - `parseSyllables(src: string): SyllableList`
  - `parseKeyboard(src: string): KeyList`
  - `parseGames(src: string): GameList`
  - `parseLangInfo(src: string): LangInfo`
  - `parseSettings(src: string): SettingsList`
  - `parseNames(src: string): AvatarNameList`
  - `parseResources(src: string): ResourceList`
  - `parseColors(src: string): ColorList`
  - `parseShare(src: string): ShareLink`
- One error type `LangPackParseError` with `file`, `line`, `column`, `expected`, `got` fields. Thrown only on structurally-malformed input (wrong column count, unparseable required field). Missing optional columns, trailing blanks, CRLF remnants tolerated silently.
- One "parse-all" convenience function `parsePack(rawFiles: Record<string, string>): ParsedPack` that runs the individual parsers in a fixed order and aggregates the result. Still pure — takes the raw-files map emitted by `port-foundations`' `langManifest.rawFiles` directly.
- Types inferred from parser return shapes via `ReturnType<typeof parseGametiles>`. No separate `.types.ts` file. Library root `index.ts` re-exports every parser and the aggregated types.
- Unit tests under `libs/shared/util-lang-pack-parser/src/**/__tests__/` driven by real fixtures copied into a test-fixture directory at lib build time (the parser doesn't know about `languages/`; tests import the fixture strings via Jest's `raw-loader`-style pattern or inline string constants seeded from a small sample).

## Capabilities

### New Capabilities

- `lang-pack-parser`: the typed read surface for every `aa_*.txt` file in a language pack. One function per file, plus a `parsePack()` aggregator. Pure string-in, typed-object-out.

### Modified Capabilities

_None._ `port-foundations` only inlined raw strings into the manifest; it made no claims about parsing. This change introduces parsing from zero.

## Impact

- **New files**: `libs/shared/util-lang-pack-parser/{project.json, tsconfig.lib.json, tsconfig.spec.json, jest.config.ts, src/index.ts, src/parseGametiles.ts, src/parseWordlist.ts, src/parseSyllables.ts, src/parseKeyboard.ts, src/parseGames.ts, src/parseLangInfo.ts, src/parseSettings.ts, src/parseNames.ts, src/parseResources.ts, src/parseColors.ts, src/parseShare.ts, src/parsePack.ts, src/LangPackParseError.ts, src/internal/splitLines.ts, src/internal/splitRow.ts}` plus `__tests__/` per parser.
- **No runtime dependencies added**. Lib's `package.json` lists zero deps and zero peerDeps. Dev-only: `@types/jest` via workspace root.
- **Downstream unblocks**: `lang-pack-validator` can consume the typed pack instead of re-implementing tab splits. `lang-assets-runtime` can type `useLangAssets().tiles` as `TileList`.
- **No runtime behavior change yet** — the parser is a pure library. Actual consumption lands in `lang-assets-runtime`.
- **Replaces** the `tools/_lang-pack-mini-parser.ts` helper introduced by `port-foundations` for pack label-reading: `app.config.ts` and `rsync-lang-packs.ts` both switch to `parseLangInfo()` from this library. Mini-parser is deleted in this change.

## Out of Scope

- Semantic validation (tile-to-word cross-refs, audio-reference checks, stages coherence) — that is `lang-pack-validator`'s scope. This library only ensures *structural* parseability.
- Manifest resolution (binding `audioName` to a `require()`'d number) — that is `lang-assets-runtime`'s scope. This library returns strings; the runtime binds them to bundled assets.
- Precomputes — `util-precompute` consumes parser output; this library does not know the registry exists.
- `aa_notes.txt` — validator-only concern, not part of the runtime parser surface.
