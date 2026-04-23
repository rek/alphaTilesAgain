## 0. Preflight

- [ ] 0.1 Read `AGENTS.md` and `openspec/AGENT_PROTOCOL.md`
- [ ] 0.2 Read this change's `proposal.md` and `design.md` in full
- [ ] 0.3 Read required upstream change design docs (see `design.md → ## Context`)
- [ ] 0.4 Read required `docs/ARCHITECTURE.md` sections and referenced ADRs
- [ ] 0.5 Open the source Java files named in `design.md → ## Context`; keep them in view during implementation
- [ ] 0.6 Open the fixture files named in `design.md → ## Context`; verify pack content matches the assumptions the design makes
- [ ] 0.7 Confirm upstream changes are merged (`openspec status --all`); do not start if an upstream is only in-progress
- [ ] 0.8 Confirm `APP_LANG` and `PUBLIC_LANG_ASSETS` env vars are set for local runs
- [ ] 0.9 Confirm `nx graph` shows the libs this change will touch don't already exist with conflicting tags

## 1. Library scaffold

- [x] 1.1 Generate `libs/shared/util-lang-pack-parser` via `nx g @nx/js:lib util-lang-pack-parser --directory=libs/shared/util-lang-pack-parser --tags='type:util,scope:shared' --importPath=@alphaTiles/util-lang-pack-parser`
- [x] 1.2 Confirm generated `project.json` has `type:util` and `scope:shared` tags; verify no extra runtime deps in `package.json`
- [x] 1.3 Ensure `jest.config.ts` points at the shared preset and fixtures path; add a jest setup file that conditionally skips parser-fixture tests if `languages/eng/` is absent
- [x] 1.4 Add library root `src/index.ts` re-exporting every named parser, `parsePack`, and `LangPackParseError` (populated as parsers are added)

## 2. Internal helpers

- [x] 2.1 Create `src/LangPackParseError.ts`:
  - [x] 2.1.1 `class LangPackParseError extends Error` with readonly `file`, `line`, `expected?`, `got?`, `column?`, `reason?` fields
  - [x] 2.1.2 Human `message` built from fields in constructor; preserved for test assertion
  - [x] 2.1.3 Unit tests for message formatting + field retention
- [x] 2.2 Create `src/internal/splitLines.ts`:
  - [x] 2.2.1 Accept `\r\n`, `\r`, `\n`; normalize to per-line strings
  - [x] 2.2.2 Drop blank / whitespace-only lines
  - [x] 2.2.3 Strip trailing `\r` per line
  - [x] 2.2.4 Unit tests: LF-only, CRLF-only, mixed, trailing blanks, internal blanks
- [x] 2.3 Create `src/internal/splitRow.ts`:
  - [x] 2.3.1 Signature `splitRow(line, expectedColumns, fileName, lineNumber) => string[]`
  - [x] 2.3.2 Split on `\t`; trim only leading/trailing whitespace per cell (not intra-cell)
  - [x] 2.3.3 Accept trailing empty cells when length === expected; reject when length < expected
  - [x] 2.3.4 Throw `LangPackParseError` on column-count mismatch
  - [x] 2.3.5 Unit tests: exact match, trailing tabs accepted, short row rejected, long row with non-empty extras rejected

## 3. Per-file parsers (each includes: impl + unit tests against real fixtures + doc-comment referencing `Start.java` lines + inline column-index comments)

- [x] 3.1 `parseShare.ts` — 2-line file, returns `string` (the link)
- [x] 3.2 `parseColors.ts` — 3 cols (`id`, `name`, `hex`); returns `{ rows: Array<{id,name,hex}>, hexByIndex: string[] }`
- [x] 3.3 `parseKeyboard.ts` — 2 cols (`keys`, `theme_color`); returns `{ rows: Array<{ key, color }> }`
- [x] 3.4 `parseNames.ts` — 2 cols (`Entry`, `Name`); returns `{ rows: Array<{ entry, name }> }` (empty rows allowed)
- [x] 3.5 `parseResources.ts` — 3 cols (`Name`, `Link`, `Image`); returns `{ rows: Array<{ name, link, image }> }`
- [x] 3.6 `parseSyllables.ts` — 7 cols (`Syllable`, `Or1`, `Or2`, `Or3`, `SyllableAudioName`, `Duration`, `Color`); returns `{ rows: Array<{syllable, distractors:[a,b,c], audioName, duration:number, color}> }`
- [x] 3.7 `parseGames.ts` — 8 cols (`Door`, `Country`, `ChallengeLevel`, `Color`, `InstructionAudio`, `AudioDuration`, `SyllOrTile`, `StagesIncluded`); `Door` and `ChallengeLevel` as number, `SyllOrTile` as `'T' | 'S'` (reject other values), others as strings
- [x] 3.8 `parseLangInfo.ts`:
  - [x] 3.8.1 2 cols (`Item`, `Answer`)
  - [x] 3.8.2 Normalize item labels (strip leading numeric prefix like `"1. "` and trailing whitespace)
  - [x] 3.8.3 Return `{ entries: Array<{ label, value }>, find(label): string | undefined }`
  - [x] 3.8.4 Throw on duplicate normalized label
  - [x] 3.8.5 Tests: `find('Script direction (LTR or RTL)')` returns `'LTR'` for engEnglish4 fixture
