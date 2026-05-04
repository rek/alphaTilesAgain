## 0. Preflight

- [x] 0.1 Read `docs/GAME_PATTERNS.md` — full
- [x] 0.2 Re-read `openspec/changes/game-taiwan/STATUS.md` for the OSS-wrap pattern + web SSR caveat
- [x] 0.3 Confirm `@jamsch/react-native-hanzi-writer` is script-agnostic (verified via lib source — `loader` accepts any `{ strokes, medians }`)
- [x] 0.4 Research log captured in `design.md § R`. Source candidates evaluated: HPL UNIPEN (research-only ❌), IIIT-INDIC-HW (offline ❌), UCI/Mendeley (raster ❌), youyin (Devanagari listed but not shipped ❌), Wikimedia SVG (CC BY-SA, 13 chars ✅), Wikimedia GIF (CC BY, 72 chars, harder ⏳).
- [x] 0.5 Tibetan Uchen scoped out — no OSS data, no automation possible.

## Phase 1 — SVG extractor (this change)

### 1. Tooling deps

- [x] 1.1 Add `svg-path-properties` to `apps/alphaTiles/package.json` (or `tools/package.json` if tooling has its own — check). Pin exact version.
- [x] 1.2 Confirm `fast-xml-parser` (or equivalent) is available — Bun has DOMParser via `linkedom` if needed. Pick the simpler option.
- [x] 1.3 No new runtime deps for the app.

### 2. Build-stroke-data-deva extractor

- [x] 2.1 Create `tools/build-stroke-data-deva.ts`. Mirrors the structure of `tools/build-stroke-data.ts` (the yue prebuild) but reads from Wikimedia.
- [x] 2.2 List Wikimedia SVG files via `https://commons.wikimedia.org/w/api.php` (`list=categorymembers`, `cmtitle=Category:Devanagari stroke order (SVG)`).
- [x] 2.3 For each file, fetch metadata via `prop=imageinfo&iiprop=url|extmetadata`. Capture `LicenseShortName`, `Artist`, `LicenseUrl` per file. Reject any file whose license is not in `{cc-by-3.0, cc-by-sa-3.0, cc0, public-domain}`.
- [x] 2.4 Download the SVG payload to `tools/data/wikimedia-deva-cache/<char>.svg`. Skip if cached.
- [x] 2.5 Parse the SVG with `fast-xml-parser` (preserve attributes). Find every `<g>` with `inkscape:label="N"` where N is numeric. Pick the group whose N is maximum (typically `"4"`).
- [x] 2.6 Within that group, list child `<path>` elements in document order. Each path's `d=` attribute is one stroke's SVG path string.
- [x] 2.7 Filter ornament paths: skip paths whose bounding box width × height < 1% of the character's bounding box (likely arrows / start dots). Heuristic — log any rejection for human inspection.
- [x] 2.8 Compute the character bounding box across all stroke paths. Normalize all coords to a 0..1024 box, Y-flipped to match MMH (origin top-left in SVG; bottom-left in MMH).
- [x] 2.9 For each normalized stroke, sample 10 points along arc length via `svg-path-properties`. Round to integers. This is the `medians[strokeIdx]` array.
- [x] 2.10 Re-emit each stroke's `d=` rebuilt against the normalized coordinates (so what `<HanziWriter>` renders matches what we sampled).
- [x] 2.11 Emit `tools/data/devanagari-strokes/<char>.json` with shape `{ character: '<U+XXXX char>', strokes: string[], medians: number[][][] }`.
- [x] 2.12 Aggregate per-file attribution into `tools/data/wikimedia-deva-cache/_attribution.json` for the NOTICE generator.
- [x] 2.13 Print summary: `[build-stroke-data-deva] covered=N missing=M total=T` plus the missing list.

### 3. Tests

- [x] 3.1 `tools/build-stroke-data-deva.test.ts` — unit tests for the SVG parser:
  - `pickHighestNumericGroup` — given a doc with labels `["1","2","3","4","Arrows"]` returns the `"4"` group.
  - `extractStrokePaths` — returns N paths in document order.
  - `normalizeToBox` — given paths with bbox `(10,20)→(110,80)` normalizes to `(0,0)→(1024,1024)` Y-flipped.
  - `sampleMedians` — given a known path returns 10 points starting at the path start and ending at its end.
  - `filterOrnaments` — drops paths with tiny bounding box.
- [x] 3.2 Integration test — feed a known fixture SVG (committed under `tools/__fixtures__/devanagari-a.svg`, a sanitized copy of the Wikimedia अ file) end-to-end. Assert the output JSON has 5 strokes, each with 10 medians, and round-trips.

### 4. Generate the data

- [x] 4.1 Run `bun tools/build-stroke-data-deva.ts` once. Confirm 13 chars covered.
- [x] 4.2 Inspect the attribution registry (`_attribution.json`). Confirm all 13 are CC BY 3.0 or CC BY-SA 3.0.
- [x] 4.3 Add a generation note + per-artist attribution to `apps/alphaTiles/NOTICE.md` under a new "Devanagari stroke data — Wikimedia Commons" section.
- [x] 4.4 Decide commit policy: Yes — commit the generated `<char>.json` so other devs don't need to re-fetch (matches the `tools/data/stroke-cache/` pattern but committed; gitignored cache is the SVG, not the JSON output). Document this distinction in `tools/build-stroke-data-deva.ts` header.

