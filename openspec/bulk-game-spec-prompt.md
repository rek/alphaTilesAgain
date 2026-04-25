# Bulk Game Spec Prompt for Opus

You are writing OpenSpec change artifacts for an Expo + React Native + TypeScript NX monorepo.

## Project summary

**AlphaTiles** — literacy game generator for minority-language communities. A language community supplies a folder of assets (tab-delimited wordlists, phoneme/tile data, audio, images, fonts) and the app renders that as tile-based literacy games in that language.

This is a port of a Java/Android app. The Java source exists; your job is to write the spec artifacts that define how each game class ports to TypeScript. The spec artifacts are **not code** — they are design documents + task checklists that a developer (or coding agent) will later use to write the code.

---

## Architecture rules (non-negotiable)

- **Library pattern**: `libs/alphaTiles/feature-game-<name>` (`type:feature`, `scope:alphaTiles`)
- **Container/Presenter split**: every feature screen has a container (`<XxxContainer>`) that owns hooks + state + callbacks, and a presenter (`<XxxScreen>`) that is pure props → JSX with no hooks.
- **i18n-blind presenters**: presenters never import `react-i18next`. All translated strings are passed as props from the container.
- **No barrel files** except library root `src/index.ts`. One function/component per file.
- **Route**: `apps/alphaTiles/app/games/<name>.tsx` renders `<XxxContainer />`.

---

## Shell API (what every game container gets)

The `game-engine-base` change (already merged) provides these hooks/components:

```ts
// In <XxxContainer>:
const { challengeLevel, syllableGame, stage, gameNumber, country } = useGameShell();
const { tiles, words, syllables, colors, settings, langInfo, audio } = useLangAssets();
const precomputed = usePrecompute('<key>');      // cached result of XxxPreProcess
const { incrementPointsAndTracker } = useProgress();
const { playWord, playCorrect, playIncorrect, playCorrectThenWord, playInstruction } = useAudio();

// Wrap game UI in:
<GameShellContainer ...>
  <XxxScreen ... />
</GameShellContainer>
```

**NO_TRACKER_COUNTRIES**: `Romania`, `Sudan`, `Malaysia`, `Iraq` — `shouldIncrementTracker(country)` returns `false` for these four. Games in these countries must **never** call `incrementPointsAndTracker`. The shell's `GameShellContainer` enforces this guard; game containers should simply call `incrementPointsAndTracker` normally — the guard is applied by the shell, not the game.

**`updatePointsAndTrackers(N)`** in Java → `incrementPointsAndTracker(N)` in TS.

**`syllableGame`**: `"T"` = tile game, `"S"` = syllable game variant.

---

## Output format

For each of the 10 games, output **5 files** with this exact delimiter format:

```
=== FILE: openspec/changes/game-<name>/proposal.md ===
...content...

=== FILE: openspec/changes/game-<name>/design.md ===
...content...

=== FILE: openspec/changes/game-<name>/tasks.md ===
...content...

=== FILE: openspec/changes/game-<name>/specs/<name>/spec.md ===
...content...

=== FILE: openspec/changes/game-<name>/.openspec.yaml ===
...content...
```

Process all 10 games in order: brazil, colombia, ecuador, georgia, iraq, italy, malaysia, myanmar, peru, sudan.

---

## Complete example: game-chile (all 5 artifacts)

Study these carefully — they define the format and quality bar.

=== EXAMPLE FILE: openspec/changes/game-chile/proposal.md ===
## Why

Chile is a tile-based Wordle clone. It builds phonemic awareness by having players guess a secret word using the language pack's tile alphabet. Unlike standard Wordle, tiles are phonemic units (which may be multi-character) rather than individual letters.

## What Changes

- Add `libs/alphaTiles/feature-game-chile` — `<ChileContainer>` + `<ChileScreen>`.
- Port Chile's Wordle mechanic:
    - A secret word is randomly selected from the pack's wordlist (filtered by min/max tile length).
    - The player builds guesses tile-by-tile using an on-screen tile keyboard.
    - Submitting a complete guess colors each tile: GREEN (correct tile, correct position), BLUE (correct tile, wrong position), GRAY (tile not in word).
    - The keyboard updates to reflect the best known color for each tile.
    - Win: a guess where all tiles are GREEN → `updatePointsAndTrackers(1)`.
    - Lose: exhausted all rows → show correct answer in GREEN, no points.
- Number of guess rows = `baseGuessCount - challengeLevel + 1` (default `baseGuessCount = 8`; L1 = 8 rows, L2 = 7, L3 = 6).
- Precompute (`chilePreProcess`): builds the tile keyboard (sorted union of all tiles used in valid words, max 50) and the filtered word list.
- Use `feature-game-shell` for UI chrome and navigation.

## Capabilities

### New Capabilities

