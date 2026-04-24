## Why

`docs/ARCHITECTURE.md §17` declares the v1 port implements exactly one concrete game class: **China**. All other Android game classes (`Chile`, `Thailand`, etc.) remain unported until a language pack demands them.

China is chosen because it's small (~390 LOC), exercises the shared `feature-game-shell` end-to-end (score + tracker + celebration + audio-replay + stage selection), and is the **exemplar for syllable-based mechanics that Cantonese packs will use**. The mechanic itself is script-agnostic — its content comes from the pack's `aa_syllables.txt` + `aa_wordlist.txt` + `aa_gametiles.txt`. A Cantonese (Jyutping or Hanzi) pack will plug in with zero code change, just a new EAS profile and rsync mapping.

Per `docs/ARCHITECTURE.md §17`, China is a game instance configured by row 88 of `aa_games.txt` in the English fixture: `88  China  1  9  zzz_china  1999  T  -`. `SyllOrTile = T` means this instance plays against tiles (not syllables) from the pack's `aa_gametiles.txt`; a Cantonese pack could configure the same class with `SyllOrTile = S` to play against syllables instead.

This change ports `China.java` as a thin mechanic layered on the shell established by the `game-engine-base` change.

## What Changes

- Add `libs/alphaTiles/feature-game-china` — `<ChinaContainer>` + `<ChinaScreen>`. Wraps `<GameShellContainer>` from `feature-game-shell` and provides the China-specific board: a 4x4 sliding-tile puzzle ("Game of 15") beside a column of 4 word-image prompts.
- Register a per-class precompute (`registerPrecompute('china', ...)`) that partitions the pack's `wordList` into `threeTileWords` and `fourTileWords` by parsed tile count (ports `China.java:159 preprocessWords`). Cached on `LangAssetsProvider` so it runs once per boot, not once per game entry.
- Port China's challenge-level decoding: `challengeLevel 1 → 5 moves`, `2 → 10 moves`, `3 → 15 moves` (shuffle passes applied to the solved board, ports `China.java:111–120`).
- Port the tile-selection algorithm: pick 1 three-tile word + 3 four-tile words, tile the top three rows with the four-tile words, leave the bottom row for the three-tile word + a blank tile (positions 14 or 15 only accept the correct-order solve — ports `China.java:300–304`).
- Port the slide mechanic: `isSlideable(tileIndex)` checks whether the tile's 4-connected neighbor is the blank; `swapTiles` exchanges text and updates blank bookkeeping; `checkLineForSolve(row)` compares the current row content to the target word via `util-phoneme.combineTilesToMakeWord`.
- Port the win condition: all 4 rows solved → `updatePointsAndTrackers(4)` (via shell) → `playCorrectFinalSound`.
- Hook `clickPicHearAudio` (tap a word image) → `useAudio().playWord(refWord)` (via shell's `useGameShell()` context).
- Hook `repeatGame` → shuffle again with same stage selection.
- Storybook stories for `<ChinaScreen>` at several mid-game states.

## Capabilities

### New Capabilities

- `game-china` — China game mechanic: 4x4 slide-puzzle of tiles that form 3 four-tile words + 1 three-tile word, challenge-level-scaled shuffle depth, row-by-row solve detection, win at all-rows-solved.

### Modified Capabilities

_None_ — this change consumes `game-engine`, `scoring`, `stages`, `phoneme`, `progress`, `tile-ui`, `game-board-ui`, `celebration`, and `precompute-registry` as-is.

## Impact

- **New lib**: `libs/alphaTiles/feature-game-china` (`type:feature`, `scope:alphaTiles`).
- **New route**: `apps/alphaTiles/app/games/china.tsx` — resolves route params, renders `<ChinaContainer>`.
- **No new deps** — all deps already exist from `game-engine-base` and earlier changes.
- **Registry entry**: `registerPrecompute('china', buildChinaData)` added at the feature's `src/index.ts` module-load.
- **No breaking changes** — additive.
- **Exemplar value**: proves the shell architecture and establishes the pattern every future concrete-game change follows.
- **Risk: 3-tile + 4-tile word availability** — a pack with fewer than 1 three-tile word or fewer than 3 four-tile words cannot play China. Guardrail: the precompute logs a warning; the container shows a friendly "insufficient content" error instead of crashing (ports `China.java:138–144` more graciously).

## Out of Scope

- Other game classes (`Chile`, `Thailand`, `Italy`, …) — each is its own future change.
- Syllable-mode variants of China (`SyllOrTile = S`) — the row in `aa_games.txt` at door 88 for the English pack uses `T` (tiles). When a Cantonese pack ships with a door configured `SyllOrTile = S`, a follow-up change extends `feature-game-china` to branch on that column. Deferred because (a) the mechanic is the same, (b) the v1 fixtures exercise only the T variant, and (c) adding the syllable branch speculatively risks mis-designing it before the Cantonese pack is concrete.
- Animated slide transitions — v1 uses instant swaps like the Android original (which also does not animate the slide).
- Tests of the full game loop as an integration test — `type:feature` has no mandatory automated tests in v1 per ADR-010. Pure logic (board-setup, distractor selection, `isSlideable`) gets Jest tests; rendering is verified via Storybook.
