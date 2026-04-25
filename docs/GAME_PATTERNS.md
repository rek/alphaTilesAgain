# Game Implementation Patterns

Living doc. Updated after each game is archived. Read before proposing or implementing any `game-*` change.

Latest entry: **game-brazil** (2026-04-25).

---

## Standard lib structure

Every concrete game is `libs/alphaTiles/feature-game-<name>`. Files:

```
src/
  index.ts                  # re-exports Container only
  <Name>Container.tsx       # owns hooks, state, handlers
  <Name>Screen.tsx          # pure props → JSX
  build<Name>Data.ts        # precompute registration (if needed)
  pick<Name>Words.ts        # pure word selection (if needed)
  <otherPureHelpers>.ts     # one function per file
  <otherPureHelpers>.test.ts
```

Route: `apps/alphaTiles/app/games/<name>.tsx` renders `<NameContainer />` directly.

---

## Container pattern

```tsx
export function <Name>Container() {
  const shell = useGameShell();
  const assets = useLangAssets();
  // game-specific state here

  useMountEffect(() => startRound());   // NOT useEffect

  function startRound() { /* pick words, set state, play audio */ }
  function onCorrect() { shell.incrementPointsAndTracker(N); startRound(); }
  function onIncorrect() { shell.playIncorrect(); /* visual feedback */ }

  return (
    <GameShellContainer ...shell.shellProps>
      <NameScreen ... />
    </GameShellContainer>
  );
}
```

- No `useEffect` — use `useMountEffect` or event handlers.
- All i18n via `useTranslation` — pass translated strings down as props.
- `<GameShellContainer>` is always the outer wrapper.
- Play word audio on round start: `useMountEffect(() => shell.replayWord(refWord))` re-fires when `key` changes.

---

## Presenter pattern

```tsx
type <Name>ScreenProps = {
  // pre-translated strings
  // image sources
  // tile/choice data
  // callbacks
};

export function <Name>Screen(props: <Name>ScreenProps) {
  // pure JSX only — zero hooks, zero i18n imports
}
```

---

## Java → TS mapping (standard translations)

| Java | TypeScript |
|------|-----------|
| `public class Foo extends GameActivity` | `FooContainer.tsx` wrapping `<GameShellContainer>` |
| `onCreate(Bundle)` | `useMountEffect(() => startRound())` |
| `playAgain()` / `repeatGame()` | `startRound()` |
| `onBtnClick(View)` | `onTilePress(index)` / `onChoicePress(index)` |
| `updatePointsAndTrackers(N)` | `shell.incrementPointsAndTracker(N)` |
| `playCorrectFinalSound()` | `shell.playCorrectFinal()` |
| `playIncorrectSound()` | `shell.playIncorrect()` |
| `getAudioInstructionsResID()` | `instructionAudioName` prop to `<GameShellContainer>` |
| `hideInstructionAudioImage()` | `showInstructionsButton={false}` |
| `ArrayList<Word>` field | `useState<Word[]>([])` in container |
| `preprocessWords()` / static init | `registerPrecompute('name', buildNameData)` at module top |
| `context = this` | N/A |
| `setContentView(...)` | N/A |
| `if (scriptDirection.equals("RTL"))` layout blocks | N/A — logical props handle RTL |
| `ActivityLayouts.applyEdgeToEdge(...)` | N/A — theme-fonts change owns status bar |

---

## Challenge level decoding

`challengeLevel` is game-class-specific. **Do not assume 1/2/3 = easy/medium/hard without checking the Java source.** Known decodings:

| Game | Encoding | Values |
|------|----------|--------|
| China | 1-digit difficulty | `1`→5 moves, `2`→10 moves, `3`→15 moves |
| Thailand | 3-digit code `XYZ` | X=difficulty, Y=refType, Z=choiceType |
| Peru | 1-digit difficulty | `1`→first-tile trio, `2`→same-type random idx, `3`→trio random idx |
| Brazil | 1-digit + `syllableGame` | CL1–3 vowel-blank, CL4–6 consonant-blank, CL7 tone-blank; `syllableGame === "S"` overrides → SL1/SL2 syllable variants regardless of CL |

Decode locally in the container via a constant map. Add new games here when their `challengeLevel` is decoded.

---

## Precompute pattern

Use when the game needs a filtered/transformed view of pack data that is:
- Expensive to compute (iterates wordList, parses tiles)
- Identical every run (pack is immutable at runtime)

```ts
// build<Name>Data.ts
export type <Name>Data = { ... };

function build<Name>Data(assets: LangAssets): <Name>Data { ... }

registerPrecompute('<name>', build<Name>Data);   // side-effect at module load
export { build<Name>Data };

// container:
const data = usePrecompute<<Name>Data>('<name>');
```

When a precompute has too little data (empty buckets), **log a warning and return empty arrays — do not throw.** Let the container detect empty state and show a friendly error screen with a back button.