- `game-chile` — Chile Wordle mechanic: guess a phonemic-tile word within N rows; green/blue/gray tile feedback; keyboard reflects best-known colors.

## Impact

- **New lib**: `libs/alphaTiles/feature-game-chile` (`type:feature`, `scope:alphaTiles`).
- **New route**: `apps/alphaTiles/app/games/chile.tsx`.

## Out of Scope

- Hard-mode constraints (must use confirmed tiles in subsequent guesses).
- Hint system or audio prompts — Chile is text-only.
- Custom keyboard layout beyond `keyboardWidth` setting.

=== EXAMPLE FILE: openspec/changes/game-chile/design.md ===
## Context

Chile.java is a phonemic Wordle clone. The player guesses a secret word composed of language-pack tiles. Unlike standard Wordle (single-character letters), tiles may be multi-character phonemic units. The keyboard is built from the tiles present in the valid word list.

### Required reading for implementers

- `AGENTS.md` — entry doc; read first.
- `openspec/AGENT_PROTOCOL.md` — pickup protocol.
- `docs/ARCHITECTURE.md` §3 (taxonomy), §11 (container/presenter), §13 (routing).
- `docs/decisions/ADR-010-testing-storybook-plus-unit.md`.
- **Upstream OpenSpec changes:** `game-engine-base` (merged).
- **Source Java files:** `Chile.java` — full mechanic. `TileAdapter.java` — grid adapter for guess/keyboard views.

## Goals / Non-Goals

**Goals:**
- Port Chile Wordle mechanic: tile keyboard, guess rows, green/blue/gray feedback.
- Implement `chilePreProcess` precompute: build keyboard and filter word list by tile length.
- `challengeLevel` controls guess count: `guesses = baseGuessCount - challengeLevel + 1`.
- Container/Presenter split; i18n-blind presenter.

**Non-Goals:**
- Audio/image prompts — Chile is purely text-based.
- Hard-mode Wordle constraints.

## Decisions

### D1. Java surface → TS artifact mapping

| Java symbol | TS destination | Notes |
|---|---|---|
| `String[] secret` | `secret: string[]` state | Array of tile strings for the current word |
| `ArrayList<String[]> wordList` | precomputed, loaded via `usePrecompute('chile')` | Filtered, shuffled list |
| `ArrayList<ColorTile> tiles` | `guessTiles: ColorTile[]` state | Flat grid: rows × secret.length cells |
| `ArrayList<ColorTile> keys` | `keyTiles: ColorTile[]` state | Keyboard tiles |
| `int currentRow` | `currentRow: number` state | Which guess row is active |
| `boolean finished` | `finished: boolean` state | |
| `data.guesses` | `guessCount = baseGuessCount - challengeLevel + 1` | Rows available |
| `data.keyboardWidth` | `keyboardWidth` (from settings, default 7) | Keyboard column count |
| `keyPressed(view)` | `onKeyPress(tileText)` handler | Fills next empty cell in current row |
| `backSpace()` | `onBackspace()` handler | Clears last filled cell in current row |
| `completeWord()` | `onSubmitGuess()` handler | Scores current row |
| `reset()` | `onReset()` handler | Picks new secret, resets state |

### D2. Tile Color States

```ts
const GREEN = colorList[3];   // correct position
const BLUE  = colorList[1];   // correct tile, wrong position
const GRAY  = colorList[8];   // not in word
const EMPTY = colorList[6];   // unfilled cell
const KEY_COLOR = colorList[0]; // default keyboard tile
```

Color values read from `aa_colors.txt` at the same indices as Java (`Start.colorList`).

### D3. Guess Evaluation Logic

On submit (`completeWord`):
1. Compare current row tiles against `secret` position-by-position.
2. Exact matches → GREEN first pass.
3. Non-matches: scan `secret` for unmatched occurrences of the guessed tile → BLUE.
4. Remaining → GRAY.
5. Update keyboard: a key's color advances only to a higher certainty (GRAY < BLUE < GREEN).
6. Win: `greenCount === secret.length` → `updatePointsAndTrackers(1)`, show reset button.
7. Lose (row = last row, no win): show `secret` tiles in GREEN below the grid.

### D4. Precompute: `chilePreProcess`

Run at boot; stored under key `'chile'`:

```ts
type ChileData = {
  words: string[][];     // each word as array of tile strings
  keys: string[];        // sorted keyboard tiles
  keyboardWidth: number; // default 7, overridable by settings
  guesses: number;       // set per-game from challengeLevel
};
```

Building process:
1. Read `minWordLength` (default 3) and `maxWordLength` (default 100) from settings.
2. Filter `wordList`: parse each word into tiles, keep if `minLen ≤ tileCount ≤ maxLen`.
3. Build keyboard: union of all tile strings from valid words, max 50 tiles, sorted by `tileList` order.
4. `guesses` is not stored in precompute — computed per-game as `baseGuessCount - challengeLevel + 1`.

