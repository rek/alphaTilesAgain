## Context

`Colombia.java` is a tile-keyboard word-builder. Player taps tiles to spell the prompted word; live colour feedback signals correctness; delete removes last keyed tile. Mechanic varies by `challengeLevel` (1–4) and `syllableGame` ("T"/"S").

### Required reading for implementers

- `AGENTS.md`, `openspec/AGENT_PROTOCOL.md`.
- `docs/ARCHITECTURE.md` §3, §11, §13.
- `docs/decisions/ADR-010-testing-storybook-plus-unit.md`.
- **Upstream OpenSpec changes:** `game-engine-base` (merged).
- **Source Java files:** `Colombia.java` — full mechanic. `KeyAdapter.java` / `Start.java` (`KEYBOARD` parsing).

## Goals / Non-Goals

**Goals:**
- Port all 4 CL × 2 variant configurations of the keyboard.
- Live partial-correctness colouring (yellow/orange/gray).
- Pagination for full-keyboard CL3/CL4.
- Container/Presenter split; i18n-blind presenter.

**Non-Goals:**
- Hard-mode requiring re-use of confirmed tiles.
- Audio prompts beyond standard correct/incorrect/word clip.

## Decisions

### D1. Java surface → TS artifact mapping

| Java symbol | TS destination | Notes |
|---|---|---|
| `String currentAttempt` | `attempt: string[]` state | Tile/syllable strings keyed so far |
| `String correctString` | derived from active `refWord` | |
| `parsedRefWordTileArray` / `parsedRefWordSyllableArray` | `parsedTarget: string[]` | |
| `ArrayList<String> keyboardKeys` | `keys: KeyTile[]` state | Keyboard tiles for the round |
| `int currentPage` | `page: number` state | For paginated keyboards |
| `setUpKeyboard()` | `buildKeyboard(level, variant, parsedTarget, distractors)` pure fn | Per-CL builder |
| `clickKey(view)` | `onKeyPress(text)` handler | Append to attempt |
| `clickDelete()` | `onDelete()` handler | Pop last from attempt |
| `paginateKeyboard()` | `onNextPage()` / `onPrevPage()` handlers | |
| `evaluateAttempt()` | `evaluateAttempt(attempt, target)` pure fn | Returns `'building' | 'wrong' | 'overlong' | 'win'` |
| `updatePointsAndTrackers(4)` | `incrementPointsAndTracker(4)` | On win |
| `playCorrectSoundThenActiveWordClip(false)` | `playCorrectThenWord()` | |
| `goBackToEarth()` | `useGameShell().goBackToCountryMenu()` | Used for S-CL4 unsupported |

### D2. Keyboard Builder per (variant, CL)

```ts
type KeyTile = { text: string; color: string; visible: boolean };

function buildKeyboard(
  level: 1|2|3|4,
  variant: 'T'|'S',
  parsedTarget: string[],
  pools: { fullKeyboard: string[]; tileList: string[]; allSyllables: string[]; distractorsFor: (k: string) => string[] }
): KeyTile[] {
  // T-CL1: shuffle(parsedTarget), unique
  // T-CL2: parsedTarget ∪ distractorsFor(t)[0] for each t, shuffle
  // T-CL3: pools.fullKeyboard
  // T-CL4: dedupe(pools.tileList), each tile type-coloured
  // S-CL1: shuffle(parsedTarget syllables), unique
  // S-CL2: parsedTarget ∪ syllableDistractor(t)[0] for each t, shuffle
  // S-CL3: pools.allSyllables
  // S-CL4: throw 'unsupported'
}
```

### D3. Pagination

```ts
const TILE_PAGE_SIZE = 33;        // T-CL3 when keys > 35
const SYLLABLE_PAGE_SIZE = 18;    // S-CL3
function pageOf(keys: KeyTile[], page: number, size: number): KeyTile[] { ... }
```

CL1/CL2 never paginate (single page).

### D4. Live Evaluation

```ts
type Status = 'idle' | 'building' | 'wrong' | 'overlong' | 'win';
function evaluateAttempt(attempt: string[], target: string[]): Status {
  if (attempt.length === 0) return 'idle';
  if (attempt.length > target.length) return 'overlong';
  for (let i = 0; i < attempt.length; i++) if (attempt[i] !== target[i]) return 'wrong';
  return attempt.length === target.length ? 'win' : 'building';
}
```

Background colour for the active-word display:
- `building` → yellow.
- `wrong` → orange.
- `overlong` → gray.
- `win` → default (game ends on win).

### D5. S-CL4 Unsupported

When `syllableGame === 'S'` and `challengeLevel === 4`, container MUST call `goBackToCountryMenu()` immediately and not render the screen. Java `goBackToEarth()` equivalent.

### D6. Container / Presenter Split

**`<ColombiaContainer>`** — owns:
- `usePrecompute('colombia')`, `useGameShell()`, `useLangAssets()`, `useAudio()`, `useProgress()`.
- State: `attempt`, `keys`, `page`, `status`, `refWord`.
- Handlers: `onKeyPress`, `onDelete`, `onNextPage`, `onPrevPage`, `onPlayAgain`, `onRepeat`.

**`<ColombiaScreen>`** — pure props → JSX:
- `displayWord: string`, `attempt: string[]`, `status: Status`, `keys: KeyTile[]`, `page`, `pageCount`, callbacks.
- No hooks.

## Testing strategy

| Area | Approach |
|---|---|
| `evaluateAttempt` (idle/building/wrong/overlong/win) | Jest unit |
| `buildKeyboard` per (variant, CL) | Jest unit |
| Pagination utility | Jest unit |
| `ColombiaContainer` | Manual QA across all 4 CLs both variants |
| `ColombiaScreen` | Storybook stories: empty/building/wrong/overlong/win, paginated keyboard |
