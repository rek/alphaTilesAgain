# game-bod-uchen — Checkpoint 5 (synthetic) only. NOT shippable.

Last touched: 2026-05-04. Checkpoints 1–3 (license-clean OSS sources) all dead.
Checkpoint 5 (synthetic via Noto Serif Tibetan + skeletonize) green for tooling
smoke. No real stroke-order data exists for Tibetan Uchen as of this date.

## TL;DR for the next agent

- The toolchain works: `<HanziWriter>` accepts U+0F00–U+0FFF codepoints, the
  MMH JSON shape (`{ strokes, medians }`) renders, and `tools/skeletonize.ts`
  handles Tibetan glyph topologies (loops, junctions, vertical head bars)
  unchanged from how it handles Devanagari.
- The data is fabricated. Per-character stroke ORDER is heuristic
  (font-subpath bbox sorted top-to-bottom). Per-stroke decomposition uses the
  TTF artist's outline subpaths, not Tibetan writing convention. **Do not
  ship.**
- All four real-data sources we evaluated are blocked. See "Sources
  evaluated" below for the full table. The next agent's primary job is to
  find a license-clean source — synthetic data is a placeholder.

## Done — Checkpoint 5 (synthetic, tooling-smoke only)

5/5 base consonants generated and validated end-to-end:

| char | codepoint | stroke count | notes |
|---|---|---|---|
| ཀ | U+0F40 | 1 | 1 subpath in TTF |
| ཁ | U+0F41 | 1 | 2 subpaths → 1 after hole-merge |
| ག | U+0F42 | 1 | 2 subpaths → 1 after hole-merge |
| ང | U+0F44 | 1 | 1 subpath in TTF |
| ཅ | U+0F45 | 1 | 2 subpaths → 1 after hole-merge |

All 5 chars collapse to a single stroke after counter-merging. TTF subpaths
encode fill regions (outer + counter), not pen-strokes — so synthetic
multi-stroke decomposition from font data alone is impossible. 1-stroke-per-
char is the honest representation of "we have no real stroke data."

Pipeline:

1. `tools/build-stroke-data-bod.ts` loads
   `/usr/share/fonts/truetype/noto/NotoSerifTibetan-Regular.ttf` via
   `opentype.js` (newly added dep).
2. For each char, takes the glyph's vector path and splits at every `M`.
3. Merges counter subpaths (holes) into their enclosing outer via
   signed-area sign + bbox containment. Without this, holes render as
   filled solid discs (canvas's nonzero-fill rule needs outer + hole
   together to carve correctly).
4. Sorts strokes top-to-bottom by post-transform bbox (Tibetan writing
   direction). Trivial for our 5 chars — all collapse to 1 stroke.
5. Bakes a translate→scale→translate transform to fit the glyph in the
   1024×1024 MMH box with 5% padding. **No Y-flip** (opentype font paths are
   already Y-up, matching MMH; deva needed a flip because Wikimedia SVG is
   Y-down).
6. Skeletonizes each baked stroke via existing `tools/skeletonize.ts`
   (rasterize + Zhang-Suen + longest-path-with-detours) → 15-point medians
   in MMH coords.
7. Emits `tools/data/uchen-strokes/<char>.json` plus `_attribution.json`
   with the synthetic warning baked into the file.

Spike validation:

- `apps/alphaTiles/app/spike-bod.tsx` — clone of `spike-deva.tsx` with the
  5-char button row, lazy-imports `@jamsch/react-native-hanzi-writer`
  inside `useEffect` (web SSR rule).
- Web smoke (`/tmp/pup/bod-test.mjs` + manual eyeball): all 5 chars render
  with correct glyph shape (no filled-disc artifacts on holes), button
  switching works, animate fires, 0 page errors, 0 console errors.
- Manual stroke-order check: FAILS — bbox-Y heuristic does not match
  written Tibetan order for any of the 5 chars per user inspection
  2026-05-04. Pending native-Tibetan-speaker review.

`apps/alphaTiles/NOTICE.md` updated with OFL attribution + synthetic warning.

## Sources evaluated (and why each failed)