---

## Insufficient content handling

Java typically logs and silently does nothing; the port should be explicit:

```ts
// pure selection function returns discriminated union:
type Result = { words: Word[] } | { error: 'insufficient-content' };

// container detects and renders friendly error:
if ('error' in result) return <InsufficientContentScreen onBack={shell.navigateBack} />;
```

Retry loops: if setup can fail non-deterministically (e.g. random selection hits edge cases), bound retries at 5 in the container — not recursive in the pure helper.

---

## Word audio on round start

Most games play the reference word audio when a new round starts. Pattern:

```tsx
// give the container a key that changes each round:
<NameScreen key={roundKey} ... />

// inside NameScreen or via useMountEffect in container:
useMountEffect(() => shell.replayWord(refWord));
```

Check the Java source: look for `playAudio(word)` or `hearWord()` calls inside `playAgain()`.

---

## Pure logic files

Each pure helper lives in its own file. Rules:
- No React imports.
- Accept an optional `rng = Math.random` for deterministic testing.
- Accept `parseWordIntoTiles` as an injected dependency rather than importing `util-phoneme` directly (avoids circular deps in tests).
- Return discriminated unions for error cases, not exceptions.
- 100% unit-tested — these are the only mandatory tests for `type:feature` libs.

---

## Storybook stories (minimum set)

Every game needs at minimum:
1. Initial / fresh state
2. Mid-game state (some progress)
3. Error state (insufficient content)
4. RTL layout (via storybook decorator)

---

## tasks.md structure (standard groups)

```
0. Preflight
   - Read proposal.md + design.md + specs
   - Read <Name>.java (with line number callouts)
   - Confirm upstreams archived
1. Library Scaffold
   - nx generate command (exact)
   - tsconfig.base.json alias
   - Route file
2. Pure Logic & Helpers (one task per file, with test task paired)
3. Presenter: <NameScreen>
   - Props type definition
   - Implementation
   - Storybook stories
4. Container: <NameContainer>
   - Subtasks per behaviour (round start, correct, incorrect, audio)
5. Verification
   - tsc, lint, test, manual smoke
```

---

## design.md depth expectations

A game `design.md` must include:

- **Context** — what the Java class does, LOC count, why this game is being ported now.
- **Goals / Non-Goals** — explicit non-goals prevent scope creep.
- **D1. Java surface → TS artifact mapping** — every non-trivial Java symbol mapped to a TS destination. Include Java line numbers for complex logic.
- **D2. Challenge-level decoding** — exact mapping with Java line reference.
- **D3+. One decision per significant implementation choice** — precompute key, discriminated union shape, retry strategy, RTL handling, audio timing.
- **Unresolved Questions** — any behavior not confirmed from Java source.

Shallow `design.md` = ambiguous implementation = drift. If a proposed spec is shallow, **enrich it before starting apply.**

---

## Distractor-trio pattern (from game-peru)

Many games mutate words by tile substitution. Two reusable building blocks:

1. **Distractor trio** of any tile = `tileMap.get(base).{alt1, alt2, alt3}` columns of `aa_gametiles.txt`. Filter empties + missing-from-tileMap entries before use.
2. **Same-type pool** of any tile = pre-bucketed array of all tiles whose `type` matches `parsed[i].typeOfThisTileInstance` (`V`/`C`/`PC`→C/`T`/`AD`). Pre-shuffle once at mount when the game class shuffles them in `onCreate` (Java pattern).

Both live as one-function-per-file pure helpers (`buildSameTypePools`, inline trio access). When the trio or pool is empty, return `null`/`{ error: 'degenerate' }` and let the container retry with another word.

---

## Java off-by-one quirks — preserve, don't fix

Several Java games use `rand.nextInt(tileLength - 1)` where `tileLength` was clearly intended. This excludes the **last tile** from random replacement (e.g. Peru CL2/CL3). Match the Java behaviour exactly — ports are not the place to silently fix bugs in upstream. Document the quirk in `design.md`'s decision section so future readers know it's intentional.

If a future change wants to fix the bug, it should be a separate, named OpenSpec change with explicit before/after scenarios.

---

## Audio sequencing on correct (Java `playCorrectSoundThenActiveWordClip`)

```ts
// Container, on correct:
shell.setInteractionLocked(true);
shell.incrementPointsAndTracker(true);
audio.playCorrect().then(() => {
  if (!isMountedRef.current) return;
  shell.replayWord();
});
```

Use `isMountedRef` to guard against unmount during the awaited `playCorrect`. Don't `await` in the handler — fire-and-forget the chain so React doesn't block.

---

## When NOT to use a precompute

`game-peru` deliberately skips a `register<Name>Precompute` because:

- Word selection is one random pick per round, not a filtered list (trivially fast).
- Per-type tile pools are small enough to bucket+shuffle once at container mount via `useMemo`.
- Distractor trios are looked up on demand from `tileMap`.