### D5. Container / Presenter Split

**`<ChileContainer>`** — owns:
- `usePrecompute('chile')`, `useGameShell()`.
- All state: `secret`, `guessTiles`, `keyTiles`, `currentRow`, `finished`.
- Handlers: `onKeyPress`, `onBackspace`, `onSubmitGuess`, `onReset`.
- Computes `guessCount = 8 - challengeLevel + 1` (or `baseGuessCount` if settings override).

**`<ChileScreen>`** — pure props → JSX:
- `guessTiles: ColorTile[]`, `keyTiles: ColorTile[]`, `wordLength: number`, `keyboardWidth: number`.
- Callbacks: `onKeyPress`, `onBackspace`, `onSubmitGuess`.
- No hooks — all data passed as props.

## Testing strategy

| Area | Approach |
|---|---|
| Guess evaluation (GREEN/BLUE/GRAY) | Jest unit tests — exhaustive edge cases |
| Keyboard color update logic | Jest unit tests |
| Precompute word filtering | Jest unit test with mock wordlist |
| `ChileContainer` | Manual QA against `engEnglish4` |
| `ChileScreen` | Storybook stories: empty board, mid-game, won, lost |

=== EXAMPLE FILE: openspec/changes/game-chile/tasks.md ===
# Tasks: Game Chile (Phonemic Wordle)

## 0. Preflight

- [ ] Read `proposal.md`, `design.md`, and `specs/chile/spec.md`.
- [ ] Read `Chile.java` and `TileAdapter.java` (Android source) to confirm color indices and evaluation logic.
- [ ] Confirm `game-engine-base` is archived (upstream merged).

## 1. Library Scaffold

- [ ] Generate library: `nx g @nx/react-native:lib feature-game-chile --directory=libs/alphaTiles/feature-game-chile --tags='type:feature,scope:alphaTiles'`.
- [ ] Add path alias to `tsconfig.base.json`: `"@alphaTiles/feature-game-chile": ["libs/alphaTiles/feature-game-chile/src/index.ts"]`.
- [ ] Create route: `apps/alphaTiles/app/games/chile.tsx`. Renders `<ChileContainer />`.

## 2. Precompute

- [ ] Implement `src/chilePreProcess.ts`:
  - Read `minWordLength` (default 3), `maxWordLength` (default 100), `keyboardWidth` (default 7) from settings.
  - Filter `wordList`: parse each word into tiles, keep if tile count is within bounds.
  - Build keyboard: sorted union of all tile strings from valid words, max 50 tiles.
  - Return `ChileData { words, keys, keyboardWidth }`.
- [ ] Register: `registerPrecompute('chile', chilePreProcess)` in `src/index.ts`.
- [ ] Unit tests for `chilePreProcess`: verify word filtering, keyboard deduplication and sort order.

## 3. Guess Evaluation Logic

- [ ] Implement `src/evaluateGuess.ts`: given `guess: string[]` and `secret: string[]`, return `ColorTile[]` with GREEN/BLUE/GRAY per D3.
- [ ] Implement `src/updateKeyboard.ts`: given prior keyboard state and new guess results, advance each key's color (GRAY < BLUE < GREEN — never regress).
- [ ] Unit tests for `evaluateGuess`: correct position, correct tile wrong position, duplicate tiles, all gray, all green.
- [ ] Unit tests for `updateKeyboard`: color never regresses.

## 4. Presenter: `<ChileScreen>`

- [ ] Define `ChileScreenProps`: `guessTiles: ColorTile[]`, `keyTiles: ColorTile[]`, `wordLength: number`, `keyboardWidth: number`, `onKeyPress: (tile: string) => void`, `onBackspace: () => void`, `onSubmitGuess: () => void`.
- [ ] Implement `<ChileScreen>`:
  - Guess grid: `guessCount` rows × `wordLength` columns of colored tile cells.
  - Tile keyboard: `keyTiles` in a grid of `keyboardWidth` columns.
  - Backspace button and submit button.
- [ ] Storybook stories: empty board, mid-game (mixed colors), won state, lost state (answer revealed).

## 5. Container: `<ChileContainer>`

- [ ] Implement `<ChileContainer>`:
  - `usePrecompute('chile')`, `useGameShell()`, `useLangAssets()`.
  - State: `secret`, `guessTiles`, `keyTiles`, `currentRow`, `finished`.
  - Compute `guessCount = 8 - challengeLevel + 1` (or `baseGuessCount` from settings if overridden).
  - `onKeyPress(tile)`: fill next empty cell in current row.
  - `onBackspace()`: clear last filled cell in current row.
  - `onSubmitGuess()`: call `evaluateGuess`, update `guessTiles` and `keyTiles`, check win/lose.
  - Win: `updatePointsAndTrackers(1)`, show reset.
  - Lose (last row, no win): append correct answer row in GREEN.
  - `onReset()`: pick new secret from remaining wordList, reset state.
