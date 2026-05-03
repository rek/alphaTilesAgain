# game-india-deva — research complete, Phase 1 spike in progress

Last touched: 2026-05-03.

## Done

- §0 preflight + research log captured in `design.md § R`. Sources evaluated and rejected: HPL UNIPEN (research-only license), IIIT-INDIC-HW (offline OCR data), UCI/Mendeley (raster classification), youyin (Devanagari listed but not shipped — verified via CDN 404). Source accepted: **Wikimedia stroke-order SVGs** (CC BY-SA 3.0, 13 chars, strokes already decomposed in `<g inkscape:label="4">`). Phase 2 candidate: Wikimedia GIFs (CC BY 3.0, 72 chars, harder).
- Spike test on `Devanagari अ stroke order.svg`: parses to 5 separate stroke paths via Python stdlib XML; group `inkscape:label="4"` is the canonical full-character group.
- Tibetan Uchen confirmed out of scope — zero OSS data exists; would require human authoring (violates user's "no human authoring" constraint).
- Tasks.md filed with full Phase 1 + Phase 2 sketch + Phase 3 stub.

## In progress (Phase 1)

§1–§7 of `tasks.md` — fully automated SVG extractor pipeline. Target: 13 cached chars + smoke route confirming the data shape is consumable by `<HanziWriter>` for non-CJK scripts.

### Phase 1 results (2026-05-03)

**Extractor:** `tools/build-stroke-data-deva.ts`. Run = `node_modules/.bin/tsx tools/build-stroke-data-deva.ts`. Coverage: **13/13** files in `Category:Devanagari stroke order (SVG)` extracted clean, 0 rejected. All by `User:Saurmandal`, **CC BY-SA 3.0**.

| char | strokes | char | strokes | char | strokes |
|---|---|---|---|---|---|
| ऄ | 6 | ई | 4 | ए | 3 |
| अ | 5 | उ | 3 | ऐ | 4 |
| आ | 7 | ऊ | 4 | ओ | 8 |
| इ | 3 | ऋ | 5 | औ | 8 |
|   |   |   |   | झ | 4 |

**Tests:** 5 unit tests on `tools/__fixtures__/devanagari-a.svg` — green.

**Smoke:** `apps/alphaTiles/app/spike-deva.tsx` lazy-loads `@jamsch/react-native-hanzi-writer`, feeds the extracted अ JSON via `loader`. Puppeteer harness at `/tmp/pup/deva-test.mjs`. Result: **0 page errors, 0 console errors, 2 SVGs + 16 paths render, START QUIZ + ANIMATE buttons present.** The lib is **script-agnostic** as expected — `<HanziWriter>` accepts non-CJK characters cleanly.

**Output committed:** `tools/data/devanagari-strokes/<char>.json` (13 files). Cache + attribution gitignored.

### Known limitations (carry to v2)

- **Medians are pair-averaged outline samples, not true centerlines.** Wikimedia SVGs encode strokes as filled-glyph perimeter loops; we approximate the centerline by averaging point at `t` with point at `1-t`. For elongated stroke shapes this is roughly the midline; for asymmetric or curved strokes it can drift. Visual rendering is correct; **quiz scoring may be off**. Real fix = render-to-bitmap → Zhang-Suen skeletonize → trace centerline. Defer to v2.
- **Only 1 consonant (झ).** SVG source is exhausted; 32 more consonants exist only in the GIF set (Phase 2).
- **No language pack.** `feature-game-india-deva` lib not built; spike route only.

## Not started

- Phase 2 (GIF frame-diff extractor)
- Phase 3 (game lib + Hindi/Nepali language pack)

## Hard scope notes

- **Zero human authoring.** Validation only. Any approach that requires hand-tracing strokes is rejected.
- **Tibetan parked.** No OSS data; revisit only if a contributor authors a corpus.
- **Conjuncts excluded.** `क्ष`, `ज्ञ`, etc. — too combinatorial. Main aksharas only.
