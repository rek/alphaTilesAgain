# stages Specification

## Purpose
TBD - created by archiving change game-engine-base. Update Purpose after archive.
## Requirements
### Requirement: Staged tile and word list derivation

`libs/alphaTiles/util-stages` SHALL expose `tileStagesLists(tileList, stageOfFirstAppearance)` and `wordStagesLists(wordList, tileStages, parseWordIntoTiles, correspondenceRatio)`. These functions SHALL port `Start.java buildTileStagesLists` (line 378) and `buildWordStagesLists` (line 475). Each returns a `T[][]` of length 7 — `result[s-1]` is the items newly added at stage `s`.

The functions MUST be pure — no pack-file I/O, no logging, no state. `parseWordIntoTiles` is injected so `util-stages` stays free of phoneme-parser dependencies.

#### Scenario: Tile binned by stage-of-first-appearance

- **WHEN** `tileStagesLists(tiles, (tile) => tile.stageOfFirstAppearance)` is called
- **AND** one tile has `stageOfFirstAppearance = 3`
- **THEN** that tile appears in `result[2]` and nowhere else

#### Scenario: Word assigned to earliest stage that covers it

- **WHEN** `wordStagesLists(words, tileStages, parse, 0.75)` is called
- **AND** a word's tiles are all present in `tileStages[0]` cumulatively
- **THEN** the word appears in `result[0]`

### Requirement: Correspondence ratio threshold

`computeStageCorrespondence(word, stageTiles, parseWordIntoTiles)` SHALL return the fraction (0..1) of `word`'s tiles that appear in `stageTiles`. Downstream (`wordStagesLists`, `selectWordForStage`) SHALL use this ratio against the pack's `stageCorrespondenceRatio` setting (default `0.5` per `Start.java:147`) to weight word selection toward pack-appropriate difficulty.

#### Scenario: Full correspondence

- **WHEN** a word's tiles are `[a, b, c]` and `stageTiles` contains `a`, `b`, `c`
- **THEN** `computeStageCorrespondence(word, stageTiles, parse)` returns `1.0`

#### Scenario: Partial correspondence

- **WHEN** a word's tiles are `[a, b, c, d]` and `stageTiles` contains `a`, `b` only
- **THEN** `computeStageCorrespondence(word, stageTiles, parse)` returns `0.5`

#### Scenario: Default ratio when pack omits it

- **WHEN** `aa_settings.txt` has no `Stage correspondence ratio` key
- **THEN** callers use `0.5` (the ratio is supplied to `wordStagesLists` by `lang-assets-runtime`, not read here)

### Requirement: Word selection with stage ratchet

`selectWordForStage({ stage, wordStagesLists, previousStagesWordList, cumulativeStageBasedWordList, previouslyShown, correspondenceRatio, rng? })` SHALL port `GameActivity.java:417 chooseWord` — stage-ratchet when the assigned stage is empty, weighted correspondence at stage 1, weighted novelty at stages > 1, and `previouslyShown` avoidance within a window of `min(stage1Count - 1, 12)`.

The function SHALL accept an injected `rng: () => number` so tests can deterministically exercise each branch.

#### Scenario: Stage ratchet when assigned stage is empty

- **WHEN** `selectWordForStage({ stage: 5, wordStagesLists: [/*1*/[a,b], /*2*/[c], /*3*/[], /*4*/[], /*5*/[], ... ], ... })` is called
- **THEN** the function ratchets down through empty stages and selects a word from stage 2 (the highest non-empty stage ≤ 5)

#### Scenario: Stage-1 weighting toward high correspondence

- **WHEN** stage = 1, high-correspondence words = `[x]`, low-correspondence words = `[y, z, w]`, and the seeded `rng()` returns `0.3` (< 0.5)
- **THEN** the function selects `x`

#### Scenario: Stage-1 weighting toward low correspondence

- **WHEN** stage = 1, same pools, seeded `rng()` returns `0.7`
- **THEN** the function selects one of `y, z, w`

#### Scenario: `previouslyShown` avoidance

- **WHEN** the function's first candidate is in `previouslyShown`
- **THEN** it re-rolls (bounded by the seed) until a word not in `previouslyShown` is found; that word is then appended to `previouslyShown` and the oldest entry is dropped if the window is full

#### Scenario: Stage-1 smaller than 12

- **WHEN** stage-1 has 5 words
- **THEN** the `previouslyShown` window is `min(5 - 1, 12) = 4`

### Requirement: Stage lists cached at lang-load

Staged tile and word lists SHALL be computed once at language-pack load (in `lang-assets-runtime`) using `tileStagesLists` and `wordStagesLists`, then cached on `LangAssets`. Runtime code (shell, mechanics) MUST NOT recompute them per frame or per mount.

#### Scenario: One computation per boot

- **WHEN** the app boots with `APP_LANG=eng`
- **THEN** `tileStagesLists` and `wordStagesLists` are invoked once during `lang-assets-runtime` load, and the result is stored on the `LangAssetsProvider` value

#### Scenario: Engine reads cached slice

- **WHEN** `<GameShellContainer>` mounts at `stage=3`
- **THEN** it selects the stage slice via `useLangAssets().wordStagesLists[2]`, without re-invoking `wordStagesLists`

