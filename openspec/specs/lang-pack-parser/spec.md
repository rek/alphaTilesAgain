# lang-pack-parser Specification

## Purpose
TBD - created by archiving change lang-pack-parser. Update Purpose after archive.
## Requirements
### Requirement: Pure per-file parser surface

The library SHALL export one parser function per `aa_*.txt` file. Each function SHALL take the raw file contents as a `string` and return a typed object. Functions MUST be pure — no filesystem access, no network, no global state, no React imports. Types SHALL be inferred from return shapes (via `ReturnType<typeof parseX>`), not declared separately.

#### Scenario: Parsing a well-formed `aa_gametiles.txt`

- **WHEN** `parseGametiles(src)` is called with the raw contents of `languages/eng/aa_gametiles.txt`
- **THEN** the returned object has a `headers` field matching the file's first row and a `rows` field of length equal to the data-row count (39 for engEnglish4)
- **AND** `rows[0].base === 'a'`, `rows[0].audioName === 'zz_a'`, `rows[0].stageOfFirstAppearance === 1`

#### Scenario: Parsing a well-formed `aa_langinfo.txt`

- **WHEN** `parseLangInfo(src)` is called with engEnglish4's `aa_langinfo.txt`
- **THEN** `info.find('Lang Name (In Local Lang)') === 'English'`
- **AND** `info.find('Script direction (LTR or RTL)') === 'LTR'`
- **AND** `info.find('Script type') === 'Roman'`

#### Scenario: Parsing `aa_colors.txt` with three columns

- **WHEN** `parseColors(src)` is called with engEnglish4's `aa_colors.txt`
- **THEN** the returned object has `rows.length === 13` and `hexByIndex[0] === '#9C27B0'`

#### Scenario: Parser function is pure

- **WHEN** `parseGametiles(src)` is called twice with the same `src`
- **THEN** both calls return deeply-equal objects (structural equality)
- **AND** no side effects are observable (no writes to global state, no IO)

### Requirement: Structured throw on structurally-malformed input

Every parser SHALL throw a `LangPackParseError` when input violates the expected column layout or when a required integer field is unparseable. The thrown error MUST include `file`, `line` (1-based), `expected` / `got` column counts (when applicable), and an optional `column` / `reason` hint. Parsers MUST NOT throw generic `Error`s.

#### Scenario: Row with fewer columns than header

- **WHEN** a row in `aa_gametiles.txt` has 15 tab-separated cells but the header has 17
- **THEN** `parseGametiles` throws `LangPackParseError` with `file === 'aa_gametiles.txt'`, `line === <1-based row number>`, `expected === 17`, `got === 15`

#### Scenario: Duplicate `aa_langinfo.txt` label after normalization

- **WHEN** two rows in `aa_langinfo.txt` normalize to the same label (e.g. both `"1. Lang Name (In Local Lang)"` and `"Lang Name (In Local Lang)"`)
- **THEN** `parseLangInfo` throws `LangPackParseError` with `file === 'aa_langinfo.txt'`, `reason === 'duplicate label'`, `column === <the label>`

#### Scenario: Unknown `SyllOrTile` value in `aa_games.txt`

- **WHEN** a row has `'X'` in the `SyllOrTile` column
- **THEN** `parseGames` throws `LangPackParseError` with `column === 'SyllOrTile'`, `reason === 'expected T or S'`

#### Scenario: Missing required file in `parsePack`

- **WHEN** `parsePack({ /* missing aa_gametiles */ })` is called
- **THEN** a `LangPackParseError` is thrown with `file === 'aa_gametiles'`, `reason === 'missing from rawFiles'`

### Requirement: Tolerance for cosmetic variance

Parsers SHALL accept any mix of `\r\n`, `\r`, and `\n` line endings, ignore blank/whitespace-only lines anywhere in the file, trim leading/trailing whitespace from each cell, and accept trailing empty cells when the row's `split('\t')` length equals the expected column count.

#### Scenario: CRLF line endings

- **WHEN** `parseWordlist(srcWithCRLF)` is called and `srcWithCRLF` uses `\r\n` between every line
- **THEN** the returned `rows` is identical to parsing the LF-normalized form

#### Scenario: Trailing blank line

- **WHEN** `parseWordlist(src)` is called and `src` ends with an empty line
- **THEN** the empty line is ignored and `rows.length` reflects only actual data rows

#### Scenario: Trailing empty cells

- **WHEN** a `aa_wordlist.txt` row has 6 cells but the last cell is empty (`"word\tword\t0\t-\t0\t"`)
- **THEN** the row is accepted with the last field as an empty string

### Requirement: `aa_langinfo.txt` is label-keyed, not index-keyed

`parseLangInfo` SHALL expose items via `info.find(label): string | undefined` where `label` is the *normalized* label (numeric prefix like `"1. "` stripped, trailing whitespace stripped). The raw entries array SHALL preserve file order. Consumers MUST NOT index by position.

#### Scenario: Normalized label lookup

- **WHEN** the raw file has `"1. Lang Name (In Local Lang)\tEnglish"`
- **THEN** `info.find('Lang Name (In Local Lang)') === 'English'` (numeric prefix stripped)
- **AND** `info.find('1. Lang Name (In Local Lang)')` also returns `'English'` (both label forms accepted)

#### Scenario: Missing label

