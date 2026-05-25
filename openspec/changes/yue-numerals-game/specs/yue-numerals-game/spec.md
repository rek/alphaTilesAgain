## ADDED Requirements

### Requirement: `yue` pack ships the 12 base Chinese numeral characters as tiles, words, and syllables

The `yue` language pack SHALL include the 12 numeral characters `一二三 五六七八九 十百千萬` as fully-formed tile, word, and syllable entries with matching audio, image, and stroke assets, such that the existing Taiwan and Georgia games include them in their content pools.

#### Scenario: Tile rows are appended for each numeral

- **GIVEN** the 12 numeral characters `一二三五六七八九十百千萬`
- **WHEN** `languages/yue/aa_gametiles.txt` is parsed by `parseGametiles`
- **THEN** the row count increases by 12 over the pre-change baseline
- **AND** each numeral character appears exactly once as a tile `base`
- **AND** each new row has `Type=X` and `AudioName=zz_<digit>` where `<digit>` is the Arabic equivalent (`1, 2, 3, 5, 6, 7, 8, 9, 10, 100, 1000, 10000`)

#### Scenario: Wordlist rows are appended for each numeral

- **GIVEN** the 12 numeral characters
- **WHEN** `languages/yue/aa_wordlist.txt` is parsed by `parseWordlist`
- **THEN** the row count increases by 12 over the pre-change baseline
- **AND** each numeral character appears exactly once as a `wordInLOP` value
- **AND** the matching `wordInLWC` follows the `zz_<digit>` convention

#### Scenario: Syllable rows are appended for each numeral

- **GIVEN** the 12 numeral characters
- **WHEN** `languages/yue/aa_syllables.txt` is parsed by `parseSyllables`
- **THEN** the row count increases by 12 over the pre-change baseline
- **AND** each numeral character appears once as both `Syllable` and `SyllableAudioName`
- **AND** each new row's `Duration` is a positive integer (milliseconds)

### Requirement: Numeral audio files are present and validator-clean

Every new numeral tile/word/syllable entry SHALL have a corresponding non-empty audio file such that the lang-pack validator passes.

#### Scenario: Per-syllable audio files are present

- **GIVEN** `aa_settings.txt` has `Has syllable audio: TRUE` and `aa_syllables.txt` lists the 12 numeral characters
- **WHEN** the lang-pack validator runs `checkAudioReferences` against the `yue` pack
- **THEN** each numeral character's `audio/syllables/<char>.mp3` exists and is non-empty
- **AND** no `MISSING_SYLLABLE_AUDIO`, `ZERO_BYTE_AUDIO_FILE`, or `ORPHAN_AUDIO_FILE` issue is raised for the numerals

#### Scenario: Per-word audio files are present

- **GIVEN** the 12 numeral wordlist rows
- **WHEN** the lang-pack validator runs `checkAudioReferences` against the `yue` pack
- **THEN** each numeral's `audio/words/zz_<digit>.mp3` exists and is non-empty
- **AND** no `MISSING_WORD_AUDIO` or `ZERO_BYTE_AUDIO_FILE` issue is raised for the numeral words

#### Scenario: Per-tile audio files are present

- **GIVEN** the 12 numeral tile rows reference AudioName `zz_<digit>`
- **AND** `aa_settings.txt` has `Has tile audio: TRUE`
- **WHEN** the lang-pack validator runs `checkAudioReferences` against the `yue` pack
- **THEN** each numeral's `audio/tiles/zz_<digit>.mp3` exists and is non-empty
- **AND** no `MISSING_TILE_AUDIO` issue is raised for the numeral tiles

#### Scenario: Audio source content matches the customer-supplied recordings

- **GIVEN** the customer-supplied folder `/home/adam/Downloads/Numerals-…/Numerals/` containing 12 mp3 clips named `<NNN> <char>.mp3`
- **WHEN** the pack files are produced
- **THEN** `audio/syllables/<char>.mp3`, `audio/words/zz_<digit>.mp3`, and `audio/tiles/zz_<digit>.mp3` are byte-identical copies of the corresponding source clip
- **AND** no re-encoding or transcoding step is applied

### Requirement: Numeral word images are present and validator-clean

Each numeral wordlist row SHALL have a `images/words/<lwc>.png` file rendering its Arabic-digit equivalent, satisfying the validator's `checkImageReferences` requirement.

#### Scenario: All 12 numeral word images exist

- **WHEN** the lang-pack validator runs `checkImageReferences` against the `yue` pack
- **THEN** each numeral wordlist row's `images/words/zz_<digit>.png` exists and is non-empty
- **AND** no `MISSING_WORD_IMAGE` or `ORPHAN_IMAGE` issue is raised for the numerals

#### Scenario: Image generation is reproducible via a committed tool

- **WHEN** `npx tsx tools/build-numeral-images.ts` is run
- **THEN** the 12 PNGs under `languages/yue/images/words/zz_<digit>.png` are rewritten
- **AND** the resulting PNGs render the Arabic digits `1, 2, 3, 5, 6, 7, 8, 9, 10, 100, 1000, 10000` on a plain background
- **AND** the tool runs offline, with no network or external-data dependency

### Requirement: Numeral stroke-data JSON files are generated for the writing game