- [ ] Wrap with `<GameShellContainer>`.

## 6. Verification

- [ ] Type-check: `npx tsc --noEmit -p libs/alphaTiles/feature-game-chile/tsconfig.lib.json`.
- [ ] Lint: `nx lint alphaTiles-feature-game-chile`.
- [ ] Test: `nx test alphaTiles-feature-game-chile`.
- [ ] Manual smoke test: `APP_LANG=eng nx serve alphaTiles` — verify GREEN/BLUE/GRAY feedback, keyboard color update, win/lose states.

=== EXAMPLE FILE: openspec/changes/game-chile/specs/chile/spec.md ===
# Capability: Chile Game (Phonemic Wordle)

Chile is a tile-based Wordle clone where players guess a secret word using the language pack's phonemic tile alphabet. Tile feedback (GREEN/BLUE/GRAY) guides the player to the correct word.

## Requirements

### R1. Guess Row Count Scales with Challenge Level

The number of available guess rows MUST equal `baseGuessCount - challengeLevel + 1` (default `baseGuessCount = 8`).

#### Scenario: Level 1 has 8 rows
- **GIVEN** challengeLevel is 1 and baseGuessCount is 8
- **WHEN** a game starts
- **THEN** 8 guess rows are displayed

#### Scenario: Level 3 has 6 rows
- **GIVEN** challengeLevel is 3 and baseGuessCount is 8
- **WHEN** a game starts
- **THEN** 6 guess rows are displayed

### R2. Tile Feedback — Correct Position (GREEN)

A guessed tile in the exact correct position MUST be colored GREEN.

#### Scenario: Exact match
- **GIVEN** secret is ["c", "a", "t"] and guess is ["c", "a", "t"]
- **WHEN** the guess is submitted
- **THEN** all three tiles are GREEN

### R3. Tile Feedback — Correct Tile, Wrong Position (BLUE)

A guessed tile that exists in the secret word but is in the wrong position MUST be colored BLUE (if not already accounted for by a GREEN match).

### R4. Tile Feedback — Not in Word (GRAY)

A guessed tile that does not appear in the secret word MUST be colored GRAY.

### R5. Keyboard Color Update

After each guess, each keyboard tile's color MUST update to reflect the best-known feedback (GREEN > BLUE > GRAY). A tile's color never regresses to a lower certainty.

### R6. Win Condition

When all tiles in a guess row are GREEN, the game MUST call `updatePointsAndTrackers(1)` and show the reset button.

### R7. Lose Condition

When the player exhausts all guess rows without a full GREEN row, the secret word MUST be revealed in GREEN. No points awarded.

### R8. Precompute: Word List and Keyboard

The game MUST register a precompute under key `'chile'` that filters `wordList` to words within tile length bounds and builds a keyboard of up to 50 unique tiles sorted by `tileList` order.

### R9. Container / Presenter split

`<ChileContainer>` SHALL own all state and hook usage. `<ChileScreen>` SHALL be a pure props→JSX presenter with no hooks.

=== EXAMPLE FILE: openspec/changes/game-chile/.openspec.yaml ===
name: game-chile
artifacts:
  proposal:
    status: done
    path: proposal.md
  design:
    status: done
    path: design.md
    dependencies: [proposal]
  tasks:
    status: done
    path: tasks.md
    dependencies: [design]
  specs/chile:
    status: done
    path: specs/chile/spec.md
    dependencies: [design]
apply:
  requires: [tasks, specs/chile]
  status: pending

---

## Java source files (10 games to spec)

Below are all 10 Java files. Read each carefully. The mechanic in the Java code is what you must describe in the spec artifacts.

