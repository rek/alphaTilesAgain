## ADDED Requirements

### Requirement: Keyboard Composition by Variant and Challenge Level

The keyboard SHALL be built per (`syllableGame`, `challengeLevel`) per `Colombia.java:loadKeyboard()` (~line 158). Java parity notes:

| variant | CL | Keyboard contents | Java line |
|---|---|---|---|
| T | 1 | `parsedRefWordTileArray` shuffled (duplicates kept — Java comment "Will list `<a>` twice if `<a>` is needed twice", line 165) | 168–186 |
| T | 2 | `parsedRefWordTileArray` + one `tileList.returnRandomDistractorTile(tile)` per tile (2× original size), shuffled | 234–253 |
| T | 3 | full `keyList` (from `aa_keyboard.txt`); paginated when `keysInUse > 35` | 274–303 |
| T | 4 | full `tileList` deduped; tiles colored by `typeOfThisTileInstance` (C→colorList[1], V→colorList[2], T→colorList[3], else colorList[4]); paginated when `keysInUse > 35` | 308–366 |
| S | 1 | `parsedRefWordSyllableArray` shuffled (duplicates kept) | 188–212 |
| S | 2 | `parsedRefWordSyllableArray` + one `syllableList.returnRandomDistractorSyllable(syl)` per syllable (2× original), with SAD-special handling, shuffled | 215–233 |
| S | 3 | `parsedRefWordSyllableArray` + `(18 - parsed.size())` distractors via same SAD-aware draw, shuffled — total ≤ 18 (capped at one page) | 256–274 |
| S | 4 | **Unsupported** — `goBackToEarth()` (Java line 78) | — |

Java color rule for CL1/CL2/CL3-S: `colorList.get(k % 5)` (index cycles every 5 keys). CL4-T uses tile-type-color (per table above).

#### Scenario: T-CL1 keyboard contains exactly the word's tiles in shuffled order

- **GIVEN** `syllableGame === "T"`, `challengeLevel === 1`, and the active word parses to `["a", "b", "c"]`
- **WHEN** the round starts
- **THEN** the keyboard renders exactly 3 keys whose texts are `["a", "b", "c"]` in shuffled order, colored `colorList[k % 5]` per slot

#### Scenario: T-CL2 keyboard size is 2× parsed length

- **GIVEN** `syllableGame === "T"`, `challengeLevel === 2`, and the active word parses to 4 tiles
- **WHEN** the round starts
- **THEN** the keyboard renders exactly 8 keys (4 correct + 4 random distractors), shuffled

#### Scenario: T-CL4 colors keys by tile type

- **GIVEN** `syllableGame === "T"`, `challengeLevel === 4`
- **WHEN** the keyboard renders
- **THEN** each key's background is `colorList[1]` for C-type tiles, `colorList[2]` for V, `colorList[3]` for T, else `colorList[4]`

#### Scenario: S-CL4 returns immediately to the menu

- **GIVEN** `syllableGame === "S"` and `challengeLevel === 4`
- **WHEN** the route mounts
- **THEN** the container calls `shell.goBackToCountryMenu()` and renders nothing

### Requirement: Live Attempt Feedback Color

The active-word display SHALL be tinted based on `currentAttempt` per `Colombia.java:evaluateStatus()` (~line 432). Colors and rules MUST match Java exactly:

