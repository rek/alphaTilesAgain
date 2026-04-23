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

- [ ] 1.1 Generate `libs/shared/util-lang-pack-validator` via `nx g @nx/js:lib util-lang-pack-validator --directory=libs/shared/util-lang-pack-validator --tags='type:util,scope:shared' --importPath=@alphaTiles/util-lang-pack-validator`
- [ ] 1.2 Add `@alphaTiles/util-lang-pack-parser` as the only production dep (peer or regular — per NX convention for intra-workspace deps)
- [ ] 1.3 Generate `libs/shared/util-phoneme` via same pattern — this lib hosts `parseWordIntoTiles` + `parseWordIntoTilesPreliminary` + script-type handling
- [ ] 1.4 Add `libs/shared/util-phoneme` as a production dep of the validator

## 2. Core types

- [ ] 2.1 `src/Issue.ts` — `IssueSeverity` type + `Issue` interface with fields from `design.md §D2`
- [ ] 2.2 `src/ValidationReport.ts` — `ValidationReport` interface + `counts` / `ok` computation
- [ ] 2.3 `src/issueCodes.ts` — exported const enum-ish object with the full list of issue codes grouped by category (acts as documentation + compile-time guard that every check uses only declared codes)
- [ ] 2.4 Unit tests for `counts` computation (including edge cases: empty issue list → ok true; mixed severities)

## 3. `util-phoneme` — port `parseWordIntoTiles` from `Start.java`

- [ ] 3.1 `src/parseWordIntoTilesPreliminary.ts`:
  - [ ] 3.1.1 Port `TileList.parseWordIntoTilesPreliminary` from `Start.java` (~40 LOC)
  - [ ] 3.1.2 Accept `{ tileList, word, scriptType, placeholderCharacter }` inputs (no global state)
  - [ ] 3.1.3 Return `Array<Tile | null>`; caller checks nullness
- [ ] 3.2 `src/parseWordIntoTiles.ts`:
  - [ ] 3.2.1 Port full `TileList.parseWordIntoTiles` + supporting methods; handle Roman / Arabic / Devanagari / Khmer / Lao / Thai script types
  - [ ] 3.2.2 Respect `MULTITYPE_TILES` (tiles with non-`none` tileTypeB or tileTypeC)
  - [ ] 3.2.3 Handle `placeholderCharacter` for complex scripts
- [ ] 3.3 Unit tests:
  - [ ] 3.3.1 Roman: `parseWordIntoTiles('bat', engTiles)` → `[Tile('b'), Tile('a'), Tile('t')]`
  - [ ] 3.3.2 Multi-character tile: `parseWordIntoTiles('check', engTiles)` → correct tile sequence with `ch`, `e`, `ck`
  - [ ] 3.3.3 Thai: one word per complex-script branch
  - [ ] 3.3.4 Arabic: one RTL word
  - [ ] 3.3.5 Unparseable word → returns array containing `null` (matches Java)
- [ ] 3.4 Golden fixture: capture `parseWordIntoTiles` output for every word in `languages/eng/` and `languages/tpx/`; regression test asserts against it

## 4. Per-check implementations (`src/checks/<check>.ts`)

Each check file:
- Exports exactly one function
- Function signature: `(parsed: ParsedPack, extraInput?: T) => Issue[]`
- Co-located unit test at `src/checks/__tests__/<check>.test.ts`
- Header JSDoc referencing the source lines in `Validator.java`

- [ ] 4.1 `checkFilePresence.ts`:
  - [ ] 4.1.1 Required `aa_*.txt` (excludes `aa_notes.txt`)
  - [ ] 4.1.2 TTFs present: at least one `fonts/*.ttf`
  - [ ] 4.1.3 Avatars: exactly 12 under `images/avatars/`
  - [ ] 4.1.4 Avatar icons: exactly 12 under `images/avataricons/`
  - [ ] 4.1.5 Icon / splash / tile images: optional (emit info if absent only when relevant)
  - [ ] 4.1.6 Emits `MISSING_REQUIRED_FILE`, `MISSING_FONT`, `WRONG_AVATAR_COUNT`, etc.
- [ ] 4.2 `checkDuplicates.ts`:
  - [ ] 4.2.1 Duplicate tile base keys — error `DUPLICATE_TILE_KEY`
  - [ ] 4.2.2 Duplicate word LWC keys — error `DUPLICATE_WORD_KEY`
  - [ ] 4.2.3 Duplicate syllable keys — error `DUPLICATE_SYLLABLE_KEY`
  - [ ] 4.2.4 Duplicate color indices — error `DUPLICATE_COLOR_INDEX`
  - [ ] 4.2.5 Duplicate game doors — error `DUPLICATE_GAME_DOOR`
  - [ ] 4.2.6 Same value appearing in multiple of (base, alt1, alt2, alt3) on a tile row — warning `TILE_SELF_DUPLICATE_DISTRACTOR`
