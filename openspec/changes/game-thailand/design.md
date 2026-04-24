## Context

Thailand.java is a multiple-choice game mechanic. It is highly parameterized via its 3-digit `challengeLevel` code, allowing it to function as several different sub-games (e.g., Image-to-Word, Audio-to-Tile, Word-to-Word).

This change establishes the pattern for multiple-choice games in the port, utilizing `feature-game-shell` for shared UI and logic.

### Required reading for implementers

- `AGENTS.md` — entry doc; read first.
- `docs/ARCHITECTURE.md` §3 (taxonomy), §11 (container/presenter), §14 (game taxonomy).
- `openspec/changes/archive/2026-04-24-game-china/design.md` — for the sliding-tile exemplar.
- `openspec/changes/archive/2026-04-24-game-engine-base/design.md` — provides `<GameShellContainer>`.

## Goals / Non-Goals

**Goals:**

- Port `Thailand.java` mechanic faithfully: 3-digit `challengeLevel` decoding, multiple-choice grid, correct/incorrect handling.
- Support all three Reference Types: Audio (1), Image (2), Word (3).
- Support both Choice Types: Tiles (1), Words (2).
- Support variable number of choices: 2, 4, 6, or 8.
- Compose with `feature-game-shell` via the `children` slot.

**Non-Goals:**

- Syllable-mode choices (ChoiceType 3) — deferred.
- Custom animations for choice selection.
- Unit testing the full React tree.

## Decisions

### D1. Java surface → TS artifact mapping (Thailand.java)

| Java symbol | TS destination | Notes |
|---|---|---|
| `public class Thailand extends GameActivity` | `feature-game-thailand/src/ThailandContainer.tsx` | |
| `int difficulty`, `refType`, `choiceType` | `useThailandGameState()` hook | Decoded from `challengeLevel` |
| `Word refWord` | `shell.setRefWord` | Managed by shell context |
| `ArrayList<Word> choices` | `choices: Word[]` state | 1 correct + N-1 distractors |
| `playAgain()` | `startRound()` function | Resets state, chooses new words/tiles |
| `respondToSelection(int selection)` | `onChoicePress(index)` handler | Checks against `refWord` |

### D2. Challenge-level decoding

The 3-digit `challengeLevel` (e.g., `212`) is decoded as:

```ts
const difficulty = Math.floor(challengeLevel / 100); // 1, 2, 3, or 4
const refType = Math.floor((challengeLevel % 100) / 10); // 1, 2, or 3
const choiceType = challengeLevel % 10; // 1 or 2
```

- **Difficulty** (Number of choices): `1 -> 2`, `2 -> 4`, `3 -> 6`, `4 -> 8`.
- **RefType** (Prompt): `1 -> Audio`, `2 -> Image`, `3 -> Word`.
- **ChoiceType** (Options): `1 -> Tiles`, `2 -> Words`.

### D3. Distractor Selection

Distractors are chosen from the `cumulativeStageBasedWordList` or `cumulativeStageBasedTileList`.

- Must not include the `refWord`.
- Must be unique.
- If `choiceType === 1` (Tiles), distractors are `Tile` objects.
- If `choiceType === 2` (Words), distractors are `Word` objects.

### D4. Container / Presenter split

**`<ThailandContainer>`** — owns:
- `useGameShell()` for `refWord`, `incrementPointsAndTracker`, `interactionLocked`.
- `useThailandGameState()` logic.
- Decodes `challengeLevel`.
- Manages `choices` and `correctIndex`.

**`<ThailandScreen>`** — pure props → JSX:
- Renders the Prompt (Audio icon, Image, or Word).
- Renders a grid of Choices (Tiles or Words).
- Props: `prompt: { type: 'audio' | 'image' | 'word', value: string | ImageSource }`, `choices: Array<{ label: string, image?: ImageSource }>`, `onChoicePress: (i: number) => void`.

### D5. Route

`apps/alphaTiles/app/games/thailand.tsx` renders `<ThailandContainer>`.

## Testing strategy

| Area | Approach |
|---|---|
| Challenge decoding, Distractor selection | Jest unit tests |
| `ThailandContainer` | Manual QA against `engEnglish4` |
| `ThailandScreen` | Storybook stories for combinations of RefType and ChoiceType |
