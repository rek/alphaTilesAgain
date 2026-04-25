# Capability: Peru Game (4-Choice Word Recognition)

Peru shows a word image and 4 word-text choices; the player picks the one that names the image. Wrong answers are produced by mutating the correct word; mutation strategy varies by `challengeLevel`.

## Requirements

### R1. Choice Count

Exactly 4 choices MUST be displayed: 1 correct + 3 wrong. The correct word's text MUST be among them.

### R2. Distractor Strategy by Challenge Level

Each wrong answer MUST be derived from the correct word's parsed tile array per CL:
- **CL1**: replace tile at index 0 with a tile drawn from the index-0 tile's distractor trio.
- **CL2**: replace one randomly chosen tile with another tile of the same type (`C`/`V`/`T`/`AD`).
- **CL3**: replace one randomly chosen tile with a tile drawn from that tile's distractor trio.

#### Scenario: CL1 mutates only the first tile
- **GIVEN** correct word parses to ["c","a","t"] in CL1
- **WHEN** a wrong answer is generated
- **THEN** the wrong answer's tiles equal ["x","a","t"] for some x ≠ "c" drawn from the distractor trio of "c"

### R3. Uniqueness Invariant

The 4 choices MUST all be distinct. If a generated wrong answer collides with `correct` or another wrong answer, generation MUST repeat until the set of 4 is unique.

### R4. Forbidden Substring Filter

Any candidate wrong answer containing the substring `"للہ"` MUST be rejected and regenerated.

### R5. Correct Answer

When the player taps a choice whose text equals `correct`, the game MUST:
- Gray out the 3 non-correct choices.
- Call `incrementPointsAndTracker(2)`.
- Play correct sound followed by the active word clip.
- Set advance arrow to blue.

### R6. Wrong Answer

When the player taps a non-correct choice, the game MUST play the incorrect sound and track the wrong answer. Choices remain tappable for retry until correct.

### R7. Image Tap Repeats Audio

Tapping the word image MUST replay the active word clip.

### R8. No Syllable Variant

The mechanic MUST NOT vary with `syllableGame`. There is no syllable mode and no precompute.

### R9. Container / Presenter Split

`<PeruContainer>` SHALL own all state and hook usage. `<PeruScreen>` SHALL be a pure props→JSX presenter with no hooks and no `react-i18next` import.