| # | Source | Data shape | License | Status |
|---|---|---|---|---|
| 1 | MRG-OHTC (ISCAS Beijing) | online handwriting (pen trajectories + Unicode) | "available for academic researches by contacting the authors" | **REJECTED** — research-only. Same class as HPL UNIPEN (deva R1). Would have been ideal data shape (910 char classes × 130 writers). Authors: longlong/huidan/wujian@iscas.ac.cn. |
| 2 | Wikimedia Commons | SVG | CC BY-SA 3.0 | **EMPTY** — `Tibetan` prefix returns 200+ categories (writers, books, translators, …). None match `*stroke*` or `*order*`. File search "Tibetan stroke order" hits 146 unrelated PDFs (dictionaries, travel books, grammars). No Tibetan stroke-order SVGs exist on Commons as of 2026-05-04. |
| 3 | OpenPecha / BDRC / Monlam AI | various | Apache-2.0 / MIT / The Unlicense | **WRONG SHAPE** — extensive NLP, OCR, transliteration, fonts, text editors, but no stroke-order datasets. Searched all OpenPecha repos, GitHub `tibetan stroke`, `monlam tibetan stroke`, `uchen stroke` — 0 hits. |
| 4 | TibHCR | offline raster (141k samples) | (TBD) | **WRONG SHAPE** — raster images only, no pen-stroke sequence. Useless for `<HanziWriter>` which needs ordered medians per stroke. Listed on the Devanagari spec's R6 row already. |
| 5 | Synthetic (Noto Serif Tibetan + skeletonize) | font-glyph subpaths | OFL (font), output unrestricted | **TOOLING SMOKE** — produces well-formed MMH JSON; renders correctly in `<HanziWriter>`; stroke order is fabricated. NOT for learners. |

## Key learnings (for the next agent)

### opentype.js's deprecated `loadSync` is broken in node 22

`opentype.loadSync(path)` printed `DEPRECATED!` and returned undefined (or
attempted XHR). Use `opentype.parse(buffer.buffer.slice(...))` after
`fs.readFileSync` — explicit ArrayBuffer slice is required because Node's
Buffer is a view over a shared backing array.

### Y-axis convention differs by source

- Wikimedia SVG (deva): Y-down. Deva extractor applies `.scale(s, -s)` to
  flip into MMH's Y-up convention.
- opentype.js glyph paths (bod): already Y-up (typographic). `bod` extractor
  uses `.scale(s, s)` (no flip). Output is correct without further fiddling.

If you later port to a Wikimedia Tibetan SVG corpus (if Commons grows one),
you'll need to add the Y-flip back. The `deva` extractor's transform chain
is the reference.

### Glyph subpaths ≠ stroke decomposition

A TTF glyph's `M…M…` subpaths reflect what the font designer chose to fill
separately, not how a writer breaks the glyph into pen-strokes. ཁ has 2
subpaths because the dot above the body is a separate fill region — but a
Tibetan writer might draw the body as 3 strokes (top bar, left vertical,
bottom curve) and the dot as 1, totalling 4 strokes. Our synthetic ཁ has
2 strokes. **This is wrong for learners but fine for proving the toolchain
accepts U+0F00 codepoints.**

### Top-to-bottom sort is heuristic, not authoritative

Per chris fynn's "How to write the Tibetan script", real Tibetan stroke
order varies by character and is NOT strictly top-to-bottom. The bbox-Y
sort is a placeholder that produces a deterministic order; it won't match
a writer's intuition for most characters.

### Same skeletonize.ts handles Tibetan unchanged

The existing rasterize + Zhang-Suen + longest-path code handles Tibetan
glyphs without modification. The 5 sampled characters all produce coherent
medians that follow the centerline of each subpath. This is the third
script (after hanzi via MMH and Devanagari) confirmed compatible —
strengthens the case for a shared `feature-game-stroke` lib once a
license-clean Tibetan source ships.

## File layout

```
tools/
  build-stroke-data-bod.ts         ← NEW: opentype.js → glyph path → split → skeletonize
  skeletonize.ts                    ← reused unchanged
  data/
    uchen-strokes/                  ← committed JSON output (5 files + _attribution.json)
      ཀ.json ཁ.json ག.json ང.json ཅ.json
      _attribution.json             ← OFL attribution + SYNTHETIC warning
apps/alphaTiles/
  app/spike-bod.tsx                 ← test route (5-char button row + ANIMATE / Quiz)
  NOTICE.md                         ← Tibetan synthetic-data section added
openspec/changes/game-bod-uchen/
  PROMPT.md  STATUS.md (this file)
package.json                        ← + opentype.js, @types/opentype.js
```

