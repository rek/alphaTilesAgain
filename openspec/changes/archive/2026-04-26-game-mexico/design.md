## Context

`Mexico.java` (393 LOC) is a Matching/Memory game where players find pairs of word-text and word-image cards. Grid scales from 6 cards (3 pairs) to 20 cards (10 pairs) by `challengeLevel`.

This change follows `game-china`, uses `feature-game-shell` and the `util-precompute` registry. Mexico is the exemplar for "Matching" mechanics.

### Required reading for implementers

- `AGENTS.md`, `openspec/AGENT_PROTOCOL.md`.
- `docs/ARCHITECTURE.md` §3, §11, §13.
- `docs/decisions/ADR-010-testing-storybook-plus-unit.md`.
- **Upstream OpenSpec changes:** `game-engine-base` (merged), `game-china` (merged).
- **Source Java files:** `Mexico.java` (393 LOC), `GameActivity.java`, `Start.java` (for `lwcWordHashMap`, `colorList`, `settingsList`).

## Goals / Non-Goals

**Goals:**
- Port `Mexico.java` faithfully across the 5 challenge levels (3/4/6/8/10 pairs).
- Match Java's exact reveal/flip-back timings (800ms reveal, settings-driven flip-back default 0).
- Match Java's points awarded on win = pair count (Java line 324-325 `updatePointsAndTrackers((visibleGameButtons / 2))`), NOT a boolean.
- Container/Presenter split; i18n-blind presenter.

**Non-Goals:**
- Other matching variants (audio-to-image, audio-to-text) — deferred future doors.
- Card flipping animations — v1 uses instant state-based reveal (Java is also instant).

## Decisions

### D1. Java surface → TS artifact mapping (Mexico.java, 393 lines — line numbers verified against upstream)

| Java symbol (line) | TS destination | Notes |
|---|---|---|
| `class Mexico extends GameActivity` (21) | `<MexicoContainer>` wrapping `<GameShellContainer>` | |
| `ArrayList<String[]> memoryCollection` (23) | `cards: CardState[]` state | array of `{ word, mode, status }` |
| `int justClickedCard, priorClickedCard` (24-25) | `firstCardIndex / secondCardIndex` | |
| `int activeSelections` (26) | derived from `firstCardIndex/secondCardIndex` | |
| `int pairsCompleted` (27) | `pairsCompleted` derived from cards in `PAIRED` status | |
| `int visibleGameButtons` (line 92-105) | `pairCount * 2` derived from `challengeLevel` | |
| `onCreate(Bundle)` (66-115) | `useMountEffect(playAgain)` in container | Calls `updatePointsAndTrackers(0)` then `playAgain()` |
| `playAgain()` (130-143) | `startRound()` callback | Resets selections + counters + shuffles |
| `chooseMemoryWords()` (162-217) | `chooseMexicoWords(validWords, pairCount, rng)` helper | Dedup by `wordInLWC`; sanity counter `> cardsToSetUp*3` returns insufficient-content |
| `Collections.shuffle(memoryCollection)` (137) | `shuffle(deck, rng)` | Shuffle full 2N-card deck |
| `setCardTextToEmpty()` (145-159) | initial `CardState[]` build | All cards start `HIDDEN` |
| `respondToCardSelection()` (219-265) | logic in `onCardPress(index)` | See D5 — handles paired/same-card no-ops |
| `respondToTwoActiveCards()` (267-343) | runs after `REVEAL_DELAY` (800ms) | Match check + audio + flip-back schedule |
| `resetAfterIncorrectGuess()` (359-370) | flips both selected cards back to `HIDDEN` | |
| `updatePointsAndTrackers((visibleGameButtons / 2))` (325) | `shell.incrementPointsAndTracker(true)` on win | Java passes integer pair count; shell normalizes to `(isCorrect: boolean)` and increments points internally — see Decision D7 |
| `playCorrectSoundThenActiveWordClip(boolean isFinal)` (329) | `audio.playCorrect().then(() => audio.playWord(...))` | `isFinal === true` on last pair triggers final/celebration |
| `clickPicHearAudio` (380) | `onCardPress` for revealed cards (no separate handler in Mexico) | |

### D2. Challenge-level decoding

`Mexico.java:91-106` switch maps `challengeLevel` → pair count:

- `1` (default branch) → 3 pairs (6 cards)
- `2` → 4 pairs (8 cards)
- `3` → 6 pairs (12 cards)
- `4` → 8 pairs (16 cards)
- `5` → 10 pairs (20 cards)

Any unknown value falls into the `default` branch ⇒ 6 cards.

### D3. Precompute: Valid Matching Words

Mexico needs words that have both a `.png` (drawable resolves) and an `.mp3` (`lwcWordHashMap.get(wordInLWC).duration > 0`).

`buildMexicoData(assets)` filters `wordList` into `validMatchingWords: Word[]`. Registered under key `'mexico'`.

### D4. Card State

```ts
type CardMode = 'TEXT' | 'IMAGE';
type CardStatus = 'HIDDEN' | 'REVEALED' | 'PAIRED';

interface CardState {
  word: Word;          // Word object (need wordInLWC for matching, wordInLOP for display)
  mode: CardMode;
  status: CardStatus;
}
```

### D5. Click-handling state machine

Per `Mexico.java:219-265 respondToCardSelection`:

