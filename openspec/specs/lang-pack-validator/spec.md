# lang-pack-validator Specification

## Purpose
TBD - created by archiving change lang-pack-validator. Update Purpose after archive.
## Requirements
### Requirement: Programmatic validator API

The library SHALL expose `validateLangPack(input: { rawFiles: Record<string,string>; fileInventory: FileInventory }): ValidationReport` as its primary entry point. The function MUST be pure — no filesystem, network, or global state. The input is the raw-string map (same shape as `langManifest.rawFiles` from `port-foundations`) plus a listing of files present on disk.

#### Scenario: Well-formed pack yields zero errors

- **WHEN** `validateLangPack({ rawFiles, fileInventory })` is called with a complete, valid pack (e.g. engEnglish4)
- **THEN** the report's `counts.error === 0`
- **AND** `report.ok === true`

#### Scenario: Pack with missing audio file

- **WHEN** `aa_gametiles.txt` references `audioName === 'zz_a'` but `fileInventory.tileAudio` does not contain `'zz_a'`
- **THEN** the report contains an issue with `code === 'MISSING_TILE_AUDIO'`, `severity === 'error'`, `category === 'audio-reference'`, `context.audioName === 'zz_a'`
- **AND** `report.ok === false`

#### Scenario: Pure function invariant

- **WHEN** `validateLangPack` is called twice with identical input
- **THEN** both calls return deeply-equal reports (after normalized sort of issues)
- **AND** no filesystem, network, or global-state side effects are observable

### Requirement: Structured `Issue` and `ValidationReport`

Every reported issue SHALL have `severity`, `code`, `category`, `message` fields, plus optional `file`, `line`, `column`, `context`. The aggregate report SHALL expose `counts: { error, warning, info, total }` and an `ok: boolean` convenience computed from `counts.error === 0`. Issues SHALL be sorted by `(severity, category, file, line)` for stable output.

#### Scenario: Issue severity grouping

- **WHEN** a report has 3 errors, 5 warnings, and 2 info issues
- **THEN** `counts.error === 3`, `counts.warning === 5`, `counts.info === 2`, `counts.total === 10`
- **AND** `ok === false`

#### Scenario: Warnings do not block

- **WHEN** a report has 0 errors and 7 warnings
- **THEN** `ok === true`

#### Scenario: Stable issue ordering

- **WHEN** the same pack is validated twice
- **THEN** the two reports' `issues` arrays are identical (same order, same content)

### Requirement: Parse failures halt validation with a single-issue report

When `parsePack(rawFiles)` throws a `LangPackParseError`, the validator SHALL return a report containing exactly one issue of `code === 'PARSE_FAILURE'`, `severity === 'error'`, with `file` / `line` / `column` fields populated from the thrown error. No further checks run.

#### Scenario: Structurally malformed `aa_gametiles.txt`

- **WHEN** `rawFiles['aa_gametiles']` has a row with wrong column count, causing `parseGametiles` to throw
- **THEN** the report contains exactly one issue with `code === 'PARSE_FAILURE'`, `file === 'aa_gametiles.txt'`, `line === <the bad row>`
- **AND** `report.counts.error === 1` and `report.counts.warning === 0`

### Requirement: File-presence checks

The validator SHALL verify the presence of: all required `aa_*.txt` files (except `aa_notes.txt`); at least one TTF under fonts; exactly 12 avatar PNGs; exactly 12 avatar-icon PNGs; per-tile / per-word / per-syllable / per-game-instruction audio files referenced by the respective `aa_*.txt` files; per-word images (`<wordLWC>.png`). Missing required files SHALL be errors; cosmetic absences (`icon.png`, `splash.png`, tile glyph images, `<word>2.png` distractor variants) SHALL be silent (no issue) unless the pack explicitly claims they exist.

#### Scenario: Missing `aa_wordlist.txt`