### 5. Spike route + smoke

- [x] 5.1 Create `apps/alphaTiles/app/spike-deva.tsx`. Mirror `apps/alphaTiles/app/spike-taiwan.tsx` (now deleted in main, but the pattern is in git history at commit `e175066`). Lazy-import `@jamsch/react-native-hanzi-writer` per web-SSR rule. Render `अ` via the standard `<HanziWriter>` flow with our extractor output as `loader`.
- [x] 5.2 Run `bun nx web-export alphaTiles` (any `APP_LANG=eng` is fine — spike doesn't depend on a real pack). Serve via the puppeteer harness at `/tmp/pup/`.
- [x] 5.3 Puppeteer smoke: navigate to `/spike-deva`, wait for SVG to render, assert path count === 5, assert quiz button appears, start quiz. Capture page errors.
- [x] 5.4 Visual sanity check: open `/spike-deva` in a real browser, confirm the rendered character actually looks like अ.
- [x] 5.5 If the lib chokes on Devanagari for any reason (font metrics? unicode range guard?), file the issue + propose a workaround.

### 6. Phase 1 documentation

- [x] 6.1 Append a "Phase 1 results" section to `STATUS.md` — covered chars, attribution counts, smoke result, known issues.
- [x] 6.2 Add a section to `docs/GAME_PATTERNS.md` covering the SVG extractor pattern (next OSS-wrap reference).
- [x] 6.3 Update `openspec/specs/` (if archiving) — but most likely keep in-flight until Phase 2 + 3 complete.

### 7. Phase 1 verification

- [x] 7.1 `bun nx typecheck alphaTiles` — clean
- [x] 7.2 `bun nx test tools` — extractor tests green
- [x] 7.3 Manual: 13 chars render, 1 char (अ) passes a quiz round
- [x] 7.4 No new console errors in the puppeteer smoke

## Phase 1B — skeletonization + multi-format SVG support (DONE 2026-05-04)

- [x] 1B.1 `tools/skeletonize.ts` — rasterize d-string via node-canvas + svgpath path-replay; Zhang-Suen thinning; trace longest-path through skeleton.
- [x] 1B.2 Branch-stub splice into spine for "3"-shape inner pinches (अ stroke 1).
- [x] 1B.3 Bumped `MEDIAN_COUNT` from 10 → 15 so detour samples actually visible.
- [x] 1B.4 Style-inheritance walker: parent `<g style="fill:#c9c9c9">` propagates to children that don't override (handles ए).
- [x] 1B.5 Generalised grey-detector — accepts any near-neutral light-grey hex/rgb plus opacity < 0.5 plus `fill:none` (handles अ #c8c8c8, ई #c9c9c9 simultaneously).
- [x] 1B.6 Sort numeric groups by `transform="translate(tx,…)"` for side-by-side layout (ई has labels 1,3,2 in tx order — label number is NOT chronological).
- [x] 1B.7 Stacked-layout fallback (ऐ has all groups at same tx) — sort by label N when tx-spread is small.

## Phase 2 — GIF extractor (NOT done; sketch only)

- [ ] P2.1 New tool `tools/build-stroke-data-deva-gif.ts`.
- [ ] P2.2 List Wikimedia GIF files via API (`Category:Devanagari stroke order (GIF)`).
- [ ] P2.3 Per GIF: decode frames; for each n>0 compute `new = (frame_n is dark) AND (frame_(n-1) is bright)`.
- [ ] P2.4 Track centroid of new pixels per frame. When centroid jumps by > threshold (tunable), declare a stroke boundary.
- [ ] P2.5 Per stroke (sequence of contiguous frames): union new pixels into one mask; skeletonize via `tools/skeletonize.ts` (already exists from Phase 1B); trace centerline → polyline; convert to SVG path.
- [ ] P2.6 Sample medians along the polyline (already a centerline).
- [ ] P2.7 Validate stroke count against known-good (e.g. क = 3 strokes). Tune threshold.
- [ ] P2.8 Coverage target: ~33 consonants from the GIF set.

## Phase 3 — game lib + language pack integration (NOT done; separate change)

- [ ] P3.1 Clone `feature-game-taiwan` → `feature-game-india-deva` with precompute key `'india-deva'`.
- [ ] P3.2 Hindi or Nepali language pack (content-team work; outside engineering).
- [ ] P3.3 Wire route, register precompute, menu gating (re-use `MIN_STROKE_TILES` constant).
- [ ] P3.4 (Optional) generalize `feature-game-taiwan` + `feature-game-india-deva` → `feature-game-stroke` once a third script lands.

## Open Questions

- [ ] Q1 Legal sign-off on CC BY-SA 3.0 share-alike for derivative JSON output. (Likely fine; carry forward from `game-taiwan` LGPL Q.)
- [x] Q2 Median sample count (default 10) — bumped to 15 in Phase 1B for detour visibility.
- [ ] Q3 When does Phase 3 fire? Depends on Hindi / Nepali content team.
- [ ] Q4 Quiz scoring on Devanagari — visual rendering verified, but actual stroke-trace recognition untested. May need centerline-quality refinement.
