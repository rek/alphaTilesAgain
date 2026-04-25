# Capability: Brazil Game (Find the Missing Tile)

Brazil is a multiple-choice tile-identification game. The player sees a word with one tile blanked and chooses the correct tile from a row of options. Variants cover vowels, consonants, tones, and syllables, controlled by `challengeLevel` and `syllableGame`.

## Requirements

### R1. Choice Pool by Challenge Level

The choice pool MUST match the challenge level:

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

### R2. Word Filter by Required Tile Type

The selected word MUST contain at least one tile of the type required by the challenge level (vowel for CL1–3, consonant for CL4–6, tone for CL7). If not, another word MUST be chosen.

#### Scenario: CL7 retries until a word with a tone tile is found
- **GIVEN** challengeLevel=7
- **WHEN** `chooseWord` returns a word with no tone tile
- **THEN** the game re-runs `chooseWord` until a word containing a tone tile is found

### R3. Blank Tile Selection

`removeTile` MUST blank exactly one tile in the parsed word array, picked at random from tiles whose type matches the challenge level (vowel/consonant/tone), and MUST never blank a SAD tile. The replacement string is `"__"` for Roman scripts, `"​"` (zero-width space) when `scriptType === "Khmer"` and the next tile is `V|AV|BV|D`, and `placeholderCharacter` for Khmer (other contexts) and Thai/Lao when blanking a consonant.

#### Scenario: SAD tiles are excluded from blanking
- **GIVEN** a word whose first tile is SAD
- **WHEN** `removeTile` runs
- **THEN** the SAD tile is NOT replaced with `"__"`

#### Scenario: Thai consonant blank uses placeholder character
- **GIVEN** `scriptType === "Thai"` and the chosen blank tile is type `C`
- **WHEN** `removeTile` runs
- **THEN** the blank tile text is `placeholderCharacter`, not `"__"`

### R4. Correct Answer

When the player taps a choice whose text equals `correct.text`, the game MUST:
- Reveal the full word in `activeWordTextView`.
- Gray out the non-correct tile choices.
- Call `incrementPointsAndTracker(1)`.
- Play correct sound followed by the active word clip.
- Set advance arrow to blue and unlock repeat.

### R5. Wrong Answer

When the player taps a choice whose text does not equal `correct.text`, the game MUST play the incorrect sound, track the wrong answer (up to N-1 unique entries), and disable further tile picks. The advance arrow remains gray (locked); the next round begins on `playAgain()` (triggered by audio-completion or shell advance).

#### Scenario: Wrong tap disables remaining choices
- **GIVEN** a round in progress
- **WHEN** the player taps an incorrect tile
- **THEN** all tile choices become unclickable
- **AND** the incorrect sound plays
- **AND** the wrong answer is appended to the unique-tracker list

### R6. Syllable Variant

When `syllableGame === "S"`, the game MUST use syllables from `syllableList` instead of tiles. `visibleGameButtons` MUST be 4 regardless of challenge level.

### R7. Container / Presenter Split

`<BrazilContainer>` SHALL own all state and hook usage. `<BrazilScreen>` SHALL be a pure props→JSX presenter with no hooks and no `react-i18next` import.
