# Capability: Thailand Game

Thailand is a fixed 4-choice identification game where a reference item (tile, word, or syllable — in text, image, or audio form) is matched to one of four choice buttons.

## Requirements

### R1. Challenge Level Decoding

The game MUST decode the 3-digit `challengeLevel` using the TYPES enum:

```
TYPES = [TILE_LOWER, TILE_UPPER, TILE_AUDIO, WORD_TEXT, WORD_IMAGE, WORD_AUDIO, SYLLABLE_TEXT, SYLLABLE_AUDIO]
```

- Hundreds digit → `distractorStrategy` (1=random, 2=phonetically-similar, 3=same-initial-tile)
- Tens digit → `refType` (1-indexed into TYPES)
- Units digit → `choiceType` (1-indexed into TYPES)

#### Scenario: Decoding CL 235
- **GIVEN** challengeLevel is 235
- **THEN** distractorStrategy is 2 (phonetically-similar distractors)
- **AND** refType is TYPES[2] = TILE_AUDIO
- **AND** choiceType is TYPES[4] = WORD_IMAGE

### R2. Always 4 Choices

The game MUST always display exactly 4 choices (1 correct + 3 distractors), regardless of challengeLevel.

#### Scenario: Choice count is always 4
- **GIVEN** any valid challengeLevel
- **WHEN** a round is set up
- **THEN** exactly 4 choice buttons are displayed

### R3. Reference Item Display

The reference item MUST be rendered according to `refType`:
- `TILE_LOWER` / `TILE_UPPER` / `WORD_TEXT` / `SYLLABLE_TEXT` → show as styled text
- `WORD_IMAGE` → show as image
- `TILE_AUDIO` / `WORD_AUDIO` / `SYLLABLE_AUDIO` → show audio icon; plays on render

#### Scenario: WORD_IMAGE reference
- **GIVEN** refType is WORD_IMAGE
- **WHEN** a round starts
- **THEN** the reference area shows the word's image (not text)
- **AND** the word audio plays automatically

### R4. Correct Selection

Selecting the correct choice MUST call `updatePointsAndTrackers(1)`, highlight the correct button in `refColor`, and play the correct sound followed by the reference audio.

#### Scenario: Correct tile selected
- **GIVEN** refType is TILE_AUDIO and the correct tile "ba" is in choices
- **WHEN** user selects "ba"
- **THEN** `updatePointsAndTrackers(1)` is called
- **AND** correct sound plays, then tile audio for "ba" plays

### R5. Incorrect Selection

Selecting an incorrect choice MUST play the incorrect sound. The choice remains selectable (no locking).

#### Scenario: Wrong word selected
- **GIVEN** the correct word is "apple" and user selects "banana"
- **WHEN** user taps "banana"
- **THEN** incorrect sound plays
- **AND** all 4 buttons remain tappable

### R6. Reference Audio Replay

Tapping the reference item MUST replay its audio (tile clip, word clip, or syllable clip as appropriate).

#### Scenario: Tap audio icon replays tile audio
- **GIVEN** refType is TILE_AUDIO
- **WHEN** user taps the reference area
- **THEN** the tile audio plays again

### R7. Container / Presenter split

`<ThailandContainer>` SHALL own all hooks and decoding logic. `<ThailandScreen>` SHALL be a pure props→JSX presenter.

#### Scenario: Presenter audit
- **WHEN** `ThailandScreen.tsx` is inspected
- **THEN** it contains no `useGameShell`, `useLangAssets`, or `useTranslation` calls