- **WHEN** `rawFiles` lacks `aa_wordlist`
- **THEN** an issue `code === 'MISSING_REQUIRED_FILE'`, `severity === 'error'`, `file === 'aa_wordlist.txt'` is emitted

#### Scenario: Missing avatar count

- **WHEN** `fileInventory.avatars` has 11 entries (not 12)
- **THEN** issue `code === 'WRONG_AVATAR_COUNT'`, `severity === 'error'`, `context.got === 11`, `context.expected === 12` is emitted

#### Scenario: Icon absent

- **WHEN** `fileInventory.icon` is undefined
- **THEN** no issue is emitted (shared default is used)

### Requirement: Tile-word cross-reference check

For every word in `aa_wordlist.txt`, the validator SHALL attempt to decompose its LOP column into tiles via `util-phoneme.parseWordIntoTiles`. A word whose decomposition contains `null` (unparseable) SHALL produce a `WORD_CANNOT_PARSE_INTO_TILES` error. A word with >15 tiles SHALL produce `WORD_TOO_LONG_FOR_GAMES`. Tiles underused in the wordlist (<3 occurrences) SHALL produce `TILE_UNDERUSED` recommendations (info severity).

#### Scenario: Word decomposes cleanly

- **WHEN** a word's LOP is `"bat"` and tiles `b`, `a`, `t` all exist
- **THEN** no issue is emitted for this word

#### Scenario: Word cannot parse

- **WHEN** a word's LOP is `"@@@"` (characters no tile owns)
- **THEN** issue `code === 'WORD_CANNOT_PARSE_INTO_TILES'`, `context.word === '@@@'`, `context.preliminaryParse === [...]` is emitted

#### Scenario: Oversized word

- **WHEN** a word decomposes into 16 tiles
- **THEN** issue `code === 'WORD_TOO_LONG_FOR_GAMES'` with severity `error` is emitted

### Requirement: Stage coherence check

The validator SHALL port `StagesChecks.check()` and emit one `STAGE_WORD_COUNT` info issue per stage 1–7 (containing the cumulative word and tile counts) and `EMPTY_STAGE` warnings for any stage with zero words. Explicit `stageOfFirstAppearance` overrides on words SHALL be respected per Java semantics. Raw `stageOfFirstAppearance` values outside 1..7 in `aa_gametiles.txt` SHALL produce `INVALID_TILE_STAGE` errors (the parser clamps for runtime, but the validator flags the source defect).

#### Scenario: All stages have content

- **WHEN** a pack has at least one word per stage 1..7
- **THEN** 7 `STAGE_WORD_COUNT` info issues are emitted and no `EMPTY_STAGE` warning

#### Scenario: Stage with zero words

- **WHEN** stage 7 has no qualifying words
- **THEN** `EMPTY_STAGE` warning with `context.stage === 7` is emitted

#### Scenario: Out-of-range stage in source

- **WHEN** `aa_gametiles.txt` has a tile with `stageOfFirstAppearance === "9"`
- **THEN** `INVALID_TILE_STAGE` error with `context.raw === '9'` is emitted

### Requirement: Duplicate detection

The validator SHALL detect and report duplicates among: tile base keys, word LWC keys, syllable keys, color indices, game door numbers. Within a single tile row, duplicates among (base, alt1, alt2, alt3) SHALL produce `TILE_SELF_DUPLICATE_DISTRACTOR` warnings.

#### Scenario: Duplicate tile key

- **WHEN** `aa_gametiles.txt` has two rows with `base === 'a'`
- **THEN** issue `code === 'DUPLICATE_TILE_KEY'`, `severity === 'error'`, `context.key === 'a'` is emitted exactly once (one issue per duplicated key, not per duplicate row)

#### Scenario: Tile's own distractor duplicates the base

- **WHEN** a tile row has `base === 'a'` and `alt1 === 'a'`
- **THEN** issue `code === 'TILE_SELF_DUPLICATE_DISTRACTOR'`, `severity === 'warning'` is emitted

