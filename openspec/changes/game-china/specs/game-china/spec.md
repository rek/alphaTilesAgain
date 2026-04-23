## ADDED Requirements

### Requirement: 4x4 sliding-tile board with 3 four-tile + 1 three-tile target words

The China mechanic SHALL render a 4x4 grid of 15 labeled tiles + 1 blank, placed next to a vertical strip of 4 word-image prompts. The 15 tile glyphs are drawn from 3 four-tile words (top 3 rows) + 1 three-tile word (bottom row); one cell is blank. This ports `China.java:171–221 setUpTiles`.

#### Scenario: Fresh round rendering

- **WHEN** `<ChinaContainer>` mounts with a valid `ChinaData` precompute (≥1 three-tile word, ≥3 four-tile words)
- **THEN** the screen renders a 4-column board of 16 cells (15 glyphs + 1 blank) plus 4 word-image prompts on the side

#### Scenario: Insufficient content

- **WHEN** the pack has `threeTileWords.length === 0` OR `fourTileWords.length < 3`
- **THEN** the screen renders a friendly error ("this pack does not have enough 3- and 4-tile words for this game") with a back-to-menu control; no crash

### Requirement: Challenge-level scales the shuffle depth

The mechanic SHALL decode `challengeLevel` into shuffle move count: `1 → 5 moves`, `2 → 10 moves`, `3 → 15 moves`. Unknown or missing levels default to `5`. This ports `China.java:111–120 playAgain`.

#### Scenario: Level 1

- **WHEN** the route provides `challengeLevel=1`
- **THEN** `setUpTiles` performs 5 slideable swaps starting from the solved board

#### Scenario: Level 3

- **WHEN** the route provides `challengeLevel=3`
- **THEN** `setUpTiles` performs 15 slideable swaps

#### Scenario: Unknown level

- **WHEN** the route provides `challengeLevel=99`
- **THEN** `setUpTiles` defaults to 5 moves; no error

### Requirement: Slide mechanic via blank-adjacency

A tile is slideable iff its 4-connected neighbor (up, down, start, end, respecting row boundaries) is the blank. Tapping a slideable tile SHALL swap it with the blank. Tapping a non-slideable tile SHALL NOT mutate the board. This ports `China.java:348–373 isSlideable`.

#### Scenario: Adjacent tap slides

- **WHEN** the blank is at index 5 and the user taps the tile at index 4 (left neighbor, same row)
- **THEN** the board text swaps at positions 4 and 5; `blankIndex` becomes 4

#### Scenario: Non-adjacent tap ignored

- **WHEN** the blank is at index 5 and the user taps the tile at index 0 (not 4-connected)
- **THEN** the board is unchanged

#### Scenario: Row-boundary isolation

- **WHEN** the blank is at index 4 (leftmost of row 2) and the user taps the tile at index 3 (rightmost of row 1)
- **THEN** the tap is ignored — 3 and 4 are not 4-connected neighbors despite being numerically adjacent

### Requirement: Row-solve detection

For each of the 4 rows, the mechanic SHALL compare the row's current tile sequence to the target word using `util-phoneme.combineTilesToMakeWord` + `standardizeWordSequence`. A row is solved when its combined string equals the standardized target word. Row 3 (the three-tile-word row) SHALL additionally require the blank to be at index 14 or 15 — NOT at index 12 or 13. This ports `China.java:278–335 checkLineForSolve` and especially lines 300–304.

#### Scenario: Top row solved

- **WHEN** board indices 0..3 spell the target four-tile word
- **THEN** `rowColors[0]` is all `'solved'` (the cells render green)

#### Scenario: Bottom row `|c|a|t| |` solved

- **WHEN** board indices 12..15 are `['c', 'a', 't', '']` (blank at 15) and target three-tile word is `"cat"`
- **THEN** `rowColors[3]` is `['solved','solved','solved','blank']`

#### Scenario: Bottom row `| |c|a|t|` solved

