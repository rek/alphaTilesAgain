## Context

Chile.java is a classic Picture-to-Word identification game. It presents an image and four word buttons.

## Goals / Non-Goals

**Goals:**
- Port Chile identification mechanic.
- 1 correct word image + 4 word choices.
- Proper distractor selection (must be distinct from the correct word).
- Use `GameShellContainer`.

## Decisions

### D1. Java surface → TS artifact mapping

| Java symbol | TS destination | Notes |
|---|---|---|
| `public class Chile extends GameActivity` | `ChileContainer.tsx` | |
| `Word refWord` | `refWord` state | The correct word (image shown) |
| `Word[] choices` | `choices` state | 4 words (1 correct + 3 distractors) |
| `onBtnClick` | `onChoicePress` handler | |

### D2. Distractor Selection

Uses `util-stages.selectWordForStage` for the `refWord`.
Distractors are picked from the same stage or cumulative stages, excluding the `refWord`.

### D3. Container / Presenter Split

**`<ChileContainer>`**
- Manages `refWord` and `choices`.
- Shuffles choices so the correct one isn't always in the same spot.
- Handles `onChoicePress`:
    - Correct: `shell.incrementPointsAndTracker(1)`, play correct sound, move to next round.
    - Incorrect: `shell.playIncorrect()`, provide visual feedback (e.g. gray out).

**`<ChileScreen>`**
- Renders the image of `refWord`.
- Renders 4 `<Tile>` components with word text.

## Unresolved Questions

- **Audio Prompt**: Does Chile also play the word audio on start? (In Java, yes, usually in `playAgain`). We will trigger `shell.replayWord(refWord)` in a `useMountEffect` and on new rounds.