- **Yellow** `#FFEB3B` — initial state and "on track" (the typed tiles' concatenated text is a prefix of the correct text AND, for CL1/CL2/CL4 or any S, every clicked tile's `text` matches `parsedRefWord*[i].text` at the same index).
- **Orange** `#F44336` — for CL1/CL2/CL4 or any S only: typed text equals `correctString.substring(0, len)` OR `clickedKeys.equals(firstNCorrectTiles)`, BUT at least one clicked tile's `text` differs from `parsedRefWord*[i].text`. (CL3-T never goes orange; comment in Java line 466 notes this is intentional.)
- **Gray** `#A9A9A9` (with black text) — default partial-incorrect: typed text is NOT a prefix of correct AND tile-list does not equal first-N. Also covers overlong attempts (Java's `if (correctString.length() > currentAttempt.length())` guards orange/yellow paths).

#### Scenario: Yellow while building correctly

- **GIVEN** target text `"cat"` and the player has keyed tiles for `"c"` then `"a"`
- **WHEN** the second tile is keyed
- **THEN** the active-word background is yellow

#### Scenario: Orange after a wrong tile that still matches text-prefix

- **GIVEN** target parses to `["c"(C), "h"(C-prefix-of-multitile)]` and the player keys a different tile whose text spells `"c"`
- **WHEN** the divergent tile is keyed
- **THEN** the active-word background is orange (text matches but tile identity differs)

#### Scenario: Gray when typed text is not a prefix

- **GIVEN** target text `"cat"` and the player has keyed tiles spelling `"x"`
- **WHEN** the wrong tile is keyed
- **THEN** the active-word background is gray with black text

### Requirement: Win Condition and Scoring

When the typed string equals `wordInLOPWithStandardizedSequenceOfCharacters(refWord)`, the game MUST:
- Set the active-word background to green (`#4CAF50`) with white text.
- Disable all key buttons and the delete button (Java lines 469–474).
- Call `shell.incrementPointsAndTracker(true)` — equivalent to Java's `updatePointsAndTrackers(4)` (+4 points). Note: shell increments by 1 in TypeScript per `game-engine-base` design D8; the Java point-value is documentational only.
- Sequence audio: `audio.playCorrect()` then `shell.replayWord()` (mirrors `playCorrectSoundThenActiveWordClip(false)`).
- Set advance arrow to blue.

#### Scenario: Win disables all keys and scores

- **GIVEN** the player has typed the full correct word
- **WHEN** `evaluateStatus` runs
- **THEN** the green-background win state renders, all key buttons are disabled, `shell.incrementPointsAndTracker(true)` is invoked, and the correct chime plays before the word clip

### Requirement: Delete Button Removes Last Entry

Tapping delete (Java `deleteLastKeyed`, line 502) SHALL:
- No-op if `clickedKeys` is empty.
- For S-mode or T-CL3: pop one entry from `clickedKeys` and trim the displayed text by that key's `.text.length()` from the end.
- For T-CL1/2/4: also pop one entry from `tilesInBuiltWord`; rebuild the displayed string via `combineTilesToMakeWord(tilesInBuiltWord, refWord, -1)`.
- Re-run `evaluateStatus`.

#### Scenario: Delete with empty attempt is a no-op

- **GIVEN** `clickedKeys.length === 0`
- **WHEN** the player taps delete
- **THEN** no state changes

#### Scenario: Delete pops last keyed entry

- **GIVEN** the player has keyed 3 tiles in T-CL1
- **WHEN** the player taps delete
- **THEN** `clickedKeys.length === 2`, `tilesInBuiltWord.length === 2`, and the displayed text reflects the new build

### Requirement: Pagination for T-CL3 and T-CL4

When the keyboard's `keysInUse > 35`, the renderer SHALL paginate using `tilesPerPage = 35` (33 keys + 2 nav arrows in slots 34–35). `totalScreens = ceil(keysInUse / 33)`. Java references: lines 558–605 (`updateKeyboard`) and 540–556 (`onBtnClick` arrow detection).

- The forward-arrow slot is `key35` (`R.drawable.zz_forward_green` when active, `zz_forward_inactive` on last page).
- The backward-arrow slot is `key34` (active green when not first page, inactive on first page).
- When `keyboardScreenNo === totalScreens` and `partial !== 0`, only the first `partial` slots in the body render visible keys; the rest are `View.INVISIBLE`.
- CL1, CL2, and S-CL3 (capped at 18 ≤ syllablesPerPage) MUST NOT paginate.

#### Scenario: T-CL3 with 70 keys paginates across 3 screens

- **GIVEN** `keyList.length === 70`
- **WHEN** the keyboard renders
- **THEN** `totalScreens === 3` and the user can navigate via the forward/back arrows

#### Scenario: First page has inactive backward arrow

- **GIVEN** the keyboard is on page 1
- **WHEN** the keyboard renders
- **THEN** key34 shows `zz_backward_inactive` and key35 shows `zz_forward_green`

### Requirement: RTL Layout

When `scriptDirection === "RTL"` (Java line 79), the instructions, repeat, and delete images MUST be horizontally flipped (`setRotationY(180)`); pagination arrow images (when paginated) MUST also be flipped. The container layout MUST apply RTL constraint adjustments.

#### Scenario: RTL flips delete and arrow icons

- **GIVEN** `scriptDirection === "RTL"`
- **WHEN** the screen renders
- **THEN** the delete-image and pagination-arrow images are mirrored horizontally

### Requirement: Image Tap Repeats Active Word Audio

Tapping the word image SHALL replay the active word clip via `shell.replayWord()`. Java reference: `Colombia.java:clickPicHearAudio` → `super.clickPicHearAudio(view)`.

#### Scenario: Image tap replays word audio

- **WHEN** the player taps the word image
- **THEN** `shell.replayWord()` is invoked

### Requirement: Container / Presenter Split

`<ColombiaContainer>` SHALL own all state and hook usage. `<ColombiaScreen>` SHALL be a pure props→JSX presenter with no hooks (other than `useWindowDimensions` for sizing) and no `react-i18next` import.

#### Scenario: Presenter has no i18n imports

- **WHEN** `ColombiaScreen.tsx` is statically analyzed
- **THEN** it MUST NOT import `react-i18next`