Rule of thumb: only precompute when the operation iterates the full word/tile list **and** the result is identical across all rounds. Round-local pools and on-demand lookups belong in container `useMemo`.

---

## Forbidden-substring filter

The `للہ` Arabic-ligature rejection is universal across mutation games. Each implementation gets its own `containsForbidden.ts` (one-line `s.includes('للہ')`) plus a unit test — don't share, don't deduplicate. The filter is applied to **every** generated candidate before the uniqueness/dedupe checks.

---

## QA checklist (game-specific additions to AI_WORKFLOW.md baseline)

- [ ] Navigate to the game's door number, play a round to completion
- [ ] Verify `incrementPointsAndTracker(N)` fires with correct N
- [ ] Verify audio replays on round start
- [ ] Verify all `challengeLevel` values behave distinctly
- [ ] Verify 12 correct completions trigger `<Celebration>`
- [ ] Verify hardware-back returns to Earth

---

## Script-aware blank placeholders (from game-brazil)

For "find the missing tile" mechanics that render a partial word, the placeholder string for the blanked slot is **script-dependent**. The Java code in `Brazil.java::removeTile()` (lines ~290-308) embeds this matrix:

| `scriptType` | Blanked tile type | Placeholder |
|---|---|---|
| Roman / default | any | `"__"` |
| Khmer | `C` with next tile of type `V`/`AV`/`BV`/`D` | `"​"` (zero-width space) |
| Khmer | `C` (other contexts) | `placeholderCharacter` from `aa_langinfo.txt` |
| Thai / Lao | `C` | `placeholderCharacter` from `aa_langinfo.txt` |

`placeholderCharacter` is a per-pack setting (commonly `◌` U+25CC). The pure helper `blankRandomTileOfType(parsed, type, scriptType, placeholderCharacter, rng)` in feature-game-brazil owns this branching — reuse the pattern for any future game that blanks tiles.

---

## Wrong-answer round termination (from game-brazil)

Java `respondToTileSelection()` calls `setAllGameButtonsUnclickable()` at entry and **does not** re-enable on the wrong path. Net behavior:

- **Correct tap** → reveal, score, schedule next round (advance arrow turns blue).
- **Wrong tap** → flash the picked tile red, lock all buttons, advance arrow stays gray. The player must tap the (gray-but-tappable) advance arrow to proceed; `playAgain()` resets state for the next round.

Specs that say "wrong answer leaves choices clickable / round continues" are **wrong**; check the Java `respondToTileSelection` against `playAgain` to confirm round-termination semantics before writing the spec.

---

## Word selection: stage-aware vs. simple shuffle

Java `GameActivity.chooseWord()` is stage-aware (uses `selectWordForStage` in `util-stages` — correspondence ratio + recently-shown buffer). Some game ports (china, brazil) intentionally simplified to **shuffle-and-pop** for v1, which is acceptable for early ports but loses stage filtering.

If your game depends on stage-controlled vocabulary scaling, wire `selectWordForStage` directly. Otherwise note the simplification in `design.md` Open Questions and keep simple shuffle.

---

## Deterministic-RNG infinite-loop trap

When backfilling a Set from a pool, **never use `while (set.size < N)` with `set.add(pool[Math.floor(rand() * pool.length)])`** — if `rand` is a deterministic stub returning a fixed value (common in tests with `() => 0`), you can pick the same already-present element forever.

Safer pattern:

```ts
const remaining = pool.filter((p) => !set.has(p));
for (const p of shuffle(remaining, rand)) {
  if (set.size >= N) break;
  set.add(p);
}
```

Hit this in `feature-game-brazil/buildSyllableChoices.ts` — fixture had `correct.distractors === ['ka', 'ka', 'ka']` and `rand = () => 0`, hung jest worker at 100% CPU for 9 minutes. Fix is to enumerate the remaining pool, not sample.

---

## OpenSpec capability folder naming

Capability folders under `openspec/changes/<change-name>/specs/` and `openspec/specs/` SHALL be named with the `game-` prefix to match the change name (e.g. `game-brazil/spec.md`, not `brazil/spec.md`). This matches china/mexico precedent. The thin "spec template" generated for batch-2 changes used the unprefixed name; rename before promoting to `openspec/specs/`.

---

## OpenSpec spec.md format

Canonical OpenSpec uses:

```md
## ADDED Requirements

### Requirement: <Title in capability voice>

<Body — SHALL/SHOULD statements, tables, prose>

#### Scenario: <name>
- **GIVEN** ...
- **WHEN** ...
- **THEN** ...
```

Avoid the legacy `### R1.` / `### R2.` headings — the canonical-format requirements register correctly with `openspec validate --strict`. Reformat any pending change spec before applying.
- [ ] Verify RTL layout with an RTL pack (or storybook decorator)
