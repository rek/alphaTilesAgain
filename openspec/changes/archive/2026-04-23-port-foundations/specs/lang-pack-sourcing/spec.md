## ADDED Requirements

### Requirement: Language packs rsync'd from an external source

Language packs SHALL be copied into `languages/<code>/` from `$PUBLIC_LANG_ASSETS/<sourcePack>/res/` at prebuild. The `languages/` directory MUST be gitignored — packs are never committed to this repository.

#### Scenario: Pack materialized from local `PublicLanguageAssets`

- **WHEN** `PUBLIC_LANG_ASSETS=/home/user/dev/PublicLanguageAssets` and `APP_LANG=eng`
- **THEN** the rsync stage copies `/home/user/dev/PublicLanguageAssets/engEnglish4/res/` into `languages/eng/`, normalizing directory structure

#### Scenario: `PUBLIC_LANG_ASSETS` env not set

- **WHEN** the rsync stage runs with `PUBLIC_LANG_ASSETS` unset
- **THEN** the stage exits non-zero with a message naming the variable and referencing the setup doc

#### Scenario: Source pack not found

- **WHEN** `PUBLIC_LANG_ASSETS=/…` is set but `$PUBLIC_LANG_ASSETS/<mappedPack>/res/` does not exist
- **THEN** the stage exits non-zero listing the expected path and the available packs found under `$PUBLIC_LANG_ASSETS/`

### Requirement: Directory normalization at rsync time

Incoming Android pack layout (`res/raw/`, `res/font/`, `res/drawable*/`) SHALL be normalized to the flat shape documented in `docs/ARCHITECTURE.md §5` during rsync. Consumers of the `languages/` tree MUST NOT need to know about Android density buckets.

#### Scenario: Density variants collapsed

- **WHEN** a pack ships `res/drawable-hdpi/zz_avatar01.png` and `res/drawable-xxxhdpi/zz_avatar01.png`
- **THEN** only the `xxxhdpi` variant is copied, placed at `languages/<code>/images/avatars/zz_avatar01.png`

#### Scenario: Audio files classified by source column

- **WHEN** `aa_gametiles.txt` references audio `bat` in the `AudioName` column and `aa_wordlist.txt` also lists a word `bat`
- **THEN** the corresponding `bat.mp3` file is classified according to which index file references it (tile, word, or both — validated separately), and copied to `audio/tiles/`, `audio/words/`, or both as appropriate

#### Scenario: Line endings normalized

- **WHEN** a source `aa_*.txt` file uses CRLF line endings
- **THEN** the file is rewritten with LF line endings in `languages/<code>/`

### Requirement: Pack-to-source mapping

The rsync script SHALL resolve `APP_LANG` to a source-pack name via a mapping table (`APP_LANG=eng` → `engEnglish4`, `APP_LANG=tpx` → `tpxTeocuitlapa`, `APP_LANG=template` → `templateTemplate`, `APP_LANG=yue` → `yueCantonese` placeholder). Unknown codes SHALL fail the rsync stage with a listing of supported codes.

#### Scenario: Known code

- **WHEN** `APP_LANG=eng`
- **THEN** rsync looks for `$PUBLIC_LANG_ASSETS/engEnglish4/res/`

#### Scenario: Unknown code

- **WHEN** `APP_LANG=xyz` and `xyz` is not in the mapping table
- **THEN** the stage fails with the full list of supported codes

#### Scenario: Adding a new pack

- **WHEN** a new language pack is added to `PublicLanguageAssets`
- **THEN** a developer adds its code-to-directory mapping to `tools/rsync-lang-packs.ts` and an EAS profile to `eas.json` in the same commit
