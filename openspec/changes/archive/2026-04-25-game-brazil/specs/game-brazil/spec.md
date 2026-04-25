## ADDED Requirements

### Requirement: Choice Pool by Challenge Level

The Brazil mechanic SHALL build the row of selectable tiles based on `challengeLevel` and `syllableGame`. Visible-button counts and source pools follow the table below; pools are loaded once at boot via the `'brazil'` precompute.

| CL | `syllableGame` | Pool | Visible count |
|---|---|---|---|
| 1 | T | random vowels | 4 |
| 2 | T | correct + distractor trio (vowel) | 4 |
| 3 | T | all vowels | min(vowels, 15) |
| 4 | T | random consonants | 4 |
| 5 | T | correct + distractor trio (consonant) | 4 |
| 6 | T | all consonants | min(consonants, 15) |
| 7 | T | tones | min(tones, 4) |
| 1 | S | random syllables | 4 |
| 2 | S | correct + syllable distractor trio | 4 |

#### Scenario: CL1 shows 4 vowel choices including the correct one
- **GIVEN** challengeLevel=1 and syllableGame="T" and the blanked tile is a vowel "a"
- **WHEN** the round starts
- **THEN** 4 tile choices are visible
- **AND** one of them is "a"
- **AND** the other three are vowels drawn from the VOWELS pool

#### Scenario: CL3 shows up to 15 vowels
- **GIVEN** challengeLevel=3 and the language pack has 20 vowel tiles
- **WHEN** the round starts
- **THEN** exactly 15 vowel choices are visible
- **AND** the correct vowel is among them

#### Scenario: CL7 with only 2 tone tiles hides extra slots
- **GIVEN** challengeLevel=7 and TONES has 2 entries
- **WHEN** the round starts
- **THEN** 2 tone tile buttons are visible
- **AND** the remaining tile slots are hidden

### Requirement: Word Filter by Required Tile Type

The selected reference word SHALL contain at least one tile of the type required by the challenge level: vowel for CL1–3, consonant for CL4–6, tone for CL7. Word selection retries until the constraint is met (or `maxAttempts` is reached).

#### Scenario: CL7 retries until a word with a tone tile is found
- **GIVEN** challengeLevel=7
- **WHEN** the picker returns a word with no tone tile
- **THEN** the picker re-runs until a word containing a tone tile is found

### Requirement: Blank Tile Selection

`removeTile` SHALL blank exactly one tile in the parsed word array, picked at random from tiles whose type matches the challenge level (vowel/consonant/tone), and SHALL never blank a SAD tile. The replacement string is `"__"` for Roman scripts, `"​"` (zero-width space) when `scriptType === "Khmer"` and the next tile is `V|AV|BV|D`, and `placeholderCharacter` for Khmer (other contexts) and Thai/Lao when blanking a consonant.

#### Scenario: SAD tiles are excluded from blanking
- **GIVEN** a word whose first tile is SAD
- **WHEN** `removeTile` runs
- **THEN** the SAD tile is NOT replaced with `"__"`

#### Scenario: Thai consonant blank uses placeholder character
- **GIVEN** `scriptType === "Thai"` and the chosen blank tile is type `C`
- **WHEN** `removeTile` runs
- **THEN** the blank tile text is `placeholderCharacter`, not `"__"`

#### Scenario: Khmer consonant before a vowel uses zero-width space
- **GIVEN** `scriptType === "Khmer"` and the chosen blank tile is type `C`, with the next tile of type `V`
- **WHEN** `removeTile` runs
- **THEN** the blank tile text is `"​"`

### Requirement: Correct Answer Reveals and Scores

When the player taps a choice whose text equals `correct.text`, the mechanic SHALL:
- Reveal the full word in `activeWordTextView`.
- Gray out the non-correct tile choices.
- Call `incrementPointsAndTracker(true)`.
- Play the correct sound followed by the active-word clip.
- Set the advance arrow to blue and unlock repeat.

#### Scenario: Correct tap reveals word and unlocks advance
- **GIVEN** a round in progress with `correct.text === "a"`
- **WHEN** the player taps a choice whose text is `"a"`
- **THEN** the full revealed word is shown in place of the partial tile row
- **AND** non-correct tile choices are grayed
- **AND** `incrementPointsAndTracker(true)` is called
- **AND** the advance arrow becomes blue

### Requirement: Wrong Answer Locks the Round

When the player taps a choice whose text does not equal `correct.text`, the mechanic SHALL play the incorrect sound, track the wrong answer (up to `visibleChoiceCount - 1` unique entries), and disable further tile picks. The advance arrow remains gray (locked); the next round begins on `playAgain()` (triggered by audio-completion or shell advance).

#### Scenario: Wrong tap disables remaining choices
- **GIVEN** a round in progress
- **WHEN** the player taps an incorrect tile
- **THEN** all tile choices become unclickable
- **AND** the incorrect sound plays
- **AND** the wrong answer is appended to the unique-tracker list

### Requirement: Syllable Variant Uses Syllable Pool

When `syllableGame === "S"`, the mechanic SHALL use syllables from `syllableList` instead of tiles. `visibleGameButtons` SHALL be 4 regardless of challenge level.

#### Scenario: SL1 picks 4 syllables and ensures correct is present
- **GIVEN** `syllableGame === "S"` and challengeLevel=1
- **WHEN** the round starts
- **THEN** 4 syllable choices are visible
- **AND** the correct syllable is among them

#### Scenario: SL2 builds correct + 3 distractors
- **GIVEN** `syllableGame === "S"` and challengeLevel=2
- **WHEN** the round starts
- **THEN** the 4 visible syllables are the correct one plus its 3 syllable distractors

### Requirement: Container / Presenter Split

`<BrazilContainer>` SHALL own all state, hooks (`useGameShell`, `useLangAssets`, `useAudio`, `usePrecompute`), and i18n. `<BrazilScreen>` SHALL be a pure props→JSX presenter with no hooks and no `react-i18next` import.

#### Scenario: Presenter is hook-free
- **WHEN** `<BrazilScreen>` is rendered
- **THEN** the rendered output is determined entirely by props
- **AND** the file does not import `react-i18next` or any hook from `@alphaTiles/feature-game-shell`
