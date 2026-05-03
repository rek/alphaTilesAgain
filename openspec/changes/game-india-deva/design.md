## Context

Second non-Java game in the catalogue. Continues the OSS-wrap discipline established by `game-taiwan` (`docs/GAME_PATTERNS.md` § OSS-wrap). Pivots from CJK to a Brahmic script.

User goal: prove the stroke-trace mechanic generalizes to non-CJK scripts and ship Hindi/Nepali support without human stroke-authoring. Hard constraint: zero human authoring of stroke data; humans only validate.

Stakeholders: PM (curriculum + launch); engineering (build, content pipeline); legal (CC BY-SA 3.0 derivative obligations).

## Goals / Non-Goals

**Goals:**
- Build a fully automated extraction pipeline that produces `{ character, strokes, medians }` JSON in MMH shape from a permissively-licensed source.
- Cover the 12 Devanagari vowels + at least 1 consonant in Phase 1. Smoke-test that they render and quiz correctly via the existing `<HanziWriter />` plumbing.
- Reuse the entire `game-taiwan` machinery: `data-stroke-data`, `useStrokes`, validator, manifest, menu gating, route shape.

**Non-Goals:**
- No human authoring of stroke paths. Validation only.
- No Tibetan Uchen (no OSS data exists; out of scope until that changes).
- No conjunct characters (`क्ष`, `ज्ञ`, etc.). Each conjunct is its own glyph in print but a fused multi-stroke combo to write — too ambiguous to automate cleanly. Per user direction.
- No matras (vowel signs) for Phase 1. Matras attach to consonants and are visually small; their stroke order is well-defined but Wikimedia data is sparse. Phase 2 if found.
- No real Hindi or Nepali language pack ships in this change. The game lib + extractor pipeline only.
- No `feature-game-stroke` generalization yet. Refactor `game-taiwan` + new game into a shared mechanic only when a third script appears.

## R. Research log (sources investigated, findings, license analysis)

### R1. HP Labs India Devanagari handwriting dataset (HPL UNIPEN)
- **Source:** <https://lipitk.sourceforge.net/datasets/dvngchardata.htm>
- **Coverage:** 111 Devanagari characters, ~270 samples each, written by 100+ native writers on tablets. UNIPEN format (pen position over time, segmented by pen-up/down).
- **Why it matters:** UNIPEN gives stroke order + pen-position polylines DIRECTLY. Each pen-down→pen-up = one stroke. Conversion to MMH shape is trivial (drop time component, format as `M x y L x y…`).
- **License:** Research-only ("The data is available only for research use"). Commercial use forbidden.
- **Decision:** **Rejected.** Cannot ship in app store releases.

### R2. IIIT-INDIC-HW (CVIT, IIIT Hyderabad)
- **Source:** <https://cvit.iiit.ac.in/research/projects/cvit-projects/indic-hw-data>
- **Coverage:** word-level handwriting; offline scans, not stroke-ordered online data.
- **License:** unclear; not commercial-explicit.
- **Decision:** **Rejected.** Wrong shape (offline, not online/stroke-ordered).

### R3. UCI / Mendeley / figshare Devanagari datasets
- **Source:** various.
- **Coverage:** image classification (32×32 raster) for OCR.
- **Decision:** **Rejected.** No stroke order info; useless for our use case.

### R4. hanzi-writer-data-youyin (MadLadSquad)
- **Source:** <https://github.com/MadLadSquad/hanzi-writer-data-youyin>
- **Stated coverage:** Devanagari + Bengali + many others (per README).
- **Actual coverage:** Hiragana/Katakana shipped; Devanagari and Latin are listed as planned but not shipped (CDN 404 for `अ` and `A`, confirmed via curl 2026-05-03).
- **License:** MIT for code; data inherits from upstreams.
- **Decision:** **Rejected** for now; revisit if Devanagari ships upstream. Could contribute back to youyin once we generate data.

### R5. Wikimedia Commons stroke-order media
Two relevant categories. License footer per Wikimedia: structured data CC0; unstructured per-file (most are CC BY 3.0 or CC BY-SA 3.0).

#### R5a. Devanagari stroke order (SVG) — 13 files
- **Files:** अ आ इ ई उ ऊ ऋ ए ऐ ओ औ झ ऄ. (12 vowels + 1 consonant + ऄ.)
- **Inspected:** `Devanagari अ stroke order.svg` (artist: User:Saurmandal, **CC BY-SA 3.0**).
- **Structure:** SVG contains 4–6 `<g inkscape:label="N">` groups (`"1"` through `"4"` plus `"Arrows"` and `"Start markers"`). Group `"4"` has the full character; each child `<path d="…">` is **one stroke**, in stroke order. This is exactly the data we need.
- **Verified:** `अ` parses to 5 strokes via Python stdlib `xml.etree.ElementTree`. Path strings are valid SVG path data; coordinates in mm via Inkscape transform. We rescale to a 0..1024 box to match MMH conventions.
- **Median extraction:** sample N points along each stroke path via arc-length parameterization (`svg-path-properties` npm).
- **Decision:** **PRIMARY SOURCE for Phase 1.**