### Requirement: Game structure check

The validator SHALL enforce: `Country` ∈ `{Brazil, Chile, China, Colombia, Ecuador, Georgia, Iraq, Italy, Japan, Malaysia, Mexico, Myanmar, Peru, Romania, Sudan, Thailand, UnitedStates}`; `ChallengeLevel` parseable as integer; `Door` unique and sequential from 1; `InstructionAudio` is a real file under `audio/instructions/` OR the reserved token `naWhileMPOnly`; `AudioDuration` parseable as integer.

#### Scenario: Unknown game class

- **WHEN** `aa_games.txt` has `Country === 'Atlantis'`
- **THEN** issue `code === 'UNKNOWN_GAME_COUNTRY'`, `severity === 'error'`, `context.value === 'Atlantis'` is emitted

#### Scenario: Non-sequential doors

- **WHEN** `aa_games.txt` has doors `1, 2, 4, 5` (skipping 3)
- **THEN** issue `code === 'NON_SEQUENTIAL_GAME_DOORS'`, `severity === 'warning'` is emitted

#### Scenario: Reserved instruction audio token

- **WHEN** a game row has `InstructionAudio === 'naWhileMPOnly'` and no file of that name exists under `audio/instructions/`
- **THEN** no issue is emitted (reserved token is valid)

### Requirement: Color reference check

The validator SHALL verify that every color index referenced by the keyboard (col 1), tiles (col 12), or games (col 3) is within `0..colorList.length - 1`.

#### Scenario: Out-of-range keyboard color

- **WHEN** `aa_keyboard.txt` has a row with `theme_color === '99'` and `aa_colors.txt` has 13 entries
- **THEN** issue `code === 'INVALID_KEYBOARD_COLOR_INDEX'`, `severity === 'error'` is emitted

### Requirement: Langinfo required-items check

The validator SHALL verify that `aa_langinfo.txt` contains every required label: `Lang Name (In Local Lang)`, `Lang Name (In English)`, `Ethnologue code`, `Country`, `Game Name (In Local Lang)`, `Script direction (LTR or RTL)`, `The word NAME in local language`, `Script type`, `Email`, `Privacy Policy`. Additionally: `Script direction` value ∈ `{LTR, RTL}`; `Script type` value ∈ `{Roman, Arabic, Devanagari, Khmer, Lao, Thai}`; game name length ≤ 30 (warning otherwise — Play Store listing limit).

#### Scenario: Missing required label

- **WHEN** `aa_langinfo.txt` has no row for `Ethnologue code`
- **THEN** issue `code === 'MISSING_LANGINFO_LABEL'`, `severity === 'error'`, `context.label === 'Ethnologue code'` is emitted

#### Scenario: Invalid script direction

- **WHEN** `Script direction (LTR or RTL)` value is `'FORWARDS'`
- **THEN** issue `code === 'INVALID_SCRIPT_DIRECTION'`, `severity === 'error'` is emitted

#### Scenario: Game name too long

- **WHEN** `Game Name (In Local Lang)` is 31 characters
- **THEN** issue `code === 'GAME_NAME_TOO_LONG_FOR_PLAY_STORE'`, `severity === 'warning'` is emitted

### Requirement: Settings type check

Known boolean settings SHALL have `TRUE`/`FALSE` (or `True`/`False`, `true`/`false`) values. Known integer settings SHALL parse as integers. `Stage correspondence ratio` SHALL parse as a float in [0, 1]. Unknown keys SHALL be info-level `UNKNOWN_SETTING_KEY` (settings file is allowed to add new keys).

#### Scenario: Invalid boolean value

- **WHEN** `Has tile audio` has value `'sometimes'`
- **THEN** issue `code === 'INVALID_BOOLEAN_SETTING'`, `severity === 'error'` is emitted