- [ ] 4.3 `checkColorReferences.ts`:
  - [ ] 4.3.1 Keyboard color indices within `0..colorList.length-1`
  - [ ] 4.3.2 Tile col 12 color index valid
  - [ ] 4.3.3 Game col 3 color index valid
  - [ ] 4.3.4 Codes: `INVALID_KEYBOARD_COLOR_INDEX`, `INVALID_TILE_COLOR_INDEX`, `INVALID_GAME_COLOR_INDEX`
- [ ] 4.4 `checkLangInfoRequired.ts`:
  - [ ] 4.4.1 Required labels: `Lang Name (In Local Lang)`, `Lang Name (In English)`, `Ethnologue code`, `Country`, `Game Name (In Local Lang)`, `Script direction (LTR or RTL)`, `The word NAME in local language`, `Script type`, `Email`, `Privacy Policy`
  - [ ] 4.4.2 `Script direction` ∈ {`LTR`, `RTL`}
  - [ ] 4.4.3 `Script type` ∈ {`Roman`, `Arabic`, `Devanagari`, `Khmer`, `Lao`, `Thai`}
  - [ ] 4.4.4 Game name length > 30 → warning `GAME_NAME_TOO_LONG_FOR_PLAY_STORE`
  - [ ] 4.4.5 Ethnologue code matches `[a-z]{3}` (warning on mismatch)
- [ ] 4.5 `checkSettingsTypes.ts`:
  - [ ] 4.5.1 Known boolean keys parse as boolean: `Has tile audio`, `Has syllable audio`, `First letter stage correspondence`, `Differentiates types of multitype symbols`, `Show filter options for Game 001`, `In Game 001 (Romania) bold non-initial tiles when in focus? (boldNonInitialFocusTiles)`, `In Game 001 (Romania) bold initial tiles when in focus? (boldInitialFocusTiles)`
  - [ ] 4.5.2 Known int keys parse as int: `After 12 checked trackers`, `Number of avatars`, `Stage 1-2 max word length`, `Days until expiration`, `Chile keyboard width`, `Chile base guess count`, `Chile minimum word length`, `Chile maximum word length`
  - [ ] 4.5.3 `Stage correspondence ratio` parses as float in [0, 1]
  - [ ] 4.5.4 Unknown settings keys — info `UNKNOWN_SETTING_KEY` (not error; settings file may evolve)
- [ ] 4.6 `checkKeyboardCoherence.ts`:
  - [ ] 4.6.1 Keyboard colors valid (delegates to `checkColorReferences` — but also flag here as per Java)
  - [ ] 4.6.2 Every character in a word's LOP column is a keyboard key or substring of one
  - [ ] 4.6.3 Compute key-usage map; flag keys used in < `NUM_TIMES_KEYS_WANTED_IN_WORDS` (3) words — recommendation `KEY_UNDERUSED`
  - [ ] 4.6.4 Unicode hex in error messages when character isn't printable (matches Java `U+XXXX` format)
- [ ] 4.7 `checkWordlistCharacters.ts`:
  - [ ] 4.7.1 LWC column matches `[a-z0-9_]+` — error `INVALID_WORDLIST_LWC_CHARS`
  - [ ] 4.7.2 Words with spaces: if > 5% of wordlist, warning `MANY_WORDS_HAVE_SPACES`; else recommendation `FEW_WORDS_HAVE_SPACES` (Java behavior — weird but preserved)
  - [ ] 4.7.3 Empty LOP column — error `EMPTY_LOP_VALUE`
- [ ] 4.8 `checkTileStructure.ts`:
  - [ ] 4.8.1 Type ∈ `{C, PC, V, X, D, AD, AV, BV, FV, LV, T, SAD}` — error `INVALID_TILE_TYPE`
  - [ ] 4.8.2 Alternates (cols 1–3) are in tile list — error `INVALID_DISTRACTOR`
  - [ ] 4.8.3 Upper-case col 6: each entry is either proper-case-only (first-char upper rest lower) or full-upper; flag mixed — warning `INCONSISTENT_UPPERCASE`
  - [ ] 4.8.4 `tileTypeB` / `tileTypeC` when not `none` must be valid tile types
  - [ ] 4.8.5 `audioName` non-empty (or validated as `zz_no_audio_needed` sentinel)