=== JAVA: Brazil.java ===
```java
package org.alphatilesapps.alphatiles;

import android.content.res.Resources;
import android.graphics.Color;
import android.os.Bundle;
import android.view.View;
import android.widget.ImageView;
import android.widget.TextView;
import com.segment.analytics.Analytics;
import com.segment.analytics.Properties;

import java.util.HashSet;
import java.util.Random;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Set;

import static org.alphatilesapps.alphatiles.Start.*;

// RR
//Game idea: Find the vowel missing from the word
//Challenge Level 1: VOWELS: Pick from correct tile and three random VOWEL tiles
//Challenge Level 2: VOWELS: Pick from correct tile and its distractor trio
//Challenge Level 3: VOWELS: Pick from all vowel tiles (up to a max of 15)

// AH
//Challenge Level 4: CONSONANTS: Pick from correct tile and three random CONSONANT tiles
//Challenge Level 5: CONSONANTS: Pick from correct tile and its distractor trio
//Challenge Level 6: CONSONANTS: Pick from all consonant tiles (up to a max of 15)

//JP
//Challenge Level 7: TONES: Pick from <= 4 tone markers; if the lang has >= 2 and < 4 tone markers,
// make other views invisible

// JP
// Syllable Level 1: Pick from correct syllable and three random syllables (4 choices)
// Syllable Level 2: Pick from correct syllable and its distractor trio (4 choices)
// No reason to accommodate 15 syllables, right?

public class Brazil extends GameActivity {
    Set<String> answerChoices = new HashSet<String>();
    int numTones;
    Start.Tile correctTile;
    Start.Syllable correctSyllable;
    String correctString;

    protected static final int[] GAME_BUTTONS = {
            R.id.tile01, R.id.tile02, R.id.tile03, R.id.tile04, R.id.tile05, R.id.tile06, R.id.tile07, R.id.tile08, R.id.tile09, R.id.tile10,
            R.id.tile11, R.id.tile12, R.id.tile13, R.id.tile14, R.id.tile15
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        context = this;
        if (challengeLevel == 3 || challengeLevel == 6) {
            setContentView(R.layout.brazil_cl3);
        } else {
            setContentView(R.layout.brazil_cl1);
        }

        if (challengeLevel < 4 && !syllableGame.equals("S")) {
            if (VOWELS.isEmpty()) {
                for (int d = 0; d < tileList.size(); d++) {
                    if (tileList.get(d).typeOfThisTileInstance.matches("(LV|AV|BV|FV|V)")) {
                        VOWELS.add(tileList.get(d));
                    }
                }
            }
            Collections.shuffle(VOWELS);
        } else if (syllableGame.equals("S")) {
            if (SYLLABLES.isEmpty()) {
                for (int d = 0; d < syllableList.size(); d++) {
                    SYLLABLES.add(syllableList.get(d).toString());
                }
            }
            Collections.shuffle(SYLLABLES);
        } else {
            if (CONSONANTS.isEmpty()) {
                for (int d = 0; d < tileList.size(); d++) {
                    if (tileList.get(d).typeOfThisTileInstance.equals("C")) {
                        CONSONANTS.add(tileList.get(d));
                    }
                }
            }
            Collections.shuffle(CONSONANTS);
        }

        if (MULTITYPE_TILES.isEmpty()) {
            for (int d = 0; d < tileList.size(); d++) {
                if (!tileList.get(d).tileTypeB.equals("none")) {
                    MULTITYPE_TILES.add(tileList.get(d).text);
                }
            }
        }
        Collections.shuffle(MULTITYPE_TILES);

        if (syllableGame.equals("S")) {
            visibleGameButtons = 4;
        } else {
            switch (challengeLevel) {
                case 3:
                    visibleGameButtons = VOWELS.size();
                    if (visibleGameButtons > 15) visibleGameButtons = 15;
                    break;
                case 6:
                    visibleGameButtons = CONSONANTS.size();
                    if (visibleGameButtons > 15) visibleGameButtons = 15;
                    break;
                case 7:
                    numTones = TONES.size();
                    if (numTones > 4) numTones = 4;
                    visibleGameButtons = 4;
                    break;
                default:
                    visibleGameButtons = 4;
            }
        }

        updatePointsAndTrackers(0);
        playAgain();
    }

    public void playAgain() {
        if (mediaPlayerIsPlaying) return;
        repeatLocked = true;
        setAdvanceArrowToGray();
        setWord();
        removeTile();
        setAllGameButtonsUnclickable();
        setOptionsRowUnclickable();
        if (syllableGame.equals("S")) {
            setUpSyllables();
        } else {
            setUpTiles();
        }
        playActiveWordClip(false);
        setAllGameButtonsClickable();
        setOptionsRowClickable();
    }

    private void setWord() {
        chooseWord();
        ImageView image = findViewById(R.id.wordImage);
        int resID = getResources().getIdentifier(refWord.wordInLWC, "drawable", getPackageName());
        image.setImageResource(resID);

        if (syllableGame.equals("S")) {
            parsedRefWordSyllableArray = syllableList.parseWordIntoSyllables(refWord);
        } else {
            parsedRefWordTileArray = tileList.parseWordIntoTiles(refWord.wordInLOP, refWord);
        }

        // Validate that chosen word has the correct tile type for the challenge level
        // (vowel for CL<4, consonant for CL4-6, tone for CL7)
        // If not, recurse: setWord()
    }

    private void removeTile() {
        // Randomly picks one tile from parsedRefWordTileArray that matches the
        // target type for this challenge level (vowel/consonant/tone), never SAD.
        // Replaces it with a blank tile ("__") in parsedRefWordTileArray.
        // For syllable game: picks random syllable (not SAD), replaces with "__".
        // The word (minus the blank) is displayed in activeWordTextView.
    }

    private void setUpTiles() {
        // CL1: 4 random vowel tiles (correct + 3 random vowels from VOWELS pool)
        // CL2: 4 tiles = correct + distractor trio (shuffled)
        // CL3: up to 15 vowel tiles (all VOWELS, shuffled; if correct not present, overwrite one random)
        // CL4: same as CL1 but consonants
        // CL5: same as CL2 but consonants
        // CL6: same as CL3 but consonants (up to 15)
        // CL7: up to 4 tone tiles (TONES list, hide extras with View.INVISIBLE)
    }

    private void setUpSyllables() {
        // 4 syllable choices: correct + distractors (or random syllables for SL1)
        // SL1: random syllables from SYLLABLES pool; ensure correct is present
        // SL2: correct + 3 distractors from syllableHashMap
    }

    private void respondToTileSelection(int justClickedButton) {
        if (mediaPlayerIsPlaying) return;
        setAllGameButtonsUnclickable();
        setOptionsRowUnclickable();

        String gameButtonString = // text of clicked button

        if (gameButtonString.equals(correctString)) {
            // Correct: show full word in activeWordTextView, gray out other tiles
            repeatLocked = false;
            setAdvanceArrowToBlue();
            updatePointsAndTrackers(1);
            playCorrectSoundThenActiveWordClip(false);
        } else {
            // Incorrect: play incorrect sound, track incorrect answer
            playIncorrectSound();
        }
    }

    public void onBtnClick(View view) {
        respondToTileSelection(Integer.parseInt((String) view.getTag()));
    }
}
```

