## Context

This is the first **from-scratch** game in the catalogue — no Java predecessor. The 17 archived ports follow a Java→TS mapping discipline (`docs/GAME_PATTERNS.md` D1). game-taiwan substitutes that with an **OSS-library-wrap discipline**: most game logic lives upstream in `@jamsch/react-native-hanzi-writer`; our job is to integrate it cleanly with the existing shell + assets pipeline + menu and add a per-pack stroke-data layer.

Current state:
- 17 game mechanics ported, all archived 2026-04-26 (`docs/GAME_PATTERNS.md`).
- `feature-game-shell` exposes the round lifecycle (`incrementPointsAndTracker(isCorrect, points?)`, `replayWord`, etc. — Italy port introduced the `points?` arg).
- `data-language-pack` parses pack files; `data-language-assets` exposes them at runtime via context.
- yue pack: 64 tile-rows of multi-character compounds (`醫生`, `護士`, …), Type `X`, script `Chinese`.

Stakeholders: PM (curriculum + launch), engineering (build), legal (LGPL data shipping).

## Goals / Non-Goals

**Goals:**
- Ship a working stroke-trace round on yue with ~64 hanzi covered, correctly scored.
- Reuse `@jamsch/react-native-hanzi-writer` and Make Me a Hanzi data — do NOT reimplement stroke matching, hint system, or animator.
- Add a backwards-compatible per-pack stroke-data slot to the asset pipeline.
- Keep non-Chinese packs unaffected. Game tile in country menu hides automatically when stroke data missing.

**Non-Goals:**
- No Jyutping/tone column extension — separate change.
- No `aa_sentences.txt` — separate change.
- No radical metadata — separate change.
- No custom stroke-recognition algorithm — fully delegated to upstream.
- No multi-character word tracing in v1 — round is one-character-at-a-time even though tiles are compounds.
- No per-stroke audio (skip the chime for v1; only character-complete plays audio).

## Decisions

### D1. Wrap `@jamsch/react-native-hanzi-writer` rather than fork-and-rewrite

**Decision:** `<TaiwanScreen>` renders `<HanziWriter />` directly via the `@jamsch` package.

**Alternatives:**
- Fork into project tree → rejected for v1; adds maintenance with no v1 benefit. Re-evaluate at v1.1 if upstream goes stale.
- Build from scratch on `react-native-skia` → rejected; the library handles ~2k LOC of stroke-matching/medians/hint logic for free.
- Web-view embed of upstream JS lib → rejected; native gesture handling is better and the RN port is mature enough.

**Rationale:** Minimal LOC ownership; upstream maintainer has shipped quiz mode end-to-end. Mirror policy stays cheap fallback.

### D2. Per-pack stroke data via a new `strokes/<char>.json` directory

**Decision:** Pack adds optional `languages/<code>/strokes/<char>.json`. Each file is the MMH-format stroke object (`{ strokes: string[], medians: number[][][] }`). `langManifest.ts` exposes `strokes: Record<string, StrokeData>` keyed by character glyph.

**Alternatives:**
- Bundle the full MMH dataset in app once → rejected; ~30MB, dwarfs every other pack asset. Per-pack subset keeps APKs lean.
- Inline strokes into `aa_gametiles.txt` → rejected; binary-ish JSON in a TSV is hostile.
- Single `strokes.json` file per pack → considered; per-char JSON is friendlier for diff/review and aligns with `images/words/<word>.png` precedent (one file per asset).

**Rationale:** Matches existing per-asset layout. Lazy-load possible later. Keeps the pack human-inspectable.

### D3. Prebuild `tools/build-stroke-data.ts` fetches per-char JSON from CDN, caches locally, emits per-pack

**Decision:** A new prebuild tool runs only for Chinese-script packs (`aa_langinfo.txt § Script type === "Chinese"`). It scans tile glyphs from `aa_gametiles.txt`, fetches each character's JSON from `cdn.jsdelivr.net/npm/hanzi-writer-data@2.0/<char>.json` (npm distribution of MMH), caches under `tools/data/stroke-cache/<char>.json`, and writes `languages/<code>/strokes/<char>.json`. Missing-from-MMH characters are logged as warnings and skipped.

**Alternatives:**
- At-runtime lookup of MMH → rejected; would need full MMH dataset bundled, defeats per-pack approach.
- Vendor full `graphics.txt` (~30MB) → rejected post-impl; CDN fetch + cache produces identical per-char output without bulk vendor.
- Manual authoring per pack → rejected; content team should not hand-write stroke JSON.

**Rationale:** One-line opt-in for any future Chinese-script pack. Coverage-gap is visible at build time, not at runtime. Cache keeps subsequent prebuilds offline; only the first fetch needs network. Cache is git-ignored — files in `tools/data/stroke-cache/*.json` are deterministic outputs of the public CDN, regenerable on demand.

**Yue smoke result:** 86 / 87 distinct hanzi covered. Missing: `嫲` (Cantonese-specific, not in MMH dictionary).

### D4. CL decoding via leniency + outline visibility

| CL | Outline | Numbered start dots | Leniency |
|---|---|---|---|
| 1 (default) | visible | yes | 1.5 (forgiving) |
| 2 | visible | no | 1.0 (default) |
| 3 | hidden | no | 0.7 (strict) |