- [ ] 4.9 `checkGameStructure.ts`:
  - [ ] 4.9.1 `Country` ∈ `{Brazil, Chile, China, Colombia, Ecuador, Georgia, Iraq, Italy, Japan, Malaysia, Mexico, Myanmar, Peru, Romania, Sudan, Thailand, UnitedStates}` — error `UNKNOWN_GAME_COUNTRY`
  - [ ] 4.9.2 `ChallengeLevel` integer — error `INVALID_CHALLENGE_LEVEL`
  - [ ] 4.9.3 `SyllOrTile` ∈ `{T, S}` — already enforced by parser; validator adds `code` for traceability
  - [ ] 4.9.4 `Door` unique and sequential starting from 1 — warning `NON_SEQUENTIAL_GAME_DOORS`
  - [ ] 4.9.5 `InstructionAudio` value is a file under `audio/instructions/` OR matches reserved token `naWhileMPOnly` — error `MISSING_INSTRUCTION_AUDIO`
  - [ ] 4.9.6 `AudioDuration` integer — error `INVALID_AUDIO_DURATION`
- [ ] 4.10 `checkAudioReferences.ts`:
  - [ ] 4.10.1 Every tile `audioName` has a file under `audio/tiles/` (or is `zz_no_audio_needed`) — error `MISSING_TILE_AUDIO`
  - [ ] 4.10.2 Every word LWC has a file under `audio/words/<wordLWC>.mp3` — error `MISSING_WORD_AUDIO`
  - [ ] 4.10.3 Every syllable `audioName` has a file under `audio/syllables/` — error `MISSING_SYLLABLE_AUDIO`
  - [ ] 4.10.4 Every game `InstructionAudio` has a file under `audio/instructions/` — error `MISSING_GAME_INSTRUCTION_AUDIO`
  - [ ] 4.10.5 Orphan mp3s under any audio subdir — warning `ORPHAN_AUDIO_FILE`
  - [ ] 4.10.6 Empty-size mp3s — error `ZERO_BYTE_AUDIO_FILE` (requires CLI to pass size info through inventory — add `sizes` field to FileInventory)
  - [ ] 4.10.7 Oversize mp3s (>1MB) — warning `OVERSIZE_AUDIO_FILE`
  - [ ] 4.10.8 Typo hints: for missing audio `X`, scan orphan audio for nearest match by Levenshtein (<40% error) — recommendation `AUDIO_TYPO_SUGGESTION`
- [ ] 4.11 `checkImageReferences.ts`:
  - [ ] 4.11.1 Every wordlist LWC has `images/words/<wordLWC>.png` — error `MISSING_WORD_IMAGE`
  - [ ] 4.11.2 Optional `<wordLWC>2.png` variant — no error if missing
  - [ ] 4.11.3 Orphan pngs — warning `ORPHAN_IMAGE_FILE`
  - [ ] 4.11.4 Typo hints via Levenshtein (same pattern as audio)
- [ ] 4.12 `checkTileWordCrossRef.ts`:
  - [ ] 4.12.1 For every word, call `parseWordIntoTiles` from `util-phoneme`
  - [ ] 4.12.2 If result contains `null`: error `WORD_CANNOT_PARSE_INTO_TILES` with context containing the preliminary-parse attempt
  - [ ] 4.12.3 If tile count > 15: error `WORD_TOO_LONG_FOR_GAMES`
  - [ ] 4.12.4 If tile count 10–15: recommendation `WORD_LONGER_THAN_IDEAL`
  - [ ] 4.12.5 Count 3-tile-words and 4-tile-words: warn if fewer than some minimum (Java: China game requires ≥ N such words) — `INSUFFICIENT_SHORT_WORDS_FOR_CHINA`
  - [ ] 4.12.6 Tile usage counts: flag tiles used < `NUM_TIMES_TILES_WANTED_IN_WORDS` (3) — recommendation `TILE_UNDERUSED`
- [ ] 4.13 `checkStageCoherence.ts`:
  - [ ] 4.13.1 Port `StagesChecks.check()` from Java (~90 LOC)
  - [ ] 4.13.2 Compute cumulative tile set per stage 1..7 using each tile's `stageOfFirstAppearance`
  - [ ] 4.13.3 For each word: compute correspondence ratio against cumulative set for each stage; respect `firstLetterStageCorrespondence` + `stage1and2MaxWordLength` settings
  - [ ] 4.13.4 Emit info `STAGE_WORD_COUNT` per stage (stage number → word count → tile count); gives linguists visibility
  - [ ] 4.13.5 If any stage has 0 words: warning `EMPTY_STAGE`
  - [ ] 4.13.6 If any tile's `stageOfFirstAppearance` > 7: error (parser already clamps, validator audits the raw input pre-clamp)