1. `onCardPress(index)`:
   - If `cards[index].status === 'PAIRED'` → no-op (Java 222-227).
   - If `index === firstCardIndex && secondCardIndex === null` (same-card double-tap) → no-op (Java 229-233).
   - Else flip card to `REVEALED`. Increment `activeSelections`.
2. When `activeSelections === 2` → lock board, schedule match check after `REVEAL_DELAY = 800ms` (Java line 261-262).

### D6. Match check + audio + flip-back

Per `Mexico.java:267-343 respondToTwoActiveCards`:

```ts
async function checkMatch() {
  const a = cards[firstIdx], b = cards[secondIdx];
  if (a.word.wordInLWC === b.word.wordInLWC) {
    // Match: transition both to PAIRED, show stripped LOP, theme color = colorList[firstIdx % 5]
    setCards(cards.map((c, i) => i === firstIdx || i === secondIdx ? { ...c, status: 'PAIRED' } : c));
    const isFinal = (pairsCompleted + 1) === pairCount;
    if (isFinal) shell.incrementPointsAndTracker(true);   // Java passes pair count; shell maps to bool
    await audio.playCorrect();                            // chime
    if (!isMountedRef.current) return;
    await audio.playWord(a.word.wordInLWC);               // word clip
    if (isFinal) audio.playCorrectFinal();                // celebration on final pair
  } else {
    // Mismatch: read flip-back delay from settings, default 0
    const setting = assets.settings['View memory cards for _ milliseconds'];
    const flipBackDelay = setting && setting !== '' ? Number(setting) : 0;
    setTimeout(() => {
      setCards(cards.map((c, i) => i === firstIdx || i === secondIdx ? { ...c, status: 'HIDDEN' } : c));
      setFirstIdx(null); setSecondIdx(null);
    }, flipBackDelay);
  }
}
```

`REVEAL_DELAY = 800ms` (Java line 261-262 `postDelayed(quickViewDelay, 800L)`) — board locks after second reveal until this elapses, then `checkMatch` runs.

`FLIP_BACK_DELAY` reads from `assets.settings["View memory cards for _ milliseconds"]`. Default = **0** (Java line 332-336: `long delay = 0; if (!delaySetting.equals("")) delay = Long.valueOf(delaySetting);`). Note: this overrides the proposal.md draft's 1500ms guess.

### D7. Win scoring

Java line 324-325: `updatePointsAndTrackers((visibleGameButtons / 2))` passes the pair count (3/4/6/8/10) as the integer argument. The TS `shell.incrementPointsAndTracker(isCorrect: boolean)` signature instead handles point accrual internally; passing `true` once per round-completion is the shell's contract. Net behavior: Java awards `pairCount` points whereas the shell awards a fixed amount per win — this is a documented, accepted parity gap because `feature-game-shell` is the shared scoring authority and its API is `(boolean)`. If a future ADR re-introduces variable-points, Mexico's win handler should pass `pairCount`.

### D8. Insufficient-content fallback

Java sanity loop (line 209-214): if word-pick retries exceed `cardsToSetUp * 3` without filling the deck, Java logs a warning and calls `goBackToEarth(null)`. TS port renders an empty/locked `<MexicoScreen>` with an "insufficient content" message (mirrors china pattern).

### D9. Color cycling

`colorList.get(cardHitA % 5)` (Java line 307) — paired-card text color is the theme color cycled by the **first** matched card's index (`cardHitA`), modulo 5.

### D10. RTL handling

Container/screen do not flip layout manually. Logical props (`marginStart`, `gap`) are RTL-aware. Java's `fixConstraintsRTL` is N/A.

### D11. Container / Presenter Split

**`<MexicoContainer>`** (wraps `<GameShellContainer>`) → inner `<MexicoGame>`:
- Hooks: `useGameShell`, `useLangAssets`, `useAudio`, `usePrecompute('mexico')`.
- State: `cards: CardState[]`, `firstIdx: number | null`, `secondIdx: number | null`, `error: 'insufficient-content' | null`.
- Refs: `isMountedRef`, `revealTimerRef`, `flipBackTimerRef`.
- Handlers: `onCardPress(index)`, `startRound()`.
- `useMountEffect`: kickoff `startRound()`; register `shell.setOnAdvance(startRound)`; cleanup on unmount cancels both timers.

**`<MexicoScreen>`** — pure props → JSX:
- Props: `cards: { mode; status; text?; imageSrc?; theme?: string }[]`, `pairCount`, `interactionLocked`, `onCardPress(i)`.
- Responsive grid (3x2/2x4/3x4/4x4/4x5 depending on pair count).
- No hooks beyond `useWindowDimensions`; no i18n.

## Unresolved Questions

1. **Grid layout per pair count.** Presenter uses a flexible wrap grid. Confirm the visual designer wants 3x2 vs 2x3 for level 1, 4x5 vs 5x4 for level 5.
2. **Win-points parity gap (D7).** Should we extend `feature-game-shell` API to accept `(isCorrect: boolean, points?: number)` so Mexico can award variable points? Punted to future ADR.
3. **Flip-back of 0ms is jarring.** Java default of 0ms means cards flip instantly on mismatch. UX may want a hardcoded minimum (e.g. 600ms) regardless of settings — defer to QA feedback.
