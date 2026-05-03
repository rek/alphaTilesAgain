## 0. Preflight

- [x] 0.1 Read `docs/GAME_PATTERNS.md` — full
- [x] 0.2 Re-read `openspec/changes/game-taiwan/STATUS.md` for the OSS-wrap pattern + web SSR caveat
- [x] 0.3 Confirm `@jamsch/react-native-hanzi-writer` is script-agnostic (verified via lib source — `loader` accepts any `{ strokes, medians }`)
- [x] 0.4 Research log captured in `design.md § R`. Source candidates evaluated: HPL UNIPEN (research-only ❌), IIIT-INDIC-HW (offline ❌), UCI/Mendeley (raster ❌), youyin (Devanagari listed but not shipped ❌), Wikimedia SVG (CC BY-SA, 13 chars ✅), Wikimedia GIF (CC BY, 72 chars, harder ⏳).
- [x] 0.5 Tibetan Uchen scoped out — no OSS data, no automation possible.

## Phase 1 — SVG extractor (this change)

### 1. Tooling deps

- [ ] 1.1 Add `svg-path-properties` to `apps/alphaTiles/package.json` (or `tools/package.json` if tooling has its own — check). Pin exact version.
- [ ] 1.2 Confirm `fast-xml-parser` (or equivalent) is available — Bun has DOMParser via `linkedom` if needed. Pick the simpler option.
- [ ] 1.3 No new runtime deps for the app.

### 2. Build-stroke-data-deva extractor

- [ ] 2.1 Create `tools/build-stroke-data-deva.ts`. Mirrors the structure of `tools/build-stroke-data.ts` (the yue prebuild) but reads from Wikimedia.
- [ ] 2.2 List Wikimedia SVG files via `https://commons.wikimedia.org/w/api.php` (`list=categorymembers`, `cmtitle=Category:Devanagari stroke order (SVG)`).
- [ ] 2.3 For each file, fetch metadata via `prop=imageinfo&iiprop=url|extmetadata`. Capture `LicenseShortName`, `Artist`, `LicenseUrl` per file. Reject any file whose license is not in `{cc-by-3.0, cc-by-sa-3.0, cc0, public-domain}`.
- [ ] 2.4 Download the SVG payload to `tools/data/wikimedia-deva-cache/<char>.svg`. Skip if cached.
- [ ] 2.5 Parse the SVG with `fast-xml-parser` (preserve attributes). Find every `<g>` with `inkscape:label="N"` where N is numeric. Pick the group whose N is maximum (typically `"4"`).
- [ ] 2.6 Within that group, list child `<path>` elements in document order. Each path's `d=` attribute is one stroke's SVG path string.
- [ ] 2.7 Filter ornament paths: skip paths whose bounding box width × height < 1% of the character's bounding box (likely arrows / start dots). Heuristic — log any rejection for human inspection.
- [ ] 2.8 Compute the character bounding box across all stroke paths. Normalize all coords to a 0..1024 box, Y-flipped to match MMH (origin top-left in SVG; bottom-left in MMH).
- [ ] 2.9 For each normalized stroke, sample 10 points along arc length via `svg-path-properties`. Round to integers. This is the `medians[strokeIdx]` array.
- [ ] 2.10 Re-emit each stroke's `d=` rebuilt against the normalized coordinates (so what `<HanziWriter>` renders matches what we sampled).
- [ ] 2.11 Emit `tools/data/devanagari-strokes/<char>.json` with shape `{ character: '<U+XXXX char>', strokes: string[], medians: number[][][] }`.
- [ ] 2.12 Aggregate per-file attribution into `tools/data/wikimedia-deva-cache/_attribution.json` for the NOTICE generator.
- [ ] 2.13 Print summary: `[build-stroke-data-deva] covered=N missing=M total=T` plus the missing list.

### 3. Tests

- [ ] 3.1 `tools/build-stroke-data-deva.test.ts` — unit tests for the SVG parser:
  - `pickHighestNumericGroup` — given a doc with labels `["1","2","3","4","Arrows"]` returns the `"4"` group.
  - `extractStrokePaths` — returns N paths in document order.
  - `normalizeToBox` — given paths with bbox `(10,20)→(110,80)` normalizes to `(0,0)→(1024,1024)` Y-flipped.
  - `sampleMedians` — given a known path returns 10 points starting at the path start and ending at its end.
  - `filterOrnaments` — drops paths with tiny bounding box.
- [ ] 3.2 Integration test — feed a known fixture SVG (committed under `tools/__fixtures__/devanagari-a.svg`, a sanitized copy of the Wikimedia अ file) end-to-end. Assert the output JSON has 5 strokes, each with 10 medians, and round-trips.