#### R5b. Devanagari stroke order (GIF) — 72 files
- **Files:** Two naming conventions — `Devanagari <ipa> <hanzi>.gif` (older) and `Deva-<char>-order.gif` (newer, easier to parse).
- **Inspected:** `Deva-क-order.gif` (artist: User:Opiaterein, **CC BY 3.0**, 217×181, 27 frames).
- **Coverage:** all main consonants + most vowels. Naming includes Unicode char so machine-parsable.
- **Frame structure:** progressive animation, ~25 frames showing pen tip moving across multiple strokes. NOT one-stroke-per-frame — this is the hard part.
- **Why automation is non-trivial:** strokes blend smoothly. Stroke boundary detection requires:
  1. Per-frame diff: new dark pixels = `(frame_n & ~frame_(n-1))`.
  2. Track centroid of new pixels per frame.
  3. When centroid jumps by > threshold (pen lift), declare stroke boundary.
  4. Within a stroke: append new pixels, then skeletonize and trace centerline.
- **Decision:** **PHASE 2.** Spike, do NOT ship in this change.

### R6. Tibetan Uchen — nothing OSS
- **Searched:** Wikimedia (no Tibetan stroke-order category exists), OpenPecha (fonts + corpora + spellcheck only — no stroke data), academic OCR datasets (recognition, not stroke order), Internet Archive (one human-learner PDF).
- **Decision:** **Out of scope.** Would require human authoring of ~30–60 base+stack glyphs. Violates user constraint. Park until a contributor authors one or until we relax the constraint.

### R7. Font-based skeletonization (fallback)
- **Approach:** render glyph from Noto Devanagari (OFL), binarize, run Zhang-Suen thinning (`scikit-image.morphology.skeletonize`), graph-traverse the skeleton to segment strokes (junction points = stroke endpoints).
- **Problem:** stroke order is NOT recoverable from a static glyph. We'd have to apply per-script heuristics (e.g. Devanagari headline last, top→bottom, left→right) which is unreliable at the character level.
- **Decision:** **Fallback only.** Not pursued in Phase 1 or 2.

## Decisions

### D1. Reuse `game-taiwan` mechanic; clone instead of generalize for v1
**Decision:** New lib `feature-game-india-deva` is largely a copy of `feature-game-taiwan`, with the precompute key changed to `'india-deva'` and the available-tiles filter expecting Devanagari codepoints (U+0900–U+097F).

**Alternatives considered:**
- Generalize to `feature-game-stroke` taking `scriptRange` as a prop → rejected for v1 because `game-taiwan` is shipped on `main`; refactor risks regressions on yue. Re-evaluate when a 3rd script lands.
- Make `game-taiwan` accept arbitrary characters → same risk, same rejection.

**Rationale:** Velocity now, refactor when scale demands it.

### D2. Wikimedia SVG group `inkscape:label="4"` is the canonical stroke source
**Decision:** The extractor parses each SVG, finds the `<g>` whose `inkscape:label` equals the highest numeric value (typically `"4"`), and treats each child `<path>` as one stroke in document order.

**Alternatives:**
- Use group `"1"` and accumulate forward → same data, more code.
- Diff group `"4"` minus group `"3"` to identify the LAST stroke, then group `"3"` minus group `"2"` for second-to-last, etc. → identical end result with more brittle parsing.

**Rationale:** Group `"4"` already enumerates every stroke as a separate path in order. Direct read is the simplest invariant.

**Preserved quirk:** Some SVGs use labels `"1".."5"` instead of `"1".."4"` (more than 4 strokes). Always pick the **maximum-numeric labelled group**. Other groups (`"Arrows"`, `"Start markers"`) are non-numeric and ignored.

### D3. Median extraction via arc-length sampling
**Decision:** For each stroke path, sample 8–12 evenly-spaced points along arc length and emit as `medians[strokeIdx]`. Use `svg-path-properties` (npm, MIT) for `getPointAtLength`.

**Alternatives:**
- Use the path's polyline endpoints only (start + end) → too sparse; upstream's stroke-matching algorithm needs sample density along the curve.
- Use raw control points from the SVG path → unreliable; quadratic/cubic curves don't have user-meaningful control points.

**Rationale:** MMH samples ~5–15 medians per stroke. Matching that range works.