- **WHEN** a pack's `aa_langinfo.txt` lacks an `Email` entry
- **THEN** `info.find('Email')` returns `undefined` (not a thrown error — consumer decides)

### Requirement: `aa_settings.txt` values are strings; casting at call site

`parseSettings` SHALL store every value as a string and SHALL expose `find(label): string | undefined`, `findBoolean(label, default: boolean): boolean`, `findInt(label, default: number): number`, and `findFloat(label, default: number): number`. The boolean helper SHALL treat `"TRUE" | "True" | "true"` as `true` (Java `Boolean.parseBoolean` semantics). Integer and float helpers SHALL fall back to `default` on unparseable input.

#### Scenario: Boolean helper

- **WHEN** `aa_settings.txt` has `"Has tile audio\tTRUE"`
- **THEN** `settings.findBoolean('Has tile audio', false) === true`
- **AND** `settings.find('Has tile audio') === 'TRUE'` (string preserved)

#### Scenario: Integer helper with default fallback

- **WHEN** `aa_settings.txt` has `"After 12 checked trackers\tthree"` (non-numeric)
- **THEN** `settings.findInt('After 12 checked trackers', 5) === 5`

### Requirement: `aa_colors.txt` third column is the hex value; indexed by row order

`parseColors` SHALL return both a `rows` array of `{ id, name, hex }` objects and a `hexByIndex: string[]` flat list indexed by file row order. The flat list mirrors Java's `colorList` `ArrayList<String>` contents. Game references that index colors by integer (e.g. `aa_games.txt` `Color` column value `5`) SHALL be resolvable via `hexByIndex[5]`.

#### Scenario: Game color reference

- **WHEN** `aa_games.txt` row has `Color === '5'` and `aa_colors.txt` row 5 is `"5\tyellow\t#FFFF00"`
- **THEN** `colors.hexByIndex[5] === '#FFFF00'`

### Requirement: `aa_share.txt` returns a bare string

`parseShare` SHALL return the single link string from the data row. Return type is `string`, not a wrapper object.

#### Scenario: Valid share link

- **WHEN** `parseShare(src)` is called with engEnglish4's `aa_share.txt`
- **THEN** the returned value is `'https://play.google.com/store/apps/details?id=org.alphatilesapps.alphatiles.blue.engEnglish4'`

### Requirement: `parsePack` aggregate

`parsePack(rawFiles)` SHALL consume a `Record<string, string>` keyed by `aa_<name>` (no extension, matching `langManifest.rawFiles` keys from `port-foundations`) and SHALL return `{ tiles, words, syllables, keys, games, langInfo, settings, names, resources, colors, share }`. Each per-file parser SHALL be called exactly once. Any `LangPackParseError` thrown by a child parser SHALL propagate unchanged.

#### Scenario: Full pack parse

- **WHEN** `parsePack(langManifest.rawFiles)` is called for engEnglish4's manifest
- **THEN** the returned object has all eleven top-level keys populated with parsed data
- **AND** `result.langInfo.find('Script direction (LTR or RTL)') === 'LTR'`
- **AND** `result.colors.hexByIndex.length === 13`
- **AND** `result.tiles.rows.length === 39`

#### Scenario: Missing raw-file key

- **WHEN** `parsePack({})` is called with an empty rawFiles map
- **THEN** a `LangPackParseError` is thrown identifying the first missing file in iteration order

### Requirement: Zero runtime dependencies

The library's `package.json` MUST list zero `dependencies`, zero `peerDependencies`, and zero Node-stdlib imports (no `fs`, no `path`, no `crypto`, no `os`). It MAY use Jest and `@types/*` as `devDependencies`.

#### Scenario: Audit dependencies

- **WHEN** `nx graph` or `npm ls` is run against `util-lang-pack-parser`
- **THEN** the production dependency tree is empty

#### Scenario: Source imports

- **WHEN** any `libs/shared/util-lang-pack-parser/src/**/*.ts` file is inspected
- **THEN** no import starts with `node:`, `fs`, `path`, `crypto`, `react`, or any library package name

### Requirement: One function per file, no barrel files except root

The library SHALL have one named-export function per `.ts` file in `src/`, matching the filename. Only `src/index.ts` may re-export from other modules; no intermediate barrel files (`src/parsers/index.ts` etc.) are permitted.

#### Scenario: File / function naming

- **WHEN** `libs/shared/util-lang-pack-parser/src/parseGametiles.ts` is inspected
- **THEN** the file exports exactly one named function `parseGametiles` (plus inline types)

#### Scenario: No intermediate barrels

- **WHEN** the lib's `src/` tree is listed
- **THEN** the only file named `index.ts` is `src/index.ts`

### Requirement: Replaces `port-foundations` mini-parser

This change SHALL delete `tools/_lang-pack-mini-parser.ts` (introduced by `port-foundations` as a stopgap) and SHALL update `tools/rsync-lang-packs.ts` and `apps/alphaTiles/app.config.ts` to import from `@alphaTiles/util-lang-pack-parser` instead.

#### Scenario: Mini-parser removed

- **WHEN** the repo is searched for `_lang-pack-mini-parser`
- **THEN** no matches exist

#### Scenario: `app.config.ts` uses the library

- **WHEN** `apps/alphaTiles/app.config.ts` is read
- **THEN** it imports `parseLangInfo` from `@alphaTiles/util-lang-pack-parser`