#### Scenario: Ratio out of range

- **WHEN** `Stage correspondence ratio` has value `'1.5'`
- **THEN** issue `code === 'RATIO_OUT_OF_RANGE'`, `severity === 'error'` is emitted

### Requirement: Syllables check triggered by usage

The validator SHALL check `aa_syllables.txt` coherence only when 6 or more words' LOP column contains `.` (syllable separator), matching Java's `decideIfSyllablesAttempted`. When triggered, syllable references in words SHALL resolve to entries in `aa_syllables.txt`, and each syllable's audio SHALL exist. When skipped, an info `SYLLABLES_SKIPPED` issue SHALL be emitted for transparency.

#### Scenario: Pack does not use syllables

- **WHEN** fewer than 6 words contain `.` in their LOP column
- **THEN** issue `code === 'SYLLABLES_SKIPPED'`, `severity === 'info'` is emitted and no other syllable checks run

#### Scenario: Pack uses syllables, all references resolve

- **WHEN** 20 words contain `.` and every implied syllable has a row in `aa_syllables.txt` and a matching audio file
- **THEN** no syllable-related errors or warnings are emitted

#### Scenario: Pack uses syllables, missing reference

- **WHEN** a word decomposes into syllable `'bow'` and `aa_syllables.txt` has no such row
- **THEN** issue `code === 'UNKNOWN_SYLLABLE_REFERENCE'`, `severity === 'error'` is emitted

### Requirement: CLI exit code

`tools/validate-lang-pack.ts` SHALL exit 0 when no error-severity issues exist across all validated packs (warnings and info are non-blocking) and SHALL exit non-zero when any pack has any error-severity issue.

#### Scenario: All packs clean

- **WHEN** `bun tools/validate-lang-pack.ts --fixture eng,tpx,template` runs and all three packs yield zero errors
- **THEN** the CLI exits 0

#### Scenario: One pack has errors

- **WHEN** running with `--fixture eng,tpx,template` and `tpx` has 2 errors
- **THEN** the CLI exits non-zero

### Requirement: CLI multi-fixture mode

The CLI SHALL accept `--fixture <code>[,<code>…]` to run validation against multiple language-pack directories in a single invocation. When absent, the CLI SHALL default to the pack named by `APP_LANG`.

#### Scenario: Multi-fixture invocation

- **WHEN** `bun tools/validate-lang-pack.ts --fixture eng,tpx` runs
- **THEN** each pack is validated independently, two reports are printed, and the exit code reflects the aggregate error count

#### Scenario: Default to `APP_LANG`

- **WHEN** `APP_LANG=eng bun tools/validate-lang-pack.ts` runs (no `--fixture`)
- **THEN** only `languages/eng/` is validated

### Requirement: Fixture-driven golden tests

The library SHALL include a test suite that runs `validateLangPack` against each of `languages/eng/`, `languages/tpx/`, `languages/template/` and asserts the report's issue-code set matches a committed golden file. Golden files SHALL assert on `code` and `severity` only, not on message text.

#### Scenario: Golden matches

- **WHEN** `nx test util-lang-pack-validator` runs against a fixture whose report's code-set equals the golden
- **THEN** the test passes

#### Scenario: New issue code appears

- **WHEN** a check change introduces a new issue code that fires against `languages/eng/`
- **THEN** the golden-file test fails until the golden is updated

### Requirement: CI integration

The engine repository's CI SHALL run `bun tools/validate-lang-pack.ts --fixture eng,tpx,template` on every pull request. The CI job MUST fail the PR when the validator exits non-zero.

#### Scenario: PR introduces a regression

- **WHEN** a PR modifies the parser in a way that causes `aa_wordlist.txt` rows to reject as malformed
- **THEN** the CI job fails with the validator's error output visible in the logs

#### Scenario: Clean PR

- **WHEN** a PR makes no content changes and no check changes
- **THEN** the CI job passes

