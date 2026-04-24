## Context

Mexico.java (393 LOC) is the second concrete game ported. It's a Matching/Memory game where players find pairs of word-text and word-image cards. The grid size scales from 6 cards (3 pairs) to 20 cards (10 pairs) based on the challenge level.

This change follows the pattern established by `game-china`, utilizing `feature-game-shell` and the `util-precompute` registry. Mexico is the exemplar for "Matching" mechanics that will be used by other games with different content pairings.

### Required reading for implementers

- `AGENTS.md` — entry doc; read first.
- `openspec/AGENT_PROTOCOL.md` — pickup protocol.
- `docs/ARCHITECTURE.md` §3 (taxonomy), §11 (container/presenter), §13 (routing).
- `docs/decisions/ADR-010-testing-storybook-plus-unit.md`.
- **Upstream OpenSpec changes:**
  - `game-engine-base` (merged)
  - `game-china` (merged) — as the first concrete game example.
- **Source Java files being ported:**
  - `Mexico.java` (~393 LOC) — the mechanic being ported.
  - `GameActivity.java` — for inherited behavior.
  - `Mexico.java:86–106` — level scaling logic.
- **Fixture paths:**
  - `aa_wordlist.txt` — source of words.
  - `aa_games.txt` — Mexico doors.
  - `res/drawable/<word>.png` — word images.
  - `res/raw/<word>.mp3` — word audio.

## Goals / Non-Goals

**Goals:**
- Port `Mexico.java` faithfully: Scaling grid size (3, 4, 6, 8, 10 pairs), text-to-image matching.
- Register a precompute that identifies words with both image and audio.
- Use `feature-game-shell` for points, trackers, audio playback, and win celebration.
- Maintain Container/Presenter split and i18n-blind UI.

**Non-Goals:**
- Other matching variants (Audio-to-Image, etc.) — deferred.
- Flipping animations — v1 uses instant state-based reveal.

## Decisions

### D1. Java surface → TS artifact mapping (Mexico.java, 393 lines)

| Java symbol | TS destination | Notes |
|---|---|---|
| `public class Mexico extends GameActivity` | `feature-game-mexico/src/MexicoContainer.tsx` | |
| `ArrayList<String[]> memoryCollection` | `cards: CardState[]` state in container | |
| `int justClickedCard`, `priorClickedCard` | `firstCardIndex: number \| null`, `secondCardIndex: number \| null` | |
| `int activeSelections` | inferred from `firstCardIndex` / `secondCardIndex` | |
| `int pairsCompleted` | `pairsCompleted: number` state | |
| `int visibleGameButtons` | `pairCount` derived from `challengeLevel` | |
| `onCreate(Bundle)` | Container mount + `startRound()` | |
| `playAgain()` / `repeatGame()` | `startRound()` handler | |
| `chooseMemoryWords()` | `chooseMexicoWords(validWords, pairCount, rng)` helper | `validWords` from precompute |
| `respondToCardSelection()` | `onCardPress(index)` handler | |
| `respondToTwoActiveCards()` | logic inside `onCardPress` or `useEffect` (on `secondCardIndex`) | |
| `resetAfterIncorrectGuess()` | Timeout to clear `firstCardIndex`/`secondCardIndex` and flip cards back | |
| `updatePointsAndTrackers(pairCount)` | `shell.incrementPointsAndTracker(pairCount)` on win | |

### D2. Challenge-level decoding

`Mexico.java:86–106` maps `challengeLevel` to pair count:
- `1` → 3 pairs (6 cards) - Default
- `2` → 4 pairs (8 cards)
- `3` → 6 pairs (12 cards)
- `4` → 8 pairs (16 cards)
- `5` → 10 pairs (20 cards)

### D3. Precompute: Valid Matching Words

Mexico needs words that have both a `.png` and an `.mp3`.
`buildMexicoData` will filter `wordList` into `validMatchingWords`.

### D4. Card State

```ts
type CardMode = 'TEXT' | 'IMAGE';
type CardStatus = 'HIDDEN' | 'REVEALED' | 'PAIRED';

interface CardState {
  word: Word;
  mode: CardMode;
  status: CardStatus;
}
```

### D5. Board Setup

1. Pick `pairCount` random words from `validMatchingWords`.
2. For each word, create two cards: `{ word, mode: 'TEXT' }` and `{ word, mode: 'IMAGE' }`.
3. Shuffle the list of `2 * pairCount` cards.

### D6. Match Check Delay

Java uses 800ms for "quickViewDelay" and a configurable `flipCardsBackOver` delay (defaulting to 0 or setting-based). 
We will use:
- `REVEAL_DELAY = 800ms` (time showing the second card before checking match).
- `FLIP_BACK_DELAY = 1200ms` (if no match, stay revealed for this long before flipping back).

## Unresolved Questions

- **Grid Layout**: How to arrange 6, 8, 12, 16, 20 cards optimally?
  - 6: 2x3 or 3x2
  - 8: 2x4
  - 12: 3x4
  - 16: 4x4
  - 20: 4x5 or 5x4
  The presenter should use a flexible grid that wraps based on available width.