Unknown CL → CL1.

**Rationale:** Mirrors `@jamsch` knobs directly (`showOutline`, `showCharacter`, `leniency`). Maps to the curriculum progression: visible-with-numbers (assisted) → outline-only (recall) → blank (production).

### D5. Round-shape and scoring

- One character per round-step. Round = `goalCount = 5` characters drawn from the precomputed `availableTiles` (filtered to chars with stroke data).
- On `onComplete` of each character: `shell.incrementPointsAndTracker(true, strokeCount)` (uses Italy's `points?` arg). `audio.playWord(char)` plays the tile audio.
- After `goalCount` characters: emit standard celebration via shell (12-correct rule fires automatically once the tracker hits its threshold — same as every other game).
- On 3 mistakes within a single character: auto-advance via `<HanziWriter />` `highlightStroke()` hint sequence; do not penalise points beyond mistake count.

### D6. Insufficient-content guard

Container detects `availableTiles.length === 0` → renders `<InsufficientContentScreen onBack={shell.navigateBack} />` (existing pattern from `game-china`/`game-brazil`). Game-menu hides the tile when `availableTiles.length < MIN_STROKE_TILES (5)` so the screen rarely fires.

### D7. Container/presenter split

- **Container** (`TaiwanContainer.tsx`): owns `useGameShell`, `useLangAssets`, `usePrecompute<TaiwanData>('taiwan')`, round state, mistake counters, audio playback, i18n.
- **Presenter** (`TaiwanScreen.tsx`): pure props — accepts `currentChar`, `strokeData`, `cl`, `onComplete`, `onMistake`, pre-translated strings. Wraps `<HanziWriter />`, configures it from `cl`.

Per `docs/PROJECT_ORGANIZATION.md`: presenter is `type:ui` candidate. Lift to `libs/shared/ui-hanzi-writer` if a second consumer ever appears; v1 keeps it inside the feature lib.

### D8. Pure helpers (one-function-per-file)

- `pickTaiwanCharacters.ts` — pure: `(availableTiles, goalCount, rng) => char[]`. Tested.
- `buildTaiwanData.ts` — precompute key `'taiwan'` filtering `cumulativeStageBasedTileList` to chars present in `assets.strokes`.

### D9. Dependency direction

```
feature-game-taiwan
  ├─ feature-game-shell (existing)
  ├─ data-language-assets (existing — extended to expose strokes)
  ├─ data-stroke-data (NEW — type:data-access)
  └─ @jamsch/react-native-hanzi-writer (npm)
```

`data-stroke-data` owns the `StrokeData` type + the manifest accessor. `feature-game-taiwan` depends on it; nothing else does (yet).

## Risks / Trade-offs

- **LGPL on MMH `graphics.txt`** → Mitigation: ship as a runtime data file (not static-linked); standard MMH usage. Add NOTICE entry naming Make Me a Hanzi + Arphic. Legal sign-off required before yue v1 ships.
- **`@jamsch/react-native-hanzi-writer` small maintainer footprint** → Mitigation: pin exact version; mirror to project-owned org as forkable backup. ~500 LOC if rewrite ever needed.
- **Low-end Android perf — gesture-handler + reanimated path matching may frame-drop** → Mitigation: device-target perf spike during impl. If bad, fall back to `leniency=2.0` + simplified outline. Worst-case: gate Taiwan behind a "high-perf" device-class flag.
- **MMH coverage holes** — uncommon hanzi may be missing → Mitigation: prebuild logs gaps; affected chars excluded from `availableTiles`; round-pick simply skips them.
- **Compound-character vs single-character mismatch** — yue tiles are 2-char compounds (`醫生`); v1 round operates on single chars, so `pickTaiwanCharacters` decomposes compounds into individual chars before drawing → may lose word context. Acceptable for v1; v1.1 could add compound-progression mode.
- **Audio mismatch** — pack has audio per *compound word*, not per *single character*. v1 plays the parent word's audio when its first/only char is completed; if a char appears in multiple compounds, picks the first.

## Migration Plan

No production users on yue yet — no migration. Ship behind a feature flag in `aa_settings.txt` (`Enable stroke order game` default `true`) so PM can disable per-pack without a code change.

Rollback: remove the route + menu entry; pack files stay forward-compatible. The `strokes/` directory becomes silently unused.

## Open Questions

1. Compound vs single-character round shape — v1 uses single chars, but pack audio is per-compound. Acceptable, or do we need per-char audio in pack?
2. Mistake threshold per char — 3 fixed, or expose via `aa_settings.txt`?
3. Hint behaviour after threshold — auto-reveal next stroke (current decision), or show full character outline + restart?
4. Does Taiwan show in stages progression, or always available? Currently "always available when content exists" — matches Sudan/Iraq browser pattern.
5. Per-stroke chime — skipped in v1 (D5 non-goal). Revisit if user testing shows confusion about correctness.
6. Stage gating — should `availableTiles` filter to current stage, or expose all-pack characters? Current design: stage-filtered (consistent with other games).
7. Should `data-stroke-data` live under `scope:alphaTiles` or `scope:shared`? Decision: `scope:alphaTiles` for v1; lift to shared if a second consumer appears.
