# Game Implementation Patterns

Living doc. Updated after each game is archived. Read before proposing or implementing any `game-*` change.

Latest entry: **game-taiwan stroke-UX fix** (2026-06-04, issue #31) — never leave a blank canvas (outline guide at every CL); hold a success pause showing the completed glyph before advancing (fixes single-stroke `一` and the "everything vanished" report); add a Clear control. See "Stroke-tracing UX (game-taiwan, issue #31)" below.

---

## yue product decisions (fix/yue-product, 2026-10)

Owner-delegated calls for the Cantonese pack; one line each.

- **#30 Georgia S prompt** — S-mode shows the word with its first syllable blanked (`__生`) under the picture until solved (`buildSyllableHint`). Gated on S; T-mode/Java parity untouched. Only yue uses Georgia S today.
- **M10 Thailand order** — kept #17's fixed order (owner asked for it) but persist the cursor per player+door (`ProgressEntry.roundCursor`), so each visit resumes and the whole word list is covered. Rejected shuffle: contradicts #17.
- **L1 door 5** — CL 344 (written word → same written word) replaced by 364 (word audio → written word, hard distractors): the Hard step of door 4's listen-and-read ladder. Door 5 progress key changes (pre-release, acceptable).
- **L2 tile stages** — `aa_gametiles.txt` had the authored grouping shifted diagonally (medical+numerals `1` in col 14, school/family `2` in col 15 = Type2 stage, everything else `3` in col 16 = Type3 stage, with Type2/3 = `none`). Normalized to col 14 = `1`, cols 15/16 = `-` for every tile. Not moved into col 14 because yue doors are all `StagesIncluded = -` (fixed stage 1, no progression), so stage 2/3 tiles would be hidden forever in stage-aware games. To restore staging later: medical+numerals = 1, school/family = 2, rest = 3, *and* give doors stage values. Guarded by `tools/yue-doors.test.ts`.
- **L10 orphan assets** — deleted 89 unreferenced yue files (72 `audio/tiles`, 9 `audio/words`, 8 `images/words`: old English-named takes superseded by `zz_*`/LWC-named ones). Checked against aa_gametiles AudioName/2/3, aa_wordlist LWC (+`<lwc>2` images), aa_syllables, and a repo-wide grep (tools, Taiwan writing audio, split-syllable tool all key off aa_* files). Manifest generator unchanged (already emits only referenced keys); validator now reports 0 orphans.
- **M7 celebration** — removed the lottiefiles.com default URL. New in-house Lottie (`celebrationAnimation` in `@shared/ui-celebration`: star pop, ring burst, 16 confetti pieces; 3 s, 30 fps) authored as a TS object, repo licence. It's the `GameShellScreen` default and works offline on native and web (LottieView accepts objects). Deleted the unused `apps/alphaTiles/assets/lottie/celebration.json` placeholder. Celebration sources must never be remote.
- **M11 audio players** — boot still probes every clip once (durations must stay synchronous: pack speech returns expected ms from `speak`/`durationOf`), but `@alphaTiles/data-audio` now keeps only an LRU pool of live players (`createPlayerPool`, 24 on native) and re-creates evicted ones on play. Peak live ≈ 24 + 32 probes + 3 chimes, down from ~400. Web pool is unbounded (Safari gesture priming, #25). Needs a device check: first-play latency of evicted clips on low-end Android.

---

## Pack speech — games speak items, never audio keys

**Games never name an audio map or id.** They pass the pack row to `shell.speak(item)` (inside `<GameShellContainer>`) or `usePackSpeech(pack).speak(item)` (menu etc.), where `item` is `{ tile }`, `{ word }`, `{ syllable }` or `{ instruction: id }`. `useAudio()` no longer exposes `playTile/playWord/playSyllable/playInstruction` or the duration getters — only chimes + load/unlock — so the old bug class (passing `AudioName` instead of `tile.base`, bypassing the syllable chain → silent rounds; 5082fef, cad76a1, fd46edd, Italy-T numerals) can't be written.

Module: `libs/alphaTiles/data-audio/src/lib/createPackSpeech.ts` (+ `planSpeech.ts`; production adapter `usePackSpeech.ts`). It owns:

- **Keys** — tile → `tile.base`, word → `wordInLWC`, syllable → syllable text, instruction → InstructionAudio id (what `resolveAudio` binds; never the AudioName column).
- **Word → syllable chain** — unrecorded word whose LOP decomposes into syllables that all have clips (yue composite numerals `zz_20` 二十 … `zz_203` 二百零三, `zz_1000000` 一百萬) plays each syllable with a `GAP_MS` (150 ms) pause, `FALLBACK_MS` (700) for an unmeasured clip. The decomposable rule is one function, `syllableChainFor` (`@shared/util-phoneme`), shared by the binder (`resolveAudio`), the validator (`checkAudioReferences` downgrades `MISSING_WORD_AUDIO` to a warning) and speech.
- **Syllable → containing word** — unrecorded syllable plays the first word whose LOP contains it (Taiwan single hanzi, yue-writing-audio D5). Syllable clip always wins (女 → 女, not daughter).
- **Durations** — `speak` returns expected ms (chain = clips + gaps); `durationOf(item)` gives the same without playing. Use them for follow-up timers.
- **Lock** — a chain holds the shell's interaction lock and restores the lock it found when done (a chain replayed after a correct answer must not unlock a solved round — Georgia point-farming bug); if the mechanic wrote the lock meanwhile, the mechanic wins. Single clips don't lock.
- **Cancellation** — every `speak` cancels speech in flight; the shell also stops it on `setRefWord`, AppState `background|inactive`, and unmount.
- **Silence** — an item with no route is a warn-once no-op (`speak` returns undefined).

Chains are **NOT smoothed concat**: each syllable's micro-silence is preserved and the gap is a teaching cue ("this is X, this is Y, together = XY"); end-to-end concat was rejected for tone-sandhi / connected-speech reasons.

Tests: `createPackSpeech.test.ts` (in-memory clips + recording player) and `tools/yue-speech.test.ts` (real yue pack: every word/tile/syllable/instruction audible; only the 5 composite numerals chain).

---

## Reusing a game class for a new pack feature (from yue-syllable-game)

A "new game" for the player can be **a new `aa_games.txt` door on an existing class** plus the pack data it needs — no new `feature-game-*` lib. `yue-syllable-game` shipped a Cantonese syllable game purely as: a Door 9 row (`Georgia / CL1 / SyllOrTile=S`), a populated `aa_syllables.txt` + `audio/syllables/*.mp3`, and a small additive tweak to the existing container.

Check before proposing a new lib: does an archived class already implement the mechanic? Georgia S-mode is the 6/12/18-choice listen-and-tap; China is the sliding-syllable puzzle; etc. A door + data is far cheaper than a lib.

### Additive container tweaks must be variant-gated

`yue-syllable-game` added isolated-syllable playback to `GeorgiaContainer` — but **only inside the `isSyllable` branch** of `startRound`. T-mode bytes are untouched, so existing tests/stories/behaviour are unaffected. When extending an archived game, gate the change on the existing variant discriminator and leave every other path byte-identical; the spec delta is then a clean `## MODIFIED Requirements` on the one requirement that changed.

### Deferred audio after a clip: timer-ref, not chained promise

`shell.speak(a)` starts playback and returns its expected ms. To play B after A, schedule `setTimeout(() => shell.speak(b), shell.speak(a) ?? FALLBACK_MS)`, store the id in a `useRef`, and clear it at the top of `startRound` **and** in the unmount cleanup — same shape as the Italy auto-advance timer. The ms is the real measured clip length (chain = clips + gaps), not the `aa_wordlist.txt` duration column.

## Per-pack audio generation tooling (from yue-syllable-game)

`tools/split-syllable-audio.ts` cuts the yue word recordings into per-character syllable clips via `ffmpeg silencedetect`. Reusable lessons for any future pack-audio tool:

- **Connected speech often has no inter-syllable silence.** A `silencedetect` sweep on the real recordings is mandatory before trusting it — the yue corpus needed an aggressive `-16dB / 0.06s` floor and *still* only landed ~75/139 cuts on a real gap. Always ship an **equal-duration fallback** for the rest plus a review report; don't block on perfect cuts.
- **Dedup source selection matters.** One clip per unique unit: prefer a standalone-word recording (cleanest), then a word-initial cut, then a mid-word cut (clipped onset). Group multi-unit source words so each is cut once.
- **Raw non-ASCII filenames work** end-to-end (`醫.mp3`) through `fs`, Metro `require()`, the manifest generator, and the validator. `SyllableAudioName` = the character itself.
- **`Has syllable audio: TRUE` makes the validator demand every `aa_syllables.txt` row resolve to a non-empty file** — generate the index and the audio together, never a partial set.

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

No route file. Add a game = one entry in the game-class registry (`apps/alphaTiles/src/gameClassKeys.ts` key + `apps/alphaTiles/src/gameClasses.ts` `{ Container, precompute? }`; the `Record<GameClassKey, …>` type makes a missing half a compile error). The one route `apps/alphaTiles/app/games/[classKey].tsx` resolves the Door from `doorIndex`, looks its class up in the registry and renders `<Container {...params} icons={gameIcons} />` — chrome icons are injected there once for every game. URL stays `/games/<classKey>?doorIndex=…`; web export prerenders one page per registry key (`generateStaticParams`). Prebuild (`tools/assertGameClassesForGames.ts`) fails when a pack names a class with no entry.

---

## Container pattern

```tsx
export function <Name>Container() {
  const shell = useGameShell();
  const assets = useLangAssets();
  // game-specific state here

  // Wire shell integrations via hooks — never raw useEffect([..., shell])
  useShellWord(currentWord);       // keeps refWord in sync; clears to null when word is null
  useShellAdvance(startRound);     // registers advance-arrow handler; cleans up on unmount
  useShellRepeat(fn);              // overrides repeat button; omit if default replayWord is fine

  useEffect(() => { startRound(); }, []); // mount-only kickoff

  function startRound() { /* pick words, set state, play audio */ }
  function onCorrect() { shell.incrementPointsAndTracker(N); startRound(); }
  function onIncorrect() { /* visual feedback */ }

  return (
    <GameShellContainer ...>
      <NameScreen ... />
    </GameShellContainer>
  );
}
```

- `useShellWord` / `useShellAdvance` / `useShellRepeat` from `@alphaTiles/feature-game-shell` replace all manual `setRefWord` / `setOnAdvance` / `setOnRepeat` effects.
- **Never put `shell` in a `useEffect` dep array.** `contextValue` is memoized but `shell` is still an object — use the hook abstraction or destructure the specific stable setter you need.
- All i18n via `useTranslation` — pass translated strings down as props.
- `<GameShellContainer>` is always the outer wrapper.

### URL params: `doorIndex` is the only authoritative pointer — read the Door

The menu push (`feature-game-menu/GameMenuContainer.onDoorPress`) sends exactly `{ classKey, doorIndex, challengeLevel }` — and per `openspec/specs/game-menu/spec.md` "Door-press navigation contract" every other per-door fact comes from the pack. That resolution lives in ONE module: `@alphaTiles/data-doors` (`doorsOf(pack)` → `Door[]`, see `GLOSSARY.md` "Door"). Never read `assets.games.rows[doorIndex - 1]` in a container.

`GameShellContainer` resolves the routed Door itself (`useDoor(params)`; unknown index → `/menu`), derives progress key, colour, displayed level, tracker rule, instruction button and next-door search from it, and hands it to the mechanic via a render-prop child:

```tsx
export function BrazilContainer(props: RouteParams) {
  return (
    <GameShellContainer confirmOnBack={false} icons={props.icons}>
      {(door) => <BrazilGame challengeLevel={door.challengeLevel} variant={door.variant} />}
    </GameShellContainer>
  );
}
```

Class-specific decoding (clamps like Peru's `1..3`, Thailand's 3-digit code) stays in the container — the Door carries the raw `challengeLevel`. A container that must act on the door *before* the shell mounts (Colombia's S-CL4 bounce) calls `useDoor(props)` itself.

**Failure mode this prevents:** default `gameNumber=1, syllableGame=''` → reads row 0 (usually Thailand) for instruction audio + runs the Tile branch even for S-mode doors. Yue/Cantonese door 9 (Georgia · S) regressed exactly this way when a container re-derived the row by hand.

Do not add new params to the menu push or the shell's `useLocalSearchParams` — the menu spec's "Door-press navigation contract" caps it at three. New per-door facts (game name #37, difficulty tier #52) are one field in `doorsOf`.

### Difficulty ladder: a new game class needs a tier (#52)

Every class has a curriculum tier 0–6 in `libs/alphaTiles/util-curriculum-tiers/src/lib/tierForGame.ts` (`TIER_BY_CLASS_KEY`). **Adding a game class = registry entry (above) + one tier entry** (+ a case in `tierForGame.test.ts`). Pick by skill, issue #13's ladder: 0 hear/browse · 1 symbol scan · 2 cross-modal match · 3 whole-word recognition · 4 construction (spell, fill, write) · 5 decoding/analysis · 6 spatial puzzle. A missing entry falls back to 3 — no crash, but the door lands mid-ladder, so don't rely on it. The menu grid and the next-door search both sort by `(tier, index)` (`ladderOrder`); `index`/`doorIndex` never changes. Tier is per class, not per door or pack: two doors of one class always share a level.

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
| `getAudioInstructionsResID()` | `door.instructionAudio` (shell reads it from the Door) |
| `hideInstructionAudioImage()` | `showInstructionsButton={false}` (default: shown iff the Door has a bundled clip) |
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
| Italy | none (variant only) | `challengeLevel` is ignored; `syllableGame` switches the source list (T → words, S → syllables) |
| Iraq | 1-digit difficulty | CL1 = base tiles + sample word; CL2 = same + `iconicWord` override (rejects `"-"`/empty) |
| Malaysia | none | CL ignored; non-scored browser. Pyramid color cycle `[0,1,2,3,4,7,4,3,2,1,0]`; colorless mode → `colorList[8]` |
| Sudan | none + `syllableGame` | T variant: 63 tiles/page, type-colored; S variant: 35 syllables/page, color cycle `k % 5`. Non-scored. |
| Ecuador | none | CL ignored; 8-tile scatter; `updatePointsAndTrackers(2)` on correct |
| Georgia | 1-digit (`level % 3`) | `1` → 6 choices, `2` → 12 choices, `0` → 18 choices. T variant has random + hard branches; S variant has random (sequential after shuffle) + hard branches. T-hard uses `nextInt(CorV.size() - 1)` off-by-one (preserved) |
| Colombia | 1-digit (1–4) + `syllableGame` | T-CL1 keeps duplicates; T-CL2 random distractor; T-CL3 uses `keyList`; T-CL4 deduped tileList type-colored; S variants similar but distractor logic differs; **S-CL4 unsupported** (returns to menu) |
| Chile | 1-digit difficulty | `1`→6 guess rows, `2`→4, `3`→2 (Phonemic Wordle) |
| Japan | 1-digit difficulty | tile-cap per round; landscape-only; partial credit walks tiles between consecutive correct boundaries |
| Mexico | 1-digit difficulty | `1`→3 pairs, `2`→4, `3`→6, `4`→8, `5`→10 (Memory) |
| Romania | none | CL ignored; NO_TRACKER (non-scored). scanSetting (1/2/3) controls word filtering |
| United States | 1-digit difficulty | tile-count cap (5/7/9, no min); pair-and-spell; no `playCorrectFinal` fanfare on win |
| Taiwan | 1-digit difficulty | CL1 → outline + filled character + leniency 1.5; CL2 → outline only + leniency 1.2; CL3 → outline only + leniency 1.0. Outline shows at **every** level (blank canvas was unusable, issue #31). CL knobs gate **child rendering** + `quiz.start()` opts, not props on `<HanziWriter />`. |

Decode locally in the container via a constant map. Add new games here when their `challengeLevel` is decoded.

---

## Precompute pattern

Use when the game needs a filtered/transformed view of pack data that is:
- Expensive to compute (iterates wordList, parses tiles)
- Identical every run (pack is immutable at runtime)

```ts
// libs/alphaTiles/feature-game-<name>/src/build<Name>Data.ts
export type <Name>Data = { ... };

export function build<Name>Data(assets: LangAssets): <Name>Data { ... }
```

```ts
// apps/alphaTiles/src/gameClasses.ts — game-class registry entry
'<name>': { Container: <Name>Container, precompute: build<Name>Data },
// app/registerPrecomputes.ts registers every entry's precompute under its classKey.
```

```ts
// container:
const data = usePrecompute<<Name>Data>('<name>');
```

**Why on the registry entry, not module-load:** registering as a side effect of importing `build<Name>Data.ts` is order-dependent and invisible. The precompute key is the classKey, so `usePrecompute('<name>')` in the container matches the entry automatically. (Routes are not async, so game UI is in the main bundle either way.)

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
   - Game-class registry entry (`gameClassKeys.ts` + `gameClasses.ts`) — no route file
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

## Cross-reference upstream Java BEFORE implementing (from game-myanmar)

The Myanmar proposal had three plausible-but-wrong rules that only surfaced once we read raw `Myanmar.java`. Sequence to follow for any new `game-*`:

1. Open the Java file and quote (`grep`/raw fetch) the exact code for: direction tables, boundary checks, settings keys, and tile-type filters.
2. Compare against the proposed `spec.md` line-by-line. Discrepancies fall into 3 buckets — preserve, narrow, or expand the spec to match Java.
3. Document Java line numbers in `tasks.md § Preflight` so the next reader doesn't have to re-derive.

Three concrete Myanmar discrepancies surfaced this way (all amended pre-impl):
- Direction set differed (spec listed up-right; Java omits it because of an idx-4 bug).
- Tile-type filter was overly broad (spec excluded `V/LV/AV/BV/FV`; Java only excludes `"V"`).
- Method 2 was missing the directional-continuity rule from `respondToTileSelection2`.

---

## Keypad-encoded direction tables (from game-myanmar)

Several Java games store directions as `int[][]` triples `{keypadCode, dx, dy}` and select via `rand.nextInt((maxDirections - min) + 1) + min`. Boundary checks then branch on the **keypad code**, not on dx/dy. Two non-obvious consequences:

1. **The roll bound is INCLUSIVE.** `rand.nextInt(N+1)` covers `[0, N]`. `maxDirections=7` means 8 choices (indices 0..7) are valid — even if the comment says "7 directions".
2. **Boundary checks branch on keypad code.** Code 9 ("up-right") triggers north-bound checks even if its dx/dy moves due-east (Java idx-4 bug). Port mirrors this verbatim — boundary checks use `[1,2,3].includes(keypadCode)` etc., NOT `dy>0`.

Preserve the literal array. Use `as const readonly` so the type system keeps the keypad codes alongside dx/dy.

---

## Settings-keyed game variants (from game-myanmar)

Some games dispatch on an `aa_settings.txt` row read at container mount, NOT on `challengeLevel`:

```ts
const settingValue = assets.settings.findInt('Selection Method for Word Search', 1);
const selectionMethod = (settingValue === 2 ? 2 : 1) as 1 | 2;
```

Pass these settings down to the inner game component as a typed prop alongside `challengeLevel`. Treat unknown values as the default — never throw.

---

## Sequence-selection reducer pattern (from game-myanmar)

Word-search-style games that build up an ordered tile sequence (Method 2 in Myanmar; future variants TBD) benefit from a pure reducer:

```ts
type StackState = { stack: number[]; direction: readonly [number, number] | null };
function stackAppend({ state, tap }): StackState
```

Rules to encode:
- 1st tap: free.
- 2nd tap: must be 8-neighbour-adjacent — establishes `direction`.
- 3rd+ tap: adjacent AND same direction.
- Re-tap of last cell pops; popping below 2 cells clears direction.
- Invalid taps return the unchanged state object (cheap-equality detection in tests).

Keep it pure — no React, no grid bounds (caller enforces). Test cap behaviour by injecting state directly rather than chaining 8 valid taps (a 7×7 grid can't hold 8 in a line).

---

## `useMountEffect` is a pattern, not a hook (from game-myanmar)

Docs and examples reference `useMountEffect(() => …)` as if it's a real hook. **No such hook exists in the workspace.** The actual convention every container follows:

```tsx
// Mount-only kickoff — empty deps, one-shot.
useEffect(() => {
  initThing();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);

// Advance/repeat wiring goes through dedicated hooks, NOT inside the mount effect:
useShellAdvance(initThing);
useShellRepeat(customRepeat);
```

Keep advance/repeat wiring **outside** the mount effect — `useShellAdvance` and `useShellRepeat` re-register whenever their callback identity changes, which is the correct behaviour. Mixing them into the mount effect with `shell.setOnAdvance` was the historical pattern and caused the `Maximum update depth exceeded` bug (see refactor commit 7bef641).

---

## Completion fires from event handler, not derived effect (from game-myanmar)

When a game has a discrete "is the round complete?" check, fire completion logic from the event handler that just changed the state (the cell-tap, choice-tap, etc.), not from a `useEffect` that watches `(progress, goal)`. Example:

```tsx
// ❌ Bad — derived effect needs a one-shot ref to avoid double-fire
useEffect(() => {
  if (wordsCompleted === completionGoal && !firedRef.current) {
    firedRef.current = true;
    shell.incrementPointsAndTracker(true);
    audio.playCorrect().then(shell.replayWord);
  }
}, [wordsCompleted, completionGoal, shell, audio]);

// ✅ Good — fire directly when the event makes it true
function recordFound(idx: number) {
  const nextCount = foundFlags.filter(Boolean).length + 1;
  setFoundFlags(/* mark idx found */);
  if (nextCount === completionGoal) {
    shell.incrementPointsAndTracker(true);
    audio.playCorrect().then(shell.replayWord);
  } else {
    audio.playCorrect();
  }
}
```

This eliminates the one-shot ref, the dependency-list bookkeeping, and the second render. Matches CODE_STYLE.md "Event handlers, not effects".

---

## Storybook host needs explicit lib registration (from game-myanmar)

`libs/shared/storybook-host/.storybook/main.ts` lists each lib whose stories should appear, by directory:

```ts
{
  directory: '../../../alphaTiles/feature-game-myanmar/src',
  files: '**/*.stories.@(js|jsx|ts|tsx|mdx)',
},
```

**Stories in unregistered libs are silently invisible.** Adding a `*.stories.tsx` file is not enough — also append the lib to the `stories` array. Today most `feature-game-*` libs have stories but only a few are registered; flag the cleanup separately when noticed.

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

---

## Shell extensions for non-default scoring + repeat (from game-italy)

Two additive, non-breaking extensions to `useGameShell()` that the Italy port introduced; reuse for any future game with the same needs.

### `incrementPointsAndTracker(isCorrect, points?)`

The original signature was `(isCorrect: boolean) => void` and hardcoded `+1` point per correct answer. Italy's lotería awards `+4` per win (Java `updatePointsAndTrackers(4)`), so the second arg is now an optional `points` (default `1`). Tracker still increments by 1 regardless of `points`.

Existing call sites (`shell.incrementPointsAndTracker(true)`) are unchanged. New call sites pass the explicit count: `shell.incrementPointsAndTracker(true, 4)`.

### `setOnRepeat(fn | null)` → use `useShellRepeat`

Mirror of `setOnAdvance`. The shell's default repeat button calls `replayWord()`, which speaks `{ word: refWord }`. For syllable-mode games (Italy S, Thailand syllable refs, Taiwan chars) the current "call" isn't the ref word — register a repeat that speaks the call item.

```ts
// Use the hook — never manual useEffect([..., shell]):
const onRepeat = useCallback(() => playCallAudio(currentCall), [currentCall, playCallAudio]);
useShellRepeat(onRepeat);
```

If the mechanic registers an `onRepeat`, the shell calls it; otherwise it falls back to `replayWord()`. No existing game needs to change.

---

## Lotería / fixed-seed-board pattern (from game-italy)

For board games where the deck is larger than the board (Italy: 16 board, 54 deck) — the canonical setup is **shuffle-and-split**:

```ts
const initial = shuffle(source).slice(0, deckSize);   // gameCards
const board = initial.slice(0, boardSize);            // first 16 in shuffle order
const deck = shuffle(initial);                        // re-shuffle for caller
```

The board cells stay in their initial shuffle order for the round; the deck is re-shuffled so the caller order is independent of board order. Every board cell is guaranteed to appear in the deck (board ⊆ initial = deck members).

Win-detection over a 4×4 board uses 10 sequences (4 rows + 4 cols + 2 diagonals); store as `WIN_SEQUENCES: readonly (readonly number[])[]` with **0-based indices** (Java's source is 1-based — convert at port time, not at runtime).

---

## Auto-advance after correct (Italy non-winning case)

When a correct tap doesn't end the round (Italy: covered but no lotería), the chime should play before advancing — otherwise the next call audio overlaps the chime. Pattern:

```ts
audio.playCorrect().then(() => {
  if (isMountedRef.current) playCallAudio(currentCall);
});
advanceTimerRef.current = setTimeout(() => {
  if (isMountedRef.current) advanceCaller();
}, ADVANCE_DELAY_MS);  // 800 ms — long enough for the chime to land
```

Track the timer in a ref and clear it in `startRound()` and on unmount; otherwise a rapid second tap or a back-press leaves a stale timer firing into a torn-down container.

---

## Bean / overlay assets (from game-italy)

When a game needs decorative overlays (Italy beans, future games' chips/marks), default to **styled View shapes** in the presenter — not pack-injected images. The presenter accepts an optional image-source prop (`beanImage`, `loteriaImage`) so an app may swap the styled circle for a real `zz_bean.png` later.

Why: pack assets for these overlays are inconsistently shipped, and the presenter has zero asset dependencies otherwise. Image override is opt-in, not required.

---

## OSS-wrap discipline (from game-taiwan)

Taiwan is the first non-Java game in the catalogue. The mechanic (stroke-order tracing) is delegated wholesale to `@jamsch/react-native-hanzi-writer`. Pattern for any future "wrap an existing OSS lib" game:

1. **Pin the dep exactly** in `package.json` (no caret) — small-maintainer libs go stale; we own the rollover.
2. **Vendor data through a per-pack prebuild step** (`tools/build-stroke-data.ts`) — never bundle the full upstream dataset; per-pack subset keeps APK size linear in pack count.
3. **Cache fetched data under `tools/data/<lib>-cache/`** + `.gitignore` it. CDN-fetch + cache is functionally equivalent to vendoring, with first-fetch the only network dep.
4. **Add a NOTICE entry** for license attribution, and read the *data* licence from the upstream COPYING, not hearsay. Even MIT deps get a NOTICE row when they ship a non-trivial dataset. Taiwan's MMH stroke data is **Arphic Public License**, not LGPL (MMH's LGPL covers only `dictionary.txt`, unused). APL obligations for modified/subset data (verbatim licence, per-file change notice, public copy of the modified data, in-app attribution) are spelled out in `docs/licensing/stroke-data.md`; reuse that checklist for any copyleft dataset.
5. **Document API quirks in `tasks.md` + spec.md** before impl. Library APIs evolve — don't assume the readme matches what's installed. The Taiwan spec originally referenced `showOutline`/`showCharacter` props that don't exist in `1.2.0`; we corrected pre-impl.

---

## Web SSR + worklet libs need a client-only mount boundary (from game-taiwan)

`expo-router` `web.output: 'static'` prerenders every route in Node. Libraries that depend on `react-native-reanimated` v4 worklets via `react-native-worklets` (e.g. `@jamsch/react-native-hanzi-writer`) cannot run under Node SSR — the worklet plugin's transformed module is referenced before initialization, throwing `Cannot access 'getPathString' before initialization` at the import line.

Symptom: dev server returns 500 on the route; production export bundles fine but throws at load.

Fix: dynamic-import the lib (or any sibling that statically imports it) inside `useEffect`. SSR pass renders the fallback only; browser pass loads the lib post-mount.

```tsx
// Container at the route boundary:
const [mod, setMod] = useState<typeof import('./Inner') | null>(null);
useEffect(() => { import('./Inner').then(setMod); }, []);
if (!mod) return <ActivityIndicator />;
return <mod.Inner {...props} />;
```

Notes:
- `babel-preset-expo` 55+ auto-adds `react-native-worklets/plugin` when worklets is installed; do NOT list it manually in `babel.config.js` (double-transform → same TDZ).
- The lazy boundary must be at the route file or a sibling that the route does NOT statically import. Once the bundler follows the chain to the worklet lib's static import, you're back in SSR.

---

## Wikimedia stroke-order SVG extractor (from game-india-deva Phase 1B)

`tools/build-stroke-data-deva.ts` automates extraction of per-character stroke
data from Wikimedia Commons stroke-order SVGs. The same pipeline works for any
script with similarly-encoded SVGs (Bengali, Tamil, Gurmukhi if/when those
categories exist on Commons). Reusable bits live in `tools/skeletonize.ts`.

### Lessons learned (read before adding a new script)

- **`inkscape:label="N"` is NOT chronological order.** Most chars use 1..N in
  drawing order, but some (e.g. Devanagari ई) put labels at indices that don't
  match drawing order. Sort by `transform="translate(tx, …)"` to recover true
  chronological order. Fall back to label-N only when all groups share the
  same tx (stacked layout — see ऐ).
- **Multiple "grey" conventions exist.** Grey-fill markers vary across artists:
  `#c8c8c8`, `#c9c9c9`, sometimes opacity 0.8, sometimes `fill:none`. Match by
  R≈G≈B + brightness range (160–230) plus opacity threshold + the literal
  "none". Don't anchor on a single hex string.
- **Style inheritance matters.** Some artists set the grey at the parent
  `<g style="fill:…">` level (ए) rather than per-path (अ). The walker must
  merge parent + child styles; child overrides parent on key conflicts.
- **Three layout types in the corpus** (auto-detected in
  `extractStrokes()`): side-by-side per-path-grey, side-by-side per-group-grey,
  stacked (single position, label = order). New artist contributions may add
  a fourth — verify after scraping.
- **Pair-averaging on outline loops fails for multi-lobe shapes** (e.g. अ's
  "3"-shaped curl). Use raster + Zhang-Suen thinning + skeleton-trace instead
  (`tools/skeletonize.ts`). The raster covers any closed-loop topology.
- **BFS-longest-path skips inner pinch tips.** Y-junctions in the skeleton
  have a short branch leading into the pinch tip (e.g. inside a "3"). Default
  BFS picks the two outer endpoints. Fix: detect off-spine stubs and splice
  them in as detours (`stub + reversed stub`) to ensure the centerline visits
  the pinch.
- **Multi-sub-path strokes** (outer perimeter + inner counters/holes) render
  correctly via canvas's non-zero winding rule when rasterizing the entire
  d-string. The skeleton naturally hugs the body's medial axis without
  explicit hole-handling.
- **`node-canvas` doesn't export `Path2D`** (as of v3). Replay the d-string
  manually via `svgpath().abs().unarc().unshort().iterate(...)` mapping
  segments to `ctx.moveTo/lineTo/quadraticCurveTo/bezierCurveTo`. Curves
  preserved.
- **MEDIAN_COUNT matters for detour visibility.** Phase 1A used 10; the
  Y-junction stub takes a small fraction of total arc length, so with 10
  evenly-spaced medians the detour is invisible. Bump to 15+ when shapes have
  pinches.
- **License-gate everything.** `tools/build-stroke-data-deva.ts` rejects any
  Wikimedia file whose `LicenseShortName` isn't in an explicit allowlist
  (`{cc-by-3.0, cc-by-sa-3.0, cc0, public-domain, …}`). Per-char attribution
  is captured to `_attribution.json` for the NOTICE generator.
- **Cache fetched assets, but commit the derived JSON.** Raw SVGs are
  gitignored under `tools/data/wikimedia-deva-cache/`; the per-char output
  JSON is committed under `tools/data/devanagari-strokes/` so contributors
  don't need to re-run network fetches.
- **CC BY-SA 3.0 share-alike obligation** means our generated JSON is a
  derivative work and inherits the SA license. Document per-artist
  attribution in `apps/alphaTiles/NOTICE.md`.

### Reusing for a new script

1. Find the Wikimedia category (e.g. `Category:Bengali stroke order (SVG)`).
2. Copy `tools/build-stroke-data-deva.ts` → `tools/build-stroke-data-<lang>.ts`.
   Adjust `CATEGORY` constant; adjust the codepoint range in
   `extractCharFromTitle()` (Devanagari is U+0900–U+097F; Bengali is
   U+0980–U+09FF).
3. Run once. Inspect rejection log for any new SVG quirks the heuristics
   don't yet handle. Eyeball-validate via a `spike-<lang>.tsx` route.
4. If many chars get rejected for "inconsistent path counts" or similar, the
   artist used a different convention; widen the heuristics rather than
   hand-author per-char overrides.

---

## Stroke-tracing UX (game-taiwan, issue #31)

The funder hit three compounding problems on door 8 (CL3). All three are general to any `hanzi-writer`-style trace game; fix them together.

1. **Never ship a fully blank canvas.** Original CL3 rendered no `<Outline>` + no `<Character>` and matched at `leniency 0.7` (stricter than the library default). With no glyph to trace and strict matching, the game is unplayable — the learner has nothing to aim at and every stroke is rejected. **Always render the `<Outline>` guide;** scale difficulty by character-fill (CL1 = filled glyph, CL2/CL3 = outline only) and by leniency (1.5 / 1.2 / 1.0), never by removing all guidance. `leniency` multiplies every upstream match threshold (`AVG_DIST`, `START_AND_END_DIST`, `FRECHET`, length) — values below ~1.0 frustrate finger/mouse input.

2. **The upstream blanks the glyph the instant the last stroke matches.** `@jamsch` `quiz.check` sets `{ index: 0, active: false }` on completion, and `<QuizStrokes>` renders only strokes where `index > i` — so at `index 0` *nothing* renders. For a 1-stroke char (`一`) the completed stroke is never shown; for multi-stroke chars everything vanishes a frame before the next char mounts. The player reads this as "it disappeared and never came back." **Fix: a success pause** — on `onComplete`, set a `succeeding` flag that forces `<HanziWriter.Character>` on (filled, success color) for ~900 ms, then advance via a single-slot timer ref (cleared on skip + unmount). The completed glyph is always visible regardless of the upstream index reset.

3. **Add a Clear/restart control.** Calling `writer.quiz.start(params)` again resets `index` + `mistakes` for the current character without remounting — a clean "start this character over." Disable it during the success pause. (The funder explicitly asked "do we need a clear function?" — yes.)

Note `<QuizMistakeHighlighter>` animates the **expected** stroke in red as a hint after `showHintAfterMisses`, not the user's wrong stroke; the user's drawn ink fades out (200 ms) on its own. With an always-visible outline + looser leniency, mistakes drop and the "messy strokes" perception goes away.

## Auto-start the quiz/animation when the upstream signals readiness (from game-taiwan)

Libraries with internal async loading (e.g. `useHanziWriter` fetches per-character JSON) expose a memoized loaded state — for hanzi-writer that's `writer.characterClass: Character | null`. To auto-start the quiz on each new character, depend on the loaded handle in a `useEffect` and short-circuit on `null`:

```ts
useEffect(() => {
  const cls = writer.characterClass;
  if (!cls) return;                               // still loading
  if (startedForCharRef.current === currentChar) return;  // already started
  startedForCharRef.current = currentChar;
  writer.quiz.start({ ... });
}, [writer, currentChar]);
```

Track started-state in a ref (not state) so the effect doesn't re-render on the start. Reset the ref when `currentChar` changes.

## App chrome assets are injected once, by the game route (issue #51)

`type:ui` libs can't resolve app assets, so `ScoreBar`'s tracker icons come from one
app-level module, `apps/alphaTiles/src/gameIcons.ts` (Metro static `require`s), passed by
the single game route to every container (`icons={gameIcons}`), which forwards it to
`GameShellContainer`. Per-class route files used to each repeat this and drifted (issue #51:
10 of 19 dropped icons); with one route the injection holds by construction.

**Generalises:** any prop a presenter treats as optional-with-fallback is a place where
per-call-site wiring drifts — wire it in one place.