=== JAVA: Colombia.java ===
```java
// Colombia: Type/build the word using a tile keyboard (or syllable keyboard).
// The player taps tiles to build a word; tap delete to remove last; word is compared continuously.
//
// syllableGame "T" variant: challengeLevel controls keyboard layout:
//   CL1: keyboard = exact tiles of the current word, shuffled (no extras)
//   CL2: keyboard = word tiles + one distractor per tile, shuffled
//   CL3: full keyboard (aa_keyboard.txt keys), paginated at 33 per page if > 35 keys
//   CL4: full tileList (deduplicated), type-colored, paginated
//
// syllableGame "S" variant:
//   CL1: syllables of the word, shuffled
//   CL2: syllables of the word + one distractor per syllable, shuffled
//   CL3: all syllables, paginated at 18 per page
//   CL4 (syllable): not supported — goBackToEarth immediately
//
// Evaluation: currentAttempt vs correctString (exact match → win).
//   Partial correct: yellow background (building correctly so far)
//   Partial incorrect: orange background (wrong tile chosen — can't lead to correct word)
//   Word already too long: gray
//
// Win: updatePointsAndTrackers(4); playCorrectSoundThenActiveWordClip(false)
// Delete button removes last keyed tile/syllable.
// Pagination arrows appear when keyboard > 1 page.
```

=== JAVA: Ecuador.java ===
```java
// Ecuador: Word-image matching game (scatter layout).
// The screen shows 8 randomly-positioned word tiles and one word+image prompt.
// The player taps the tile whose text matches the displayed word.
//
// Layout: 8 word tiles positioned with random x/y coordinates and random widths.
//   Tiles must not overlap; retry if placement fails (up to 10000 attempts per tile; restart if still fails).
//
// A pool of words is drawn from cumulativeStageBasedWordList.
// On each round: shuffle pool, pick refWord (displayed prominently with its image variant "2"),
//   fill 7 of the 8 tiles with different words, replace a random tile with refWord.
//
// Win: player taps the tile whose text == refWord.wordInLOP (stripped of instruction chars).
//   updatePointsAndTrackers(2); play correct + word audio; gray out wrong tiles.
// Wrong: playIncorrectSound; track incorrect answer.
//
// No challenge levels — same mechanic regardless of challengeLevel.
// No syllable game variant.
// No precompute needed.
```

=== JAVA: Georgia.java ===
```java
// Georgia: Identify the first sound (tile or syllable) of a word.
//
// Tile variants (syllableGame="T"):
//   CL1–3: 6/12/18 random tile choices from CorV list (C or V tiles only)
//   CL4–6: 6/12/18 challenging choices (correct + distractors + tiles sharing first chars)
//   CL7–9: same counts as 1–3 but target is first non-LV tile ("first sound", relevant for Thai/Lao)
//   CL10–12: same counts as 4–6 but for first-sound variant
//
// Syllable variant (syllableGame="S"):
//   CL1–3: 6/12/18 random syllables
//   CL4–6: 6/12/18 challenging syllables (correct + distractors + similar-prefix syllables)
//
// Word selection: chooseWord(); initialTile = parsedRefWordTileArray[0].
//   For CL7–12: skip leading LV tiles; if PC, use the LV that preceded it.
//   Filter: word must begin with a C or V (CorV list). If not, retry chooseWord().
//
// Win: player taps the correct initial tile/syllable.
//   Show fullWordTextView with the stripped word text.
//   updatePointsAndTrackers(1).
//   playCorrectSoundThenActiveWordClip(false).
// Wrong: playIncorrectSound(); track incorrect answer.
//
// Image: word image displayed via wordImage view.
// No precompute needed.
```

