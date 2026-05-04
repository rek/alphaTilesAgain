# game-india-deva — Phase 1B done. Hand-off ready.

Last touched: 2026-05-04. Commit pending — see `git status`.

## TL;DR for the next agent

A fully-automated extractor for Devanagari stroke data from Wikimedia Commons exists at `tools/build-stroke-data-deva.ts`. Output: `tools/data/devanagari-strokes/<char>.json` (12 chars, MMH `StrokeData` shape). Validated visually via `apps/alphaTiles/app/spike-deva.tsx`. The `@jamsch/react-native-hanzi-writer` runtime is **script-agnostic**; the same plumbing that ships `game-taiwan` (yue/hanzi) will host Devanagari without code changes.

**Outstanding:**
- Phase 2 (GIF extractor) — needed for ~33 Devanagari consonants. Phase 1 SVG source only covers 12 vowels + 1 consonant in the Wikimedia category, and 1 of the 13 (झ) has a non-standard SVG layout that we reject.
- Phase 3 — clone `feature-game-taiwan` → `feature-game-india-deva` lib + Hindi/Nepali language pack. Blocked on content-team work for the pack.
- Real centerlines for stroke 1 of अ are now correct (Phase 1B skeletonization). Quiz scoring still untested for Devanagari (web smoke covers visual + animate only).

## Done — Phase 1B (skeletonization + multi-format SVG support)

The Phase 1A pair-averaging approach broke on multi-lobe stroke shapes (अ stroke 1, the "3"-shaped curl). Replaced with raster + Zhang-Suen thinning + branch-stub splicing. All 12 covered chars now render with visually correct stroke order + curve-following centerlines.

Three SVG conventions surface in the Wikimedia corpus (and we handle all three):
- **Side-by-side per-path-grey** (अ, ओ): groups translated horizontally, each contains the same N paths with `fill:#c8c8c8` on "not yet drawn" paths.
- **Side-by-side per-group-grey** (ए): same layout, but the parent `<g style="fill:#c9c9c9">` greys all children unless overridden.
- **Stacked single-glyph** (ऐ): all groups share the same tx; the displayed image is the final character with a highlighted stroke.

Stroke counts (12/13 chars):
| char | strokes |     | char | strokes |     | char | strokes |
|---|---|---|---|---|---|---|---|
| ऄ | 5 |   | ऊ | 3 |   | ओ | 6 |
| अ | 4 |   | ऋ | 3 |   | औ | 6 |
| आ | 4 |   | ए | 3 |   |   |   |
| इ | 2 |   | ऐ | 4 |   |   |   |
| ई | 3 |   |   |   |   |   |   |
| उ | 2 |   |   |   |   |   |   |

झ rejected — non-standard layout (duplicate label="1" groups, inconsistent path counts).

## Done — Phase 1A (initial extractor + spike route)

(See git history at commit 4b6c477.) SVG fetcher with Wikimedia API, license-gated download, per-character JSON cache, spike route at `apps/alphaTiles/app/spike-deva.tsx` showing all 12 chars via clickable buttons.

## Key learnings (for the next agent or future me)

### Wikimedia stroke-order SVGs are not consistent

Different artists use different conventions to encode stroke progression. The Phase 1B extractor handles three known patterns; any new contributor's SVGs may add a fourth. Pattern detection is heuristic: tx-spread for layout type, mode-of-path-counts for outliers, fill-style inheritance for grey detection.

### `inkscape:label="N"` is NOT chronological order

For most chars (अ, अ, ओ) the label number happens to match drawing order, but ई has labels `1, 3, 2` in tx (left-to-right) order. Sort by `transform="translate(tx,…)"` for the side-by-side layout.

For the stacked layout (ऐ), tx-sort is unstable (all groups share tx); fall back to label number.

### "Grey" is artist-specific

Different SVGs use `#c8c8c8`, `#c9c9c9`, sometimes opacity 0.8 to mark "not yet drawn". The matcher in `isGreyStyle()` accepts any near-neutral light grey (R≈G≈B with brightness 160–230) plus opacity below 0.5. New corpus contributions may break this — verify after fetching new SVGs.

### Style inheritance matters

Some artists (ए) set `fill:#c9c9c9` at the parent `<g>` level, with child paths overriding via explicit `fill:#000000`. Others (अ) set grey per-path with no parent style. The walker must merge parent + own styles before greyness check (`mergeStyles()` in build-stroke-data-deva.ts).

