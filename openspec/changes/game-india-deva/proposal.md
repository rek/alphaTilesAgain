## Why

Devanagari is the script of Hindi (~600M speakers), Nepali, Marathi, Sanskrit. Stroke-order tracing is core literacy for primary-school learners across all four languages. AlphaTiles already has the mechanic shipped for hanzi (game-taiwan) — extending it to Devanagari unlocks a >10× larger audience with mostly the same code.

Research log (`design.md` §R) confirms:
- The runtime is **script-agnostic**: `@jamsch/react-native-hanzi-writer` accepts any `{ strokes: SVG-path[], medians: number[][][] }` regardless of script. Verified via spike + lib source.
- Existing infra reuses 100%: `feature-game-taiwan` mechanic, `data-stroke-data` lib, `tools/build-stroke-data.ts`, `checkStrokeData` validator, menu gating.
- Only blocker is **source data**. No turnkey OSS dataset exists for Devanagari with the MMH shape; we have to build one.
- Three commercial-friendly source candidates evaluated; **Wikimedia stroke-order SVGs** win for Phase 1 (CC BY-SA 3.0, strokes already decomposed). Wikimedia GIFs cover the rest (Phase 2 — frame-diff pipeline).

Tibetan Uchen was scoped out: zero OSS data exists, would require human authoring (violates the user's "no human authoring" constraint).

## What Changes

- **NEW** `feature-game-india-deva` library — Devanagari stroke-tracing game wrapping `<HanziWriter />` quiz mode. Largely a clone of `feature-game-taiwan` with character pool sourced from Devanagari aksharas instead of hanzi.
  - **Alternative considered:** generalize `feature-game-taiwan` → `feature-game-stroke` and reuse for both. Rejected for v1 because `game-taiwan` is shipped and refactoring risks regressions on yue. Refactor in v2 once a third script appears.
- **NEW** `tools/build-stroke-data-deva.ts` — SVG-extractor prebuild step. Fetches Wikimedia category, parses each SVG, extracts stroke paths from `<g inkscape:label="4">`, computes medians via arc-length sampling, emits per-char JSON.
- **NEW** `tools/data/wikimedia-deva-cache/` — gitignored cache of downloaded SVGs.
- **MODIFIED** `tsconfig.base.json` — alias for new lib.
- **MODIFIED** `apps/alphaTiles/app/registerPrecomputes.ts` — register `'india-deva'` precompute.
- **MODIFIED** `apps/alphaTiles/NOTICE.md` — attribution for each Wikimedia artist (CC BY-SA 3.0 requires attribution).
- **NEW** route `apps/alphaTiles/app/games/india-deva.tsx`.
- **NEW** `apps/alphaTiles/app/spike-deva.tsx` — throwaway smoke target during Phase 1.

Out of scope for this change:
- Phase 2 (GIF frame-diff pipeline for ~33 consonants) — separate change once Phase 1 lands.
- Conjuncts (`क्ष`, `ज्ञ`, etc.) — never. Per user direction; main aksharas only.
- Tibetan Uchen — abandoned (no OSS data).
- A real Hindi or Nepali language pack — there is none today; we'll ship the game lib + extractor pipeline only. A real pack is its own change once content is sourced.

## Capabilities

### New Capabilities

- `game-india-deva`: Stroke-order tracing game for Devanagari. Same mechanic as `game-taiwan`; player drags through each akshara's strokes in order; OSS lib scores against expected path; round = N characters drawn from `availableTiles`.
- `stroke-data-svg`: Extraction pipeline for Wikimedia stroke-order SVGs (Phase 1 source). Parses `<g inkscape:label="4">` groups, samples medians along each stroke path, emits MMH-shape JSON.

### Modified Capabilities

- `build-pipeline`: prebuild SHALL run `build-stroke-data-deva` for Devanagari-script packs (resolved from `aa_langinfo.txt § Script type === "Devanagari"`); other scripts skip silently.

## Impact

- **Code:** new `feature-game-india-deva` lib, new prebuild tool, new spike route, modified register-precomputes + tsconfig + NOTICE.
- **Pack schema:** the existing `languages/<code>/strokes/<char>.json` slot is reused unchanged. Devanagari packs can drop in stroke files alongside everything else.
- **Dependencies:** no new npm packages. SVG parsing uses `xmldom` (already a transitive dep of expo) or Node's built-in DOMParser via `xmldom-ts`. Median sampling uses `svg-path-properties` (small, MIT, ~7KB).
- **APK size:** ~50KB per pack for the 13 Phase 1 chars (~4KB per JSON × 13). Trivial.
- **Legal:** CC BY-SA 3.0 (Wikimedia SVGs) and CC BY 3.0 (Wikimedia GIFs in Phase 2). Both permit commercial use; both require attribution; SA requires share-alike on derivatives. NOTICE entries per artist.
- **Risk:** Phase 1 ships with 13 chars only — vowel-heavy, only 1 consonant (झ). Not enough for a real Hindi/Nepali game alone. Phase 2 (GIFs) is required for shippable consonant coverage. Phase 1 is essentially a tooling spike that proves the SVG path → medians extraction is viable.
- **Tibetan note:** This change does NOT cover Tibetan Uchen. Per research, no OSS stroke data exists for Tibetan; deferring until a contributor authors one. See `design.md § R6`.