=== JAVA: Iraq.java ===
```java
// Iraq: Tile explorer / reference screen (NOT a scored game).
// Displays all tiles from cumulativeStageBasedTileList (excluding SAD and SILENT_PLACEHOLDER_CONSONANTS),
//   sorted alphabetically by tile.text, paginated at 35 per page in a 5×7 grid.
//
// Tapping a tile plays its audio, then after (tileAudioDuration + 500ms):
//   Shows a random word that contains that tile (based on scanSetting):
//     scanSetting=1: words where the tile appears in position 1
//     scanSetting=2: words where tile appears in position 1, or position 2 if no position-1 words
//     scanSetting=3: words where tile appears in position 3
//   If CL2 and tile has an iconicWord: use that specific word instead.
//   Shows word text on the tile (white background) and word image overlaid.
//   After 2 seconds: restore tile to original text and color.
//
// Pagination: prev/next arrows; hide when on first/last page.
// scanSetting read from settingsList.find("Game 001 Scan Setting").
//
// NO tracker increment (Iraq is in NO_TRACKER_COUNTRIES).
// No win/lose state — this is an exploration game; no updatePointsAndTrackers call.
// No syllable variant.
// No precompute.
```

=== JAVA: Italy.java ===
```java
// Italy: Lotería (Bingo-like card game).
// A 4×4 board of word tiles (text + image). A "caller" reads words one by one.
// Player taps the matching tile on their board; a bean image covers it when correct.
// Win: a row, column, or diagonal of 4 beans ("lotería!").
//
// Setup:
//   deckSize = settingsList.find("Italy Deck Size") or default 54.
//   Shuffle wordList; take first deckSize words as gameCards.
//   Place first 16 (CARDS_ON_BOARD) as board with text + variant image ("2" suffix).
//   Shuffle gameCards again; "call" them one by one via nextWordFromGameSet().
//
// syllableGame "T": tiles are word text (wordInLOP)
// syllableGame "S": same but words from syllableList (sortableSyllArray instead of sortableTilesArray)
//
// Each "call": deckIndex++; refWord = gameCards[deckIndex]; playActiveWordClip(false).
//   If deckIndex == deckSize: playIncorrectSound ×2; playAgain() (reset).
//
// Win (lotería): respondToLoteria() → setAdvanceArrowToBlue(); playCorrectSoundThenActiveWordClip(true); updatePointsAndTrackers(4).
//   Lotería check: LOTERIA_SEQUENCES = 10 sequences (4 rows, 4 cols, 2 diagonals).
//   Winning sequence beans turn to zz_bean_loteria.
//
// Wrong selection: playIncorrectSound().
// Correct non-lotería: bean placed; playCorrectSoundThenActiveWordClip(false); next word.
//
// referenceItem button: plays the current word audio again.
// playNextWord (advance arrow): nextWordFromGameSet().
//
// Need >= deckSize words or go back to Earth.
// No precompute needed (deckSize can be read from settings at runtime).
```

=== JAVA: Malaysia.java ===
```java
// Malaysia: Scrolling word-audio browser (NOT a scored game).
// Displays all words from wordStagesLists[stage-1], 11 per page, with word text + word image.
// Tapping a word (or its image) plays that word's audio.
//
// Layout: 11 word tiles per page; text color cycles through colorList indices [0..4..0] (pyramid: 0,1,2,3,4,7,4,3,2,1,0).
// Images: wordPagesLists[page][i].wordInLWC loaded as background drawable.
//
// Pagination: forward/backward arrows; hide when at start/end.
//   determineNumPages() + assignPages() distribute words across pages at init.
//
// Tap handler (onWordClick / clickPicHearAudio): play word audio, then after duration re-enable clicks.
//
// NO tracker increment (Malaysia is in NO_TRACKER_COUNTRIES).
// No win/lose state — this is a browsing/listening game.
// No syllable variant.
// No precompute.
```

