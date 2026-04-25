# Capability: Georgia Game (First Sound)

Georgia is a first-sound identification game. Player taps the tile (or syllable) that begins the prompt word from a 6/12/18-grid of choices. Variants tune choice count, distractor difficulty, and "first sound" interpretation.

## Requirements

### R1. Choice Count by Challenge Level

Visible choice count MUST follow `countForLevel(level)`:
- `level mod 3 === 1` → 6 choices.
- `level mod 3 === 2` → 12 choices.
- `level mod 3 === 0` → 18 choices.

#### Scenario: CL1 has 6 choices
- **GIVEN** challengeLevel=1
- **WHEN** the round starts
- **THEN** 6 choices are visible

#### Scenario: CL12 has 18 choices
- **GIVEN** challengeLevel=12
- **WHEN** the round starts
- **THEN** 18 choices are visible

### R2. Correct Tile per Band

For tile variant:
- **CL1–6**: `correct` MUST equal `parsedTiles[0]`.
- **CL7–12**: `correct` MUST equal the first tile in `parsedTiles` whose `typeOfThisTileInstance` is not `LV`. If `parsedTiles[0]` is `PC`, `correct` MUST be the LV that immediately preceded it.

For syllable variant (CL1–6, S):
- `correct` MUST equal `parsedSyllables[0]`.

#### Scenario: CL7 skips leading LV
- **GIVEN** parsedTiles = ["LV-tile", "C-tile", "V-tile"] in CL7
- **WHEN** correct is computed
- **THEN** correct == "C-tile"

### R3. Pool Composition by Band

- **Easy bands** (CL1–3, CL7–9 tile; CL1–3 syllable): N random entries drawn from the appropriate pool (`corV` for tiles, `syllableList` for syllables). The correct entry MUST be present in the pool.
- **Hard bands** (CL4–6, CL10–12 tile; CL4–6 syllable): pool MUST include `correct`, its distractor trio, and entries sharing the first characters with `correct`; truncated/padded to N.

### R4. Word Filter

The selected word MUST begin with a tile in the `CorV` list (consonant or vowel). If not, `chooseWord` MUST be retried.

### R5. Correct Answer

When the player taps the correct choice, the game MUST:
- Reveal the stripped word text.
- Call `incrementPointsAndTracker(1)`.
- Play correct sound followed by the active word clip.
- Set advance arrow to blue and gray out non-correct choices.

### R6. Wrong Answer

When the player taps a wrong choice, the game MUST play the incorrect sound and track the wrong answer. Choices remain tappable until correct.

### R7. Container / Presenter Split

`<GeorgiaContainer>` SHALL own all state and hook usage. `<GeorgiaScreen>` SHALL be a pure props→JSX presenter with no hooks and no `react-i18next` import.