- [ ] 4.14 `checkSyllablesCoherence.ts`:
  - [ ] 4.14.1 Implement `shouldCheckSyllables(parsed)` — returns true iff ≥ 6 words' LOP column contains `.`, matching Java `decideIfSyllablesAttempted`
  - [ ] 4.14.2 If active: syllables referenced in words (by splitting on `.`) all exist in `aa_syllables.txt`
  - [ ] 4.14.3 If active: every syllable has an audio file
  - [ ] 4.14.4 If inactive: emit info `SYLLABLES_SKIPPED` (transparency)

## 5. Top-level composer

- [ ] 5.1 `src/validateLangPack.ts`:
  - [ ] 5.1.1 Signature `({ rawFiles: Record<string,string>, fileInventory: FileInventory }) => ValidationReport`
  - [ ] 5.1.2 Call `parsePack` inside try/catch; on `LangPackParseError`, return a single-issue report (parse failure terminates validation)
  - [ ] 5.1.3 Run every check in fixed order (see `design.md §D1`); concatenate `Issue[]`
  - [ ] 5.1.4 Compute counts; set `ok = counts.error === 0`
  - [ ] 5.1.5 Sort issues by `(severity, category, file, line)` for stable output
- [ ] 5.2 `src/formatReportHuman.ts` — human-readable string formatter; groups by severity, shows codes + messages, totals at bottom
- [ ] 5.3 `src/formatReportJson.ts` — JSON serializer; includes the pack code

## 6. CLI wrapper

- [ ] 6.1 Overwrite `tools/validate-lang-pack.ts`:
  - [ ] 6.1.1 Parse `--fixture <codes>`, `--json <path>`, `--only-errors` flags
  - [ ] 6.1.2 Read `APP_LANG` if `--fixture` absent
  - [ ] 6.1.3 For each code: read `languages/<code>/aa_*.txt` → rawFiles map; walk tree → fileInventory
  - [ ] 6.1.4 Call `validateLangPack`, print report (human or JSON)
  - [ ] 6.1.5 Exit non-zero if any error in any report
- [ ] 6.2 Helper `tools/_readRawFiles.ts` — reads `aa_*.txt` under `languages/<code>/`, returns `Record<string,string>` keyed by basename-sans-ext
- [ ] 6.3 Helper `tools/_buildFileInventory.ts` — walks `languages/<code>/` and produces `FileInventory` (including sizes for audio checks)
- [ ] 6.4 Unit tests for CLI arg parsing + exit code logic

## 7. Golden fixture tests

- [ ] 7.1 Run validator manually against `languages/eng/`, record the report; commit to `src/__tests__/golden/eng.codes.json` (issue-code set only, not messages)
- [ ] 7.2 Same for `languages/tpx/` → `tpx.codes.json`
- [ ] 7.3 Same for `languages/template/` → `template.codes.json`
- [ ] 7.4 `src/__tests__/fixtures.test.ts` iterates fixtures and asserts the code-set equality
- [ ] 7.5 If any fixture has legitimate errors, fix them upstream in `PublicLanguageAssets` and re-rsync before committing golden files

## 8. Documentation

- [ ] 8.1 Library root `README.md` covering: programmatic API, CLI usage, full check-category list with codes, how to add a new check
- [ ] 8.2 Update `docs/ARCHITECTURE.md` §4 to note the validator is now the full port (replace the "placeholder" language from `port-foundations`)
- [ ] 8.3 Note ADR-008 fulfilled in the library README

## 9. Pipeline integration

- [ ] 9.1 `apps/alphaTiles/project.json` `validate-lang-pack` target unchanged (command still `bun tools/validate-lang-pack.ts`) but description updated
- [ ] 9.2 CI script that calls `bun tools/validate-lang-pack.ts --fixture eng,tpx,template` on every PR; fail on any error
- [ ] 9.3 CI script runs validator against the build's `APP_LANG` pack as part of the regular prebuild gate (no behavior change — already gated)

## 10. Verification

- [ ] 10.1 `openspec validate lang-pack-validator` passes
- [ ] 10.2 `nx test util-phoneme` passes
- [ ] 10.3 `nx test util-lang-pack-validator` passes (all per-check tests + golden fixtures)
- [ ] 10.4 `bun tools/validate-lang-pack.ts --fixture eng` produces a zero-error report
- [ ] 10.5 `bun tools/validate-lang-pack.ts --fixture template` produces the expected "template pack is incomplete" report that matches the committed golden
- [ ] 10.6 `APP_LANG=eng nx start alphaTiles` still boots with the new validator in the pipeline
- [ ] 10.7 `nx lint` passes for both new libs; dependency rules respected (no `react` import in validator, no `scope:alphaTiles` import)