### Pair-averaging breaks on multi-lobe shapes

Phase 1A used max-chord-pair outline walking + pair-averaging to compute centerlines. Works for elongated strokes; fails on shapes that fold back on themselves (e.g. अ's "3"-shaped curl). Phase 1B replaces with raster + thinning + skeleton-trace, which handles arbitrary topologies.

### Multi-sub-path strokes need filtering

Some strokes have separate sub-paths for the outer perimeter and inner counters (holes in the glyph). `sampleCenterlineMedians()` rasterizes the full d-string (counters render as holes via canvas's non-zero winding rule); the resulting skeleton naturally hugs the body's medial axis without needing explicit hole-handling.

### BFS-longest-path skips inner pinch tips

A "3" shape's skeleton has a Y-junction at the pinch with a short branch leading into the pinch tip. Default BFS picks the two outer endpoints and skips the branch. Phase 1B splices the branch as a "detour" (`stub + reversed stub`) into the main spine; bumped MEDIAN_COUNT to 15 so detour samples are visible.

### `node-canvas` ≠ browser canvas

`Path2D` is not exported by node-canvas as of v3. Manual replay via `svgpath().abs().unarc().unshort().iterate(...)` translating segments to `ctx.moveTo/lineTo/quadraticCurveTo/bezierCurveTo` works (curves preserved).

### Web SSR still applies

The spike route lazy-imports `@jamsch/react-native-hanzi-writer` inside `useEffect` (per `openspec/changes/game-taiwan/STATUS.md` worklets-TDZ note). Same pattern needed for Phase 3's `feature-game-india-deva` lib.

## File layout (Phase 1B)

```
tools/
  skeletonize.ts              ← rasterize + Zhang-Suen + skeleton trace
                                (reusable for Phase 2 GIF extractor)
  build-stroke-data-deva.ts   ← Wikimedia fetch, parse, extract orchestration
  build-stroke-data-deva.test.ts
  __fixtures__/devanagari-a.svg
  data/
    wikimedia-deva-cache/     ← gitignored SVG cache + _attribution.json
    devanagari-strokes/       ← committed JSON output (12 files)

apps/alphaTiles/
  NOTICE.md                   ← Wikimedia/CC BY-SA 3.0 attribution
  app/spike-deva.tsx          ← test route (12-char dropdown + ANIMATE / Quiz)

openspec/changes/game-india-deva/
  proposal.md design.md tasks.md STATUS.md (this file)
  specs/{game-india-deva,stroke-data-svg,build-pipeline}/spec.md
```

## Hand-off to next agent

Next likely tasks (in priority order):

1. **Phase 2: GIF extractor** for the ~33 consonants Wikimedia has only as animated GIFs.
   - Pipeline sketched in `tasks.md § Phase 2`.
   - Reuse `skeletonize.ts` — frame-diff produces a binary mask per stroke, the rest of the pipeline (skeleton + trace + sample) is identical.
   - Key challenge: detect stroke boundaries within a frame stream. Each new frame in a GIF adds pen-tip pixels; centroid jumps mark stroke breaks.

2. **Phase 3: game lib + language pack**
   - Clone `libs/alphaTiles/feature-game-taiwan` → `feature-game-india-deva` (drop hanzi-specific bits).
   - Register `'india-deva'` precompute in `apps/alphaTiles/app/registerPrecomputes.ts`.
   - Wire route `/games/india-deva.tsx`.
   - Menu gating same pattern as taiwan: hide tile when `assets.strokes` count < 5.
   - Hindi or Nepali language pack is content-team work — separate change.

3. **Phase 1C: quiz validation on Devanagari**
   - Web smoke confirmed visual rendering. Quiz scoring is untested — need to actually trace strokes with a finger / mouse and verify `onComplete` fires, points accrue.
   - If misrecognition is high, the centerlines may need refinement (e.g. real medial-axis rather than longest-skeleton-path).

## Hard constraints (carry forward)

- **Zero human authoring.** Validation only. Anything requiring per-character hand-tracing is rejected.
- **Tibetan parked.** Zero OSS data; revisit only if a contributor authors a corpus.
- **No conjuncts** (`क्ष`, `ज्ञ`, etc.) — too combinatorial.