## Status — investigation parked, awaiting Tibetan-speaker review

Per user 2026-05-04: the synthetic 1-stroke-per-char output is locked in as
the answer the toolchain can give from font data alone. Code-side investigation
is complete. User plans to ask a Tibetan speaker to author canonical stroke
order for the 5 base consonants; once that hand-authored data is in our
hands we work it in (re-import path TBD: SVG, plain JSON, or extending the
skeletonize output).

## Hand-off to next agent

Next likely tasks (in priority order):

1. **Wait for user to deliver Tibetan-speaker-verified stroke order** for
   ཀ ཁ ག ང ཅ. Format negotiable — easiest is per-char ordered list of
   median polylines (same shape as our skeletonize output) plus per-stroke
   d-strings. If they hand back paper sketches we have to vectorize, but
   that's a content-team task, not code.
2. **When real data lands:** wire it into `tools/data/uchen-strokes/<char>.json`
   replacing the synthetic JSON. The format consumer (`spike-bod.tsx`,
   eventually `feature-game-bod-uchen`) does not care about provenance.
   Drop the "FABRICATED" warning from `spike-bod.tsx` and `NOTICE.md`.
3. **Find a license-clean OSS Uchen source for Phase 2 (ਨ+ chars).** Hand
   authoring 5 is feasible; 30+ is content-team scale. Concrete leads:
   - Email longlong@iscas.ac.cn asking whether MRG-OHTC could be re-licensed
     CC BY-SA for educational use. Data shape is ideal (pen trajectories
     per char per writer).
   - Watch BDRC / OpenPecha for any future stroke-order corpus.
   - If a contributor authors a Wikimedia Commons Category for "Tibetan
     stroke order (SVG)", the existing `tools/build-stroke-data-deva.ts`
     extractor is mostly script-agnostic (only `extractCharFromTitle()`'s
     codepoint range needs to change to U+0F00–U+0FFF). The Phase 1B
     skeletonization already works for Tibetan curves.
4. **(Stretch) Generalise the deva + bod extractors into a shared core.**
   Per PROMPT.md stretch goal. Three extractors now share: parse → license
   gate (where applicable) → cache → bbox → scale-to-1024 → skeletonize.
   Script-specific bits: Wikimedia category name OR font path, codepoint
   range, Y-flip flag, sort heuristic. ~200 LoC of shared code.
5. **Do NOT clone `feature-game-taiwan` → `feature-game-bod-uchen` yet.**
   Per PROMPT.md "What NOT to do": generalise to a shared
   `feature-game-stroke` lib only when we have a third script confirmed
   shippable. Tibetan synthetic data does NOT count as shippable; wait
   until step 1+2 deliver real data.

## Hard constraints (carry forward)

- **Zero human authoring.** Validation only. Per-character hand-tracing
  remains rejected.
- **Synthetic data is tooling-smoke only.** The fabricated stroke order
  must NOT be presented to learners. If we eventually ship a Tibetan game,
  the data MUST come from a license-clean real source.
- **License gate.** Source license must be in: CC0, CC BY, CC BY-SA, public
  domain, OFL (font-derived). Reject: research-only, non-commercial,
  GPL/AGPL.
- **Web SSR fix.** Lazy-import `@jamsch/react-native-hanzi-writer` inside
  `useEffect` — same worklets-TDZ workaround as `game-taiwan` and
  `game-india-deva`.

## Resolved questions

1. ~~Synthetic vs wait for real source?~~ User 2026-05-04: park, ask a
   Tibetan speaker to verify+author canonical stroke order for the 5
   chars, work it in later.

## Open questions

1. **Approach the MRG-OHTC authors?** Polite ask for a CC BY-SA re-license
   for a literacy nonprofit might land — they've published 5+ years off
   this dataset.
2. **Crowdsource Phase 2 via OpenPecha?** They have a content community;
   funding them to author 30 base consonants + 4 vowels of canonical
   stroke-order SVGs would unblock Tibetan permanently. Out of scope here.
3. **Receiving format from the Tibetan reviewer?** Easiest end-state is
   per-stroke d-string + median polyline matching the existing JSON shape.
   If they sketch on paper, we vectorize — content-team work.
