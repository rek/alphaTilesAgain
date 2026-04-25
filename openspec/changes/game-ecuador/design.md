## Context

`Ecuador.java` shows 8 word tiles scattered randomly on the screen and a prompt (word text + image). Player taps the matching tile. No CL/syllable variation. Random non-overlapping placement is the trickiest part of the port.

### Required reading for implementers

- `AGENTS.md`, `openspec/AGENT_PROTOCOL.md`.
- `docs/ARCHITECTURE.md` §3, §11, §13.
- `docs/decisions/ADR-010-testing-storybook-plus-unit.md`.
- **Upstream OpenSpec changes:** `game-engine-base` (merged).
- **Source Java files:** `Ecuador.java`.

## Goals / Non-Goals

**Goals:**
- 8 random scatter tiles with non-overlapping placement.
- Correct/incorrect feedback per Java mechanic (2 points on win).
- Container/Presenter split; i18n-blind presenter.

**Non-Goals:**
- Pixel-perfect parity with Java placement RNG.
- Challenge-level differentiation; precompute; syllable variant.

## Decisions

### D1. Java surface → TS artifact mapping

| Java symbol | TS destination | Notes |
|---|---|---|
| `cumulativeStageBasedWordList` | `wordPool: Word[]` from `useLangAssets()` | Filtered by current stage |
| `refWord` | `prompt: Word` state | The word to find |
| `tile placements` (random x/y/width) | `tiles: ScatterTile[]` state | Computed at round start |
| `clickedTileText` | `onTilePress(text)` handler | |
| `playCorrectSoundThenActiveWordClip(false)` | `playCorrectThenWord()` | |
| `playIncorrectSound()` | `playIncorrect()` | |
| `updatePointsAndTrackers(2)` | `incrementPointsAndTracker(2)` | On correct only |

### D2. Scatter Placement Algorithm

```ts
type ScatterTile = { word: string; x: number; y: number; width: number; height: number };

function placeTiles(
  count: number,
  area: { width: number; height: number },
  rng: () => number,
  config: { minWidth: number; maxWidth: number; tileHeight: number }
): ScatterTile[] | null {
  // Up to 10000 attempts per tile.
  // For each tile: pick random width in [minWidth, maxWidth], then random x/y; reject if overlaps any prior tile.
  // If all 10000 fail for any tile -> return null (caller restarts entire placement).
}
```

Container: retry `placeTiles` until it succeeds (Java's outer "restart if still fails" loop).

### D3. Tile Pool Sampling

```ts
function pickRound(words: Word[], rng: () => number): { prompt: Word; otherSeven: Word[] } {
  const shuffled = shuffle(words, rng);
  const prompt = shuffled[0];
  const otherSeven = shuffled.slice(1, 8).filter(w => w !== prompt);
  // Place all 8 (prompt + 7 distractors); one tile slot will display the prompt's wordInLOP (stripped).
  return { prompt, otherSeven };
}
```

Tile order is itself shuffled so the correct tile's grid position is random.

### D4. Word Display

- Prompt image: `<wordInLWC>2.png` (variant-2 image).
- Tile text: `wordInLOP` stripped of instruction characters (Java `stripInstructionChars`).

### D5. Container / Presenter Split

**`<EcuadorContainer>`** — owns:
- `useGameShell()`, `useLangAssets()`, `useAudio()`, `useProgress()`.
- State: `prompt`, `tiles`, `disabled`, `wrongPicks`.
- Handlers: `onTilePress`, `onPlayAgain`, `onRepeat`.

**`<EcuadorScreen>`** — pure props → JSX:
- `promptImage: ImageSource`, `tiles: ScatterTile[]`, `grayed: Set<string>`, `onPress(text)`, `onRepeat()`.
- No hooks; no i18n.

## Testing strategy

| Area | Approach |
|---|---|
| `placeTiles` non-overlap invariant | Jest unit — fuzz with seeded RNG |
| `pickRound` (no duplicates, prompt present) | Jest unit |
| `EcuadorContainer` | Manual QA on `engEnglish4` |
| `EcuadorScreen` | Storybook stories: fresh round, wrong tap (some grayed), won state |