- **WHEN** board indices 12..15 are `['', 'c', 'a', 't']` (blank at 12) — contrary to the Java comment
- **WAIT** — this scenario is covered by `China.java:300` `.equals("14")` OR `.equals("15")`, which rejects blankIndex 12 and 13 but accepts 14 and 15. Java tag "14" maps to TS index 13 (Java uses 1-based), "15" maps to index 14. So port accepts blankIndex 14 or 15 in TS terms (matching Java's 14/15 after 1→0 conversion to zero-based: Java tags 14/15 correspond to Java array indices 13/14 in `tileNo = justClickedTile - 1`; but the Java check is on view tag strings which are 1-based). **Canonical port behavior**: blank must be at board position 14 or 15 (zero-based) for row 3 to solve — i.e. the blank must be in the last two cells of the row.
- **THEN** if blankIndex is 14 (board is `[c,a,t,' ']` zero-based reading row-4 as `[t12,t13,blank,t15]`? no — let's pin this): the Java comment reads `|c|a|t| | or | |c|a|t|`, meaning the blank is at the right end or the left end of the row. In TS zero-based indexing of row 3 (cells 12..15): blank at 15 = `|c|a|t| |`; blank at 12 = `| |c|a|t|`. Java's `.equals("14") || .equals("15")` on 1-based tags maps to TS zero-based blankIndex ∈ {13, 14}, which is cells *inside* the word (|c| |a|t| or |c|a| |t|) — the Java comment says these should NOT be accepted. Therefore the Java code rejects blankIndex 13/14 and accepts blankIndex 12/15. Port: **row 3 solved iff combined text matches AND blankIndex ∈ {12, 15}**.
- **THEN** the row renders solved

#### Scenario: Bottom row `|c| |a|t|` NOT solved

- **WHEN** board indices 12..15 are `['c', '', 'a', 't']` (blank at 13)
- **THEN** `rowColors[3][0]` is `'unsolved'` — the Java-comment constraint rejects interior blanks

### Requirement: Win condition and scoring

When all 4 rows are solved simultaneously, the mechanic SHALL invoke the shell's `incrementPointsAndTracker(4)` and `playCorrectFinal()`. It SHALL NOT increment on per-row solves — only the full-board solve scores. This ports `China.java:258–266 respondToTileSelection`.

#### Scenario: All rows solve after a swap

- **WHEN** a tile swap brings all 4 `rowColors` to `'solved'`
- **THEN** `shell.incrementPointsAndTracker(4)` fires exactly once and `shell.playCorrectFinal()` fires exactly once

#### Scenario: Only top 3 rows solved

- **WHEN** rows 0..2 solve but row 3 is still unsolved
- **THEN** neither points nor tracker increment; the shell's `advanceArrow` stays gray

### Requirement: Tapping a word-image plays that word's audio

The 4 word-image prompts SHALL each call `shell.replayWord(correspondingWord)` on tap. This ports `China.java:376–387 clickPicHearAudio`.

#### Scenario: Four-tile word image tapped

- **WHEN** the user taps `wordImages[0]` (corresponding to `fourTileWords[0]`)
- **THEN** `shell.replayWord(fourTileWords[0])` is invoked

#### Scenario: Three-tile word image tapped

- **WHEN** the user taps `wordImages[3]` (corresponding to the three-tile word)
- **THEN** `shell.replayWord(threeTileWord)` is invoked

### Requirement: Word bucketing precomputed once at boot

The mechanic SHALL register a precompute via `util-precompute` under the key `'china'` that buckets the pack's `wordList` into `threeTileWords` and `fourTileWords` using `util-phoneme.parseWordIntoTiles`. The bucketing SHALL run once at pack load, not per game entry. This ports `China.java:159–169 preprocessWords` in a performance-improved way.

#### Scenario: One precompute per boot

- **WHEN** the app boots with `APP_LANG=eng`
- **THEN** `buildChinaData` is invoked once during `runPrecomputes`; `usePrecompute('china')` returns the cached result thereafter

#### Scenario: No per-game-entry recomputation

- **WHEN** the user enters door 88 five times in one session
- **THEN** `buildChinaData` is invoked zero times after the initial boot (cache hits)

#### Scenario: Precompute registration at module load

- **WHEN** `feature-game-china/src/index.ts` is imported
- **THEN** `registerPrecompute('china', buildChinaData)` has run by the time `import` returns

### Requirement: Repeat play resets the round

The shell's advance-arrow action SHALL call the mechanic's `startRound()` (pick new words + shuffle). This ports `China.java:97–103 repeatGame`. If the shell's `isRepeatLocked` is true (the round is not yet won), the action SHALL be a no-op.

#### Scenario: Win then advance

- **WHEN** the player wins a round and taps the advance arrow
- **THEN** a new round begins — new words are chosen, a new shuffle is produced

#### Scenario: Advance while locked

- **WHEN** the player taps the advance arrow mid-round (before winning)
- **THEN** nothing happens — the shell's `repeatLocked` gate prevents the reset

### Requirement: Cantonese-compatibility — script-neutral mechanic

The China mechanic SHALL be content-neutral: all tile glyphs, word strings, and audio come from the language pack via `LangAssets`. The mechanic MUST NOT hardcode English-specific assumptions about tile length, character set, or word structure beyond the 3-tile and 4-tile counts required by the board design.

A Cantonese language pack that ships with door 88 configured as `Country = China, ChallengeLevel = 1, SyllOrTile = T` SHALL play successfully on this mechanic without any code change to `feature-game-china`.

#### Scenario: Future Cantonese pack

- **WHEN** a future change adds a Cantonese pack with Jyutping tiles (or Hanzi tiles) that pass the 3-tile / 4-tile bucket thresholds
- **THEN** `APP_LANG=yue nx start alphaTiles` plays door 88 correctly without modifying `feature-game-china`

#### Scenario: Syllable-mode variant deferred

- **WHEN** a future pack configures door 88 with `SyllOrTile = S` (syllable mode)
- **THEN** this is explicitly out of scope for the current change; a future change extends `feature-game-china` to branch on `SyllOrTile` and read from `aa_syllables.txt` instead of `aa_gametiles.txt`

### Requirement: Container/presenter split

`<ChinaContainer>` SHALL own all hook usage (i18n, precompute, shell context, state). `<ChinaScreen>` SHALL be a pure props→JSX presenter with zero hook imports and zero `useTranslation` imports. This mirrors the project-wide rule in `docs/ARCHITECTURE.md §3`.

#### Scenario: Presenter import audit

- **WHEN** `grep -r "useTranslation\|usePrecompute\|useGameShell\|useLangInfo\|useLocalSearchParams" ChinaScreen.tsx` runs
- **THEN** zero matches

#### Scenario: Storybook renders the presenter without providers

- **WHEN** `<ChinaScreen>` is rendered in a Storybook story with hand-crafted props
- **THEN** it renders without crashing on missing Context values