Each numeral character SHALL have a `languages/yue/strokes/<char>.json` file produced by the existing `tools/build-stroke-data.ts` pipeline, so the Taiwan game can render it.

#### Scenario: Existing stroke pipeline produces stroke JSON for all numerals

- **GIVEN** the 12 numeral characters are present in `aa_gametiles.txt`
- **WHEN** `APP_LANG=yue npx tsx tools/build-stroke-data.ts` is run
- **THEN** `languages/yue/strokes/` contains a JSON file named `<char>.json` for each of the 12 numerals
- **AND** each file parses as JSON with a `character` matching its filename, a non-empty `strokes` string array, and a `medians` array of the same length
- **AND** the tool's stdout reports `missing=0` for the numeral characters

### Requirement: `yue` pack exposes two new Georgia syllable doors

The `yue` pack SHALL define two new game doors that launch the Georgia class in syllable mode at challenge levels 2 and 3 for 12-choice and 18-choice listen-and-tap rounds.

#### Scenario: Door rows are appended to `aa_games.txt`

- **WHEN** `languages/yue/aa_games.txt` is parsed by `parseGames`
- **THEN** two new rows exist with `Country=Georgia`, `SyllOrTile=S`
- **AND** one row has `ChallengeLevel=2` and the other has `ChallengeLevel=3`

#### Scenario: 12-choice door launches Georgia S-mode at CL2

- **GIVEN** the new door with `Country=Georgia`, `ChallengeLevel=2`, `SyllOrTile=S`
- **WHEN** the game menu is built by `useDoors`
- **THEN** the door appears with `classKey='georgia'` and `challengeLevel=2`
- **AND** selecting it routes to `apps/alphaTiles/app/games/georgia.tsx` with the row's 1-based `doorIndex`
- **AND** `GeorgiaContainer` resolves `syllableGame='S'` by reading `assets.games.rows[doorIndex - 1].syllOrTile`
- **AND** a round renders 12 choice tiles

#### Scenario: 18-choice door launches Georgia S-mode at CL3

- **GIVEN** the new door with `Country=Georgia`, `ChallengeLevel=3`, `SyllOrTile=S`
- **WHEN** the game menu is built by `useDoors`
- **THEN** the door appears with `classKey='georgia'` and `challengeLevel=3`
- **AND** a round renders 18 choice tiles

### Requirement: Existing Taiwan and Georgia doors include numerals in their content pools

After the pack-data additions, the existing Taiwan doors (6, 7, 8) and the existing Georgia syllable door (9) SHALL include the numeral characters in their rotations with no engine code change.

#### Scenario: Taiwan rotation starts with the lowest-stroke numeral

- **GIVEN** the 12 numeral tiles are present in `aa_gametiles.txt`
- **AND** stroke JSON exists for each
- **WHEN** `buildTaiwanData` runs at boot
- **THEN** `availableTiles[0]` is `一` (1 stroke, lowest in the pool)
- **AND** the next characters in order are drawn from the 2-stroke numerals (`二`, `七`, `八`, `九`, `十`) before any pre-existing yue character with stroke count > 2

#### Scenario: Georgia S-mode syllable pool includes the new numeral syllables

- **GIVEN** the 12 numeral syllables are present in `aa_syllables.txt`
- **WHEN** `GeorgiaContainer` builds its syllable pool at round start
- **THEN** the pool contains 163 entries (151 pre-existing + 12 numerals)
- **AND** numeral syllables are eligible as either the correct answer or as distractors in the random-pool fill

### Requirement: Landing-page Cantonese guide reflects the new doors

The `apps/home` landing-page Cantonese guide SHALL be regenerated and re-curated to describe each new door, with no rows showing "missing description".

#### Scenario: `cantoneseDoors.generated.ts` is regenerated from `aa_games.txt`

- **WHEN** `bun tools/generate-cantonese-doors.ts` is run
- **THEN** `apps/home/src/app/cantoneseDoors.generated.ts` lists exactly 11 `YUE_GAME_ROWS` entries
- **AND** the last two entries have `classKey: 'georgia'`, `syllOrTile: 'S'`, and `challengeLevel: 2` / `3` respectively

#### Scenario: Hand-authored descriptions exist for both new doors

- **GIVEN** the regenerated `cantoneseDoors.generated.ts`
- **WHEN** `cantoneseGuide.tsx` renders the door list
- **THEN** the `DOOR_CONTENT` map contains entries keyed `'georgia-2-S'` and `'georgia-3-S'`
- **AND** neither door renders the "missing description" fallback

### Requirement: No engine code is modified

This change SHALL be a pack-data + asset-tooling-only change; no `feature-game-*`, `data-*`, `util-*`, or app-shell code is modified.

#### Scenario: No diff to engine libraries

- **WHEN** the change's diff is inspected
- **THEN** no file under `libs/alphaTiles/feature-game-*/`, `libs/alphaTiles/data-*/`, `libs/shared/util-*/`, or `apps/alphaTiles/app/` is modified
- **AND** the only TypeScript file added is `tools/build-numeral-images.ts`

#### Scenario: Validator and manifest generator are unchanged

- **WHEN** the change's diff is inspected
- **THEN** no file under `libs/shared/util-lang-pack-validator/` or `tools/generate-lang-manifest.ts` is modified