=== JAVA: Myanmar.java ===
```java
// Myanmar: 7×7 word-search grid.
// 7 words are placed on the grid (3–7 tiles each); remaining cells filled with random non-vowel tiles.
// Player selects two cells; if the path between them (horizontal, vertical, diagonal) spells a word → found.
//
// challengeLevel controls directions allowed:
//   CL1: horizontal right + vertical down only
//   CL2: + diagonal (4 directions total)
//   CL3: + reverse (8 directions total)
//
// Selection method: selectionMethod read from settingsList.find("Selection Method for Word Search")
//   Method 1 (classic): tap first cell, tap second cell → check span
//   Method 2 (stack): tap tiles one at a time in sequence; up to 8 tiles; auto-check after each tap
//
// On word found:
//   Color found tiles with cycling colorList color; show word in activeWordTextView.
//   wordsCompleted++; if wordsCompleted == completionGoal → win.
//   Win: setAdvanceArrowToBlue(); updatePointsAndTrackers(wordsCompleted); playCorrectSoundThenActiveWordClip(true).
//   clearImageFromImageBank(wordIndex) after audio completes.
//
// Words with no valid placement (after 100 attempts): excluded; completionGoal decremented.
// Word images (7 slots): each placed word shows its image in the image bank (right side).
//   clickPicHearAudio: tap image → show word text in activeWordTextView, play audio.
//
// 49 tile buttons (7×7 grid). Text sizes set proportionally to screen height.
// No precompute — words chosen at playAgain() time.
```

=== JAVA: Peru.java ===
```java
// Peru: 4-choice word recognition (image → choose correct word).
// Shows a word image; presents 4 word choices (text). Player picks the correct word.
//
// CL1: wrong answers have only first tile replaced (from distractor trio of tile[0])
// CL2: wrong answers have one random tile replaced by same-type tile (C/V/T/AD)
// CL3: wrong answers have one random tile replaced by a distractor of that tile
//
// Duplicate-check loop: regenerate wrong answers until all 4 choices are unique.
// Special filter: reject any answer containing "للہ" substring (Arabic ligature issue).
//
// Win: player taps correct word → updatePointsAndTrackers(2); playCorrectSoundThenActiveWordClip(false); gray out wrong.
// Wrong: playIncorrectSound(); track incorrect answer.
//
// Image: word image (wordInLWC) displayed via wordImage view; also clickable to repeat audio.
// No syllable variant.
// No precompute needed.
```

=== JAVA: Sudan.java ===
```java
// Sudan: Tile/syllable audio browser (NOT a scored game).
// Displays tiles (or syllables if syllableGame="S") from the lang pack, paginated.
//
// Tile variant: cumulativeStageBasedTileList minus SAD and SILENT_PLACEHOLDER_CONSONANTS
//   Up to 63 tiles per page; type-colored (C=colorList[1], V=colorList[2], T=colorList[3], default=colorList[4])
//   Tap a tile: play tile audio; re-enable after audio duration.
//
// Syllable variant: syllableList, 35 per page; syllable color from syllable.color index.
//   Tap a syllable: play syllable audio (only if hasSyllableAudio is true).
//
// Pagination: next/prev arrows; hidden when at start/end.
//
// NO tracker increment (Sudan is in NO_TRACKER_COUNTRIES).
// No win/lose state — this is a browsing/listening game.
// No precompute.
```

---

## Your task

Generate the 5 OpenSpec artifacts for each of the 10 games listed above (brazil, colombia, ecuador, georgia, iraq, italy, malaysia, myanmar, peru, sudan).

**Guidelines for each game:**

1. **proposal.md**: 1–2 paragraphs. What the game is, what changes (new lib + route). Keep under 300 words.

2. **design.md**: The substantive spec. Must include:
   - Context section (what Java class does, any required reading note pointing to game-engine-base)
   - Goals / Non-Goals
   - Decisions section with a Java → TS mapping table (D1) and any other key decisions
   - Testing strategy table

3. **tasks.md**: Numbered checklist. Always has: 0-Preflight, 1-Library Scaffold, 2-Pure Logic (if any), 3-Presenter, 4-Container, 5-Verification. Adjust sections as needed for the game's complexity.

4. **specs/<name>/spec.md**: BDD-style capability spec. Use GIVEN/WHEN/THEN scenarios for the key behaviors. Cover win condition, wrong-answer behavior, challenge level variation, and NO_TRACKER guard for Iraq/Malaysia/Sudan.

5. **.openspec.yaml**: Use the Chile example format. `status: done` for all artifacts. `apply.status: pending`.

**Special notes:**
- Iraq, Malaysia, Sudan are NO_TRACKER_COUNTRIES. Their specs must note this — no `updatePointsAndTrackers` call, and their spec.md requirements should reflect the exploration/reference nature.
- Colombia's `updatePointsAndTrackers(4)` and Italy's `updatePointsAndTrackers(4)` — spec these as-is (4 points).
- Ecuador's `updatePointsAndTrackers(2)` and Peru's `updatePointsAndTrackers(2)` — spec as-is.
- For games with `syllableGame="S"` variants (Brazil, Colombia, Georgia, Sudan), the design.md D1 mapping table and tasks should cover both "T" and "S" variants.
- Myanmar's word-search has two selection methods controlled by a settings key — spec both.

Begin with game-brazil and work through all 10 in order.