### 4. Generate the data

- [ ] 4.1 Run `bun tools/build-stroke-data-deva.ts` once. Confirm 13 chars covered.
- [ ] 4.2 Inspect the attribution registry (`_attribution.json`). Confirm all 13 are CC BY 3.0 or CC BY-SA 3.0.
- [ ] 4.3 Add a generation note + per-artist attribution to `apps/alphaTiles/NOTICE.md` under a new "Devanagari stroke data — Wikimedia Commons" section.
- [ ] 4.4 Decide commit policy: Yes — commit the generated `<char>.json` so other devs don't need to re-fetch (matches the `tools/data/stroke-cache/` pattern but committed; gitignored cache is the SVG, not the JSON output). Document this distinction in `tools/build-stroke-data-deva.ts` header.

### 5. Spike route + smoke

- [ ] 5.1 Create `apps/alphaTiles/app/spike-deva.tsx`. Mirror `apps/alphaTiles/app/spike-taiwan.tsx` (now deleted in main, but the pattern is in git history at commit `e175066`). Lazy-import `@jamsch/react-native-hanzi-writer` per web-SSR rule. Render `अ` via the standard `<HanziWriter>` flow with our extractor output as `loader`.
- [ ] 5.2 Run `bun nx web-export alphaTiles` (any `APP_LANG=eng` is fine — spike doesn't depend on a real pack). Serve via the puppeteer harness at `/tmp/pup/`.
- [ ] 5.3 Puppeteer smoke: navigate to `/spike-deva`, wait for SVG to render, assert path count === 5, assert quiz button appears, start quiz. Capture page errors.
- [ ] 5.4 Visual sanity check: open `/spike-deva` in a real browser, confirm the rendered character actually looks like अ.
- [ ] 5.5 If the lib chokes on Devanagari for any reason (font metrics? unicode range guard?), file the issue + propose a workaround.

### 6. Phase 1 documentation

- [ ] 6.1 Append a "Phase 1 results" section to `STATUS.md` — covered chars, attribution counts, smoke result, known issues.
- [ ] 6.2 Add a section to `docs/GAME_PATTERNS.md` covering the SVG extractor pattern (next OSS-wrap reference).
- [ ] 6.3 Update `openspec/specs/` (if archiving) — but most likely keep in-flight until Phase 2 + 3 complete.

### 7. Phase 1 verification

- [ ] 7.1 `bun nx typecheck alphaTiles` — clean
- [ ] 7.2 `bun nx test tools` — extractor tests green
- [ ] 7.3 Manual: 13 chars render, 1 char (अ) passes a quiz round
- [ ] 7.4 No new console errors in the puppeteer smoke

## Phase 2 — GIF extractor (out of scope for this change; sketch only)

- [ ] P2.1 New tool `tools/build-stroke-data-deva-gif.ts`.
- [ ] P2.2 List Wikimedia GIF files via API (`Category:Devanagari stroke order (GIF)`).
- [ ] P2.3 Per GIF: decode frames; for each n>0 compute `new = (frame_n is dark) AND (frame_(n-1) is bright)`.
- [ ] P2.4 Track centroid of new pixels per frame. When centroid jumps by > threshold (tunable), declare a stroke boundary.
- [ ] P2.5 Per stroke (sequence of contiguous frames): union new pixels into one mask; skeletonize via Zhang-Suen; trace centerline → polyline; convert to SVG path.
- [ ] P2.6 Sample medians along the polyline (already a centerline).
- [ ] P2.7 Validate stroke count against known-good (e.g. क = 3 strokes). Tune threshold.
- [ ] P2.8 Coverage target: ~33 consonants from the GIF set.

## Phase 3 — game lib + language pack integration (separate change)

- [ ] P3.1 Clone `feature-game-taiwan` → `feature-game-india-deva` with precompute key `'india-deva'`.
- [ ] P3.2 Hindi or Nepali language pack (content-team work; outside engineering).
- [ ] P3.3 Wire route, register precompute, menu gating (re-use `MIN_STROKE_TILES` constant).
- [ ] P3.4 (Optional) generalize `feature-game-taiwan` + `feature-game-india-deva` → `feature-game-stroke` once a third script lands.

## Open Questions

- [ ] Q1 Legal sign-off on CC BY-SA 3.0 share-alike for derivative JSON output. (Likely fine; carry forward from `game-taiwan` LGPL Q.)
- [ ] Q2 Median sample count (default 10) — adjust based on smoke results.
- [ ] Q3 When does Phase 3 fire? Depends on Hindi / Nepali content team.
