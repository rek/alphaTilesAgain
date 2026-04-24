# phoneme Specification

## Purpose
TBD - created by archiving change game-engine-base. Update Purpose after archive.
## Requirements
### Requirement: Word-to-tile decomposition respects `Script type`

`libs/alphaTiles/util-phoneme` SHALL expose `parseWordIntoTiles(word, tileList, referenceWord, scriptType)` that decomposes a word's LOP text into the ordered list of tiles it is built from, respecting the pack's `Script type` from `aa_langinfo.txt`.

The four Android-supported script types are `Thai`, `Lao`, `Khmer`, `Arabic` (per `Start.java:74` and `Start.java:993/1001`). Any other value (or the empty string) SHALL dispatch to the default unidirectional parser.

#### Scenario: Default script

- **WHEN** `parseWordIntoTiles("cat", tileList, wordRef, "default")` is called
- **AND** `tileList` contains tiles `c`, `a`, `t`
- **THEN** the result is `[c, a, t]` in order

#### Scenario: Longest-match greedy default

- **WHEN** tileList contains both `ch` and `c`, `h` separately
- **AND** `parseWordIntoTiles("chat", tileList, wordRef, "default")` is called
- **THEN** the result is `[ch, a, t]` — longest match wins

#### Scenario: Missing tile surfaces an error

- **WHEN** the word contains a character sequence no tile matches
- **THEN** the function throws with the word text and the un-matched position (ports the Android parser's failure-mode — Java logs; TS throws, for test ergonomics)

### Requirement: Script-parser registry

A public `registerScriptParser(scriptType, parser)` SHALL let downstream libs register parsers for non-default scripts at module-top-level. The default parser is registered under the key `'default'` at `util-phoneme` module load. Duplicate registration for the same key SHALL throw, naming the key and the duplicate.

#### Scenario: Register and dispatch

- **WHEN** a future library calls `registerScriptParser('Thai', thaiParser)` at its `src/index.ts` import time
- **AND** `parseWordIntoTiles(word, tileList, ref, 'Thai')` is called at runtime
- **THEN** `thaiParser.parse` is invoked, not the default

#### Scenario: Duplicate registration

- **WHEN** two modules both call `registerScriptParser('Thai', ...)` at module load
- **THEN** the second call throws an error naming the key `'Thai'`

#### Scenario: Unknown script falls back to default

- **WHEN** `parseWordIntoTiles(word, tileList, ref, 'Devanagari')` is called and no parser is registered under `'Devanagari'`
- **THEN** the function logs a warning identifying the unregistered scriptType and dispatches to the default parser

### Requirement: Combination and standardization helpers

The library SHALL also expose `combineTilesToMakeWord(tiles, word, indexOfReplacedTile, scriptType)` and `standardizeWordSequence(word, scriptType)`, porting `GameActivity.java:952` and `:1211`. These helpers support round-trip verification (parse → combine should equal standardized word) and the `generateProhibitedCharSequences` helper used by distractor-selection code.

#### Scenario: Round-trip

- **WHEN** `parseWordIntoTiles(word, tileList, ref, scriptType)` returns `tiles`
- **AND** `combineTilesToMakeWord(tiles, ref, -1, scriptType)` is called
- **THEN** the return value equals `standardizeWordSequence(ref, scriptType)`

#### Scenario: Replacement index

- **WHEN** `combineTilesToMakeWord(tiles, ref, 2, scriptType)` is called
- **THEN** the returned string reflects the tile at index 2 being treated as a placeholder (matches Java caller sites in Chile / Thailand / etc. — used for distractor generation)

### Requirement: `util-phoneme` is a pure util lib

`util-phoneme` SHALL be `type:util` scope `alphaTiles`. It MUST NOT depend on React, Zustand, `react-i18next`, `expo-*`, or any other feature / data-access / ui library. It MAY accept its dependencies (tile list, reference word) as arguments.

#### Scenario: Dependency audit

- **WHEN** `nx graph` inspects `util-phoneme`
- **THEN** no `type:feature`, `type:data-access`, or `type:ui` dependency is present

### Requirement: V1 ships only the default parser

This change SHALL register the `'default'` parser only. Thai / Lao / Khmer / Arabic / Devanagari / Chinese parsers are explicitly future work and are each their own OpenSpec change when the first language pack demanding them is proposed. The v1 fixtures (`eng`, `tpx`, `yue`-stub) all have empty or unset `Script type` and work with the default parser.

#### Scenario: v1 eng pack

- **WHEN** the app boots with `APP_LANG=eng`
- **THEN** every word in `aa_wordlist.txt` round-trips through the default parser successfully

#### Scenario: v1 tpx pack

- **WHEN** the app boots with `APP_LANG=tpx`
- **THEN** every word in `aa_wordlist.txt` round-trips through the default parser successfully

#### Scenario: Future Thai pack

- **WHEN** a Thai language pack is added in a future change
- **THEN** that change registers `registerScriptParser('Thai', …)` at its feature-lib module-load, and no change to `util-phoneme` is required