### D4. Coordinate normalization
**Decision:** Compute the bounding box across all strokes for a character, then linearly transform every coordinate to a 0..1024 box (MMH's coordinate system). Y-axis is flipped to match MMH (origin top-left in SVG, bottom-left in MMH).

**Rationale:** `<HanziWriter />` expects MMH-shape coords. Misaligned coords render off-canvas or scrambled.

**Verification:** smoke test by feeding extracted `अ` into `<HanziWriter character="अ" loader={...}>`; if the character renders in-frame and the quiz accepts strokes, the transform is correct.

### D5. Per-character JSON shape
Same as `game-taiwan`'s `StrokeData` — re-uses the existing `data-stroke-data` lib type:
```ts
export interface StrokeData {
  character: string;
  strokes: readonly string[];          // one SVG path 'd' per stroke
  medians: ReadonlyArray<readonly [number, number][]>;  // sampled along each path
}
```
No new type needed.

### D6. License-attribution registry
**Decision:** Each downloaded SVG's license metadata (artist, license short name) is captured at fetch time and emitted to a `tools/data/wikimedia-deva-cache/_attribution.json` file. The build-deva tool refuses to emit chars whose license is incompatible (rejects anything not in `{cc-by-3.0, cc-by-sa-3.0, cc0, public-domain}`).

**Rationale:** CC BY-SA 3.0 requires attribution + share-alike. We must surface artist names in `apps/alphaTiles/NOTICE.md` and accept that derivative works inherit SA. (Acceptable: the JSON output is already a derivative of the source SVG.)

### D7. Caching is mandatory
The build-deva tool caches the raw SVG under `tools/data/wikimedia-deva-cache/<char>.svg` so subsequent prebuilds run offline. Cache is gitignored. On first build, network is required. First-build wall-clock per pack: ~30s (13 SVGs × ~20KB).

### D8. Phase 1 deliverable: extractor only, NO game integration
Phase 1 SHIPS:
- `tools/build-stroke-data-deva.ts` — extractor.
- `tools/data/wikimedia-deva-cache/.gitkeep`.
- `apps/alphaTiles/app/spike-deva.tsx` — smoke route loading one extracted char into `<HanziWriter />` to verify the data shape works.
- 13 cached SVGs + 13 generated `<char>.json` files (committed under `tools/data/devanagari-strokes/` so other branches can consume without re-fetching).
- Updated `NOTICE.md` with per-artist attribution.

Phase 1 does NOT ship:
- `feature-game-india-deva` lib (Phase 3 — needs a Hindi/Nepali language pack to be useful).
- Phase 2 GIF extractor (separate change).
- Route at `/games/india-deva` (Phase 3).

### D9. Future Phase 2 — GIF extractor
Out of scope for this change. Designed in `tasks.md § Phase 2` but not implemented. Algorithm sketch documented in R5b.

## Risks / Trade-offs

- **Phase 1 covers only 13 chars** → not a shippable game. Acceptable: this is a tooling spike that proves the data path. Phase 2 fills the consonant gap.
- **Wikimedia SVG quality varies by artist** → some SVGs may have decorative paths in group `"4"` that aren't strokes (arrows, numbers). Mitigation: filter out paths whose bounding box is tiny (likely ornaments) or whose `id` matches `start`, `arrow`, `number`. Document filter in `tools/build-stroke-data-deva.ts`.
- **CC BY-SA 3.0 share-alike obligation** → our generated JSON files are derivative works of the source SVGs. We MUST license the JSON files compatibly (CC BY-SA 3.0 or compatible). Add a license header to each output file. Legal sign-off needed before committing the generated files to the repo.
- **Median sample density** → too few → upstream stroke matcher rejects valid attempts. Too many → slow gesture matching. Start with 10 per stroke; tune via smoke test.
- **Coordinate normalization edge cases** → SVGs with very wide/narrow aspect ratios may need preserveAspectRatio handling. Test on a tall char (e.g. ई) early.
- **`@jamsch/react-native-hanzi-writer` script-agnostic claim** is based on lib source review and a partial PoC (yue smoke). For Phase 1 we MUST verify it accepts a Devanagari char `अ` end-to-end (load → render → quiz mode → onComplete fires). If the lib has hidden CJK assumptions (font metrics? unicode range checks?), we'll discover here.

## Migration Plan

No production users. No migration. Phase 1 is a research deliverable; Phase 2 (GIF) and Phase 3 (game lib + Hindi pack) are separate changes.

Rollback for Phase 1: delete `tools/build-stroke-data-deva.ts` + `tools/data/wikimedia-deva-cache/` + `apps/alphaTiles/app/spike-deva.tsx` + revert the NOTICE.md addition.

## Open Questions

1. **License compatibility of generated JSON files.** Is CC BY-SA 3.0 SA OK to ship? `apps/alphaTiles/NOTICE.md` attribution + a per-file license line should satisfy. Defer to legal review (carry forward from `game-taiwan` LGPL question).
2. **Phase 2 boundary detection threshold** for GIF frame-diff — how big a centroid jump = pen lift? Tune empirically against known-stroke-count chars (क is 3 strokes; if our algo says 3, threshold is right).
3. **Phase 3 language pack source.** AlphaTiles has no Hindi or Nepali pack today. Building one (wordlists, audio, images) is a separate content-team effort. Phase 3 lands when content arrives.
4. **Coordinate system precision.** Should we round coords to integers or keep 4 decimal places? MMH uses integers; fewer bytes; matches upstream conventions. Default integers.