- [x] 3.9 `parseSettings.ts`:
  - [x] 3.9.1 2 cols (`Setting`, `Value`)
  - [x] 3.9.2 Same label-normalization approach as `parseLangInfo`
  - [x] 3.9.3 Return `{ entries, find(label): string, findBoolean(label, default), findInt(label, default), findFloat(label, default) }`
  - [x] 3.9.4 All values stored as strings; cast-helpers match Java `Boolean.parseBoolean` / `Integer.parseInt` / `Double.parseDouble` semantics (including `"TRUE"` / `"True"` / `"true"` all boolean-true)
  - [x] 3.9.5 Tests: `findBoolean('Has tile audio', false)` returns `true` for engEnglish4
- [x] 3.10 `parseWordlist.ts`:
  - [x] 3.10.1 6 cols (`EnglishLWC`/`wordInLWC`, `EnglishLOP`/`wordInLOP`, `duration`, `mixedDefs`, `placeholder`, `stageOfFirstAppearance`)
  - [x] 3.10.2 `duration` parsed as number (0 allowed; Java stores as int)
  - [x] 3.10.3 `stageOfFirstAppearance` stored as raw string (Java matches against `[0-9]+` at call site)
  - [x] 3.10.4 Return `{ headers, rows: Array<{ wordInLWC, wordInLOP, duration, mixedDefs, stageOfFirstAppearance }> }`
- [x] 3.11 `parseGametiles.ts`:
  - [x] 3.11.1 17 cols as documented in `design.md §D1`
  - [x] 3.11.2 Stage columns (cols 14 / 15 / 16) parsed with `parseStageIntOrOne` helper — unparseable / out-of-range (1..7) falls back to 1, matching `Start.java` clamp behavior
  - [x] 3.11.3 Return `{ headers, rows: Array<TileRow> }` where TileRow fields match `Start.java` Tile class (see `design.md §D1`)
  - [x] 3.11.4 Do NOT filter by `SAD` / `none` types here — that's semantics, Java does it downstream of parsing
  - [x] 3.11.5 Tests: engEnglish4 returns 39 tile rows; row[0].base === 'a', row[0].audioName === 'zz_a', row[0].stageOfFirstAppearance === 1

## 4. Aggregate parser

- [x] 4.1 `parsePack.ts`:
  - [x] 4.1.1 Accepts `Record<string, string>` keyed by `aa_<name>` (no extension)
  - [x] 4.1.2 Calls each per-file parser in the order defined in `design.md §D5`
  - [x] 4.1.3 Returns `{ tiles, words, syllables, keys, games, langInfo, settings, names, resources, colors, share }`
  - [x] 4.1.4 Throws if any required key is missing from `rawFiles` (wraps in `LangPackParseError` with `file` = missing key)
  - [x] 4.1.5 Test: run against a full `langManifest.rawFiles` dump from engEnglish4; assert shape and spot-check values
- [x] 4.2 Type `ParsedPack = ReturnType<typeof parsePack>` re-exported from root `index.ts`

## 5. Replace `port-foundations` mini-parser

- [x] 5.1 Update `tools/rsync-lang-packs.ts`:
  - [x] 5.1.1 Replace mini-parser calls with `parseLangInfo`, `parseGametiles`, `parseWordlist`, `parseSyllables` from the new library
  - [x] 5.1.2 Import via relative path or workspace path alias (confirm tsconfig path works for Bun-executed scripts)
- [x] 5.2 Update `apps/alphaTiles/app.config.ts` to call `parseLangInfo(fs.readFileSync(...))` from the new library
- [x] 5.3 Delete `tools/_lang-pack-mini-parser.ts`
- [ ] 5.4 Run `APP_LANG=eng nx start alphaTiles` end-to-end to confirm the pipeline still boots

## 6. Tests

- [x] 6.1 Unit tests for every parser (real fixtures for happy path; synthetic strings for error paths)
- [x] 6.2 Parser-level error tests: wrong column count per file; non-integer where integer required; duplicate `aa_langinfo.txt` label
- [x] 6.3 `parsePack` integration test: full engEnglish4 pack; assertion depth = shape + 2-3 spot-checked field values per file
- [x] 6.4 `parsePack` integration test: full tpxTeocuitlapa pack (faithfulness fixture)
- [ ] 6.5 `parsePack` integration test: templateTemplate pack (validator fixture — may have deliberately empty files; confirm `parsePack` doesn't choke)
- [x] 6.6 `nx affected -t test` triggers this lib's tests when any `src/*.ts` changes

## 7. Documentation

- [x] 7.1 Add library root `README.md` with the one-function-per-file rule, a minimal usage example, and a link to `openspec/changes/lang-pack-parser/design.md`
- [x] 7.2 Module-level JSDoc on each `parseX.ts` referencing the corresponding `Start.java` method + line range
- [x] 7.3 Inline `// col N — <header>` comments on every field extraction

## 8. Verification

- [x] 8.1 `openspec validate lang-pack-parser` passes
- [x] 8.2 `nx test util-lang-pack-parser` passes against `languages/eng/` and `languages/tpx/` fixtures
- [x] 8.3 `nx lint util-lang-pack-parser` passes (no barrel-file violations; no disallowed imports)
- [ ] 8.4 `APP_LANG=eng nx start alphaTiles` boots (pipeline consumes the new parsers transparently)
- [x] 8.5 Bundle analysis: `util-lang-pack-parser` has zero production dependencies (verify via `pnpm why` / `nx graph`)
