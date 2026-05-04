# Hand-off prompt: Tibetan Uchen stroke-order validation

> Drop-in prompt for the next agent. Read this file first; everything you need to start is here.

## What we want from you

Validate that AlphaTiles' existing stroke-tracing infrastructure works **end-to-end for Tibetan Uchen script (`bod` / དབུ་ཅན་)**. The hard question is: can we source stroke-order data automatically? Prior research (2026-05-03) said "no OSS data exists." A 2026-05-04 follow-up surfaced the **MRG-OHTC** online Tibetan handwriting database that may have what we need. Validate the data path; if it works, hook it into the same toolchain that ships `game-taiwan` (yue, hanzi) and `game-india-deva` Phase 1 (Devanagari).

Hard constraint inherited from the user: **zero human authoring of stroke data.** Validation only. If you can't find permissively-licensed data, document the dead-end, propose a synthetic fallback (skeletonized Noto Tibetan glyphs with heuristic stroke order — useful for tooling smoke only, not shippable), and stop.

## Context (read in this order)

1. `openspec/changes/game-taiwan/STATUS.md` — first stroke-trace game shipped (web). Web SSR caveat applies to all stroke-trace work.
2. `openspec/changes/game-india-deva/STATUS.md` — Phase 1B done. Read **"Key learnings"** section in full — those lessons carry over verbatim to Tibetan.
3. `docs/GAME_PATTERNS.md` § "Wikimedia stroke-order SVG extractor (from game-india-deva Phase 1B)" — the reusable pipeline.
4. `tools/skeletonize.ts` — already-built rasterize + Zhang-Suen + skeleton-trace helper. **Reuse, don't reinvent.** Same code that handles Devanagari curves will handle Tibetan curves.
5. `tools/build-stroke-data-deva.ts` — copy this as your starting point.
6. `apps/alphaTiles/app/spike-deva.tsx` — clone this for `spike-bod.tsx` (validation route).

## Research checkpoints (do these IN ORDER, stop at the first hit)

### Checkpoint 1 — MRG-OHTC (PRIMARY candidate)

> "MRG-OHTC database … 910 character classes written by 130 persons … the first publicly available database for handwritten Tibetan research" (per Web search 2026-05-04).

Data shape: collected via digital tablet → has pen-position-over-time (online handwriting) → directly convertible to MMH `{ strokes, medians }` shape. This is what we want.

Tasks:
1. Find the MRG-OHTC download URL. Search terms that worked before: `"MRG-OHTC" tibetan online handwriting database`. Likely on a Chinese academic site (Beijing Multimedia & Reasoning Group?), maybe SourceForge.
2. Read the dataset license. Reject if research-only / non-commercial (same constraint as HPL UNIPEN — see `openspec/changes/game-india-deva/design.md § R1`).
3. Inspect the format. UNIPEN, JSON, custom CSV? Build a parser.
4. For each character class, pick one canonical sample (cleanest writer's pen-trace). Convert per-stroke pen positions to SVG path strings (`M x y L x y …`) + sample medians directly from pen positions (no skeletonization needed — pen tip IS the centerline).
5. Emit `tools/data/uchen-strokes/<char>.json` — same shape as `tools/data/devanagari-strokes/`. The `data-stroke-data` lib doesn't care about script.

If the license is permissive AND the data parses, **stop. You're done.** Move to validation (below).

### Checkpoint 2 — Wikimedia Commons fallback (UNLIKELY but cheap to check)

```bash
RTK_DISABLE=1 curl -sL --get -H "User-Agent: alphaTiles-research/1.0" \
  --data-urlencode "action=query" \
  --data-urlencode "list=allcategories" \
  --data-urlencode "acprefix=Tibetan stroke" \
  --data-urlencode "aclimit=20" \
  --data-urlencode "format=json" \
  https://commons.wikimedia.org/w/api.php
```

As of 2026-05-04 Commons has 50+ Tibetan-prefixed categories but none for stroke order. If a category appears later, run the existing `tools/build-stroke-data-deva.ts` against it (after generalising — the parser is mostly script-agnostic; only `extractCharFromTitle()`'s codepoint range needs to change for Tibetan U+0F00–U+0FFF).

### Checkpoint 3 — OpenPecha + BDRC + Monlam AI (UNLIKELY)

Tibetan OSS community. Per prior research (`openspec/changes/game-india-deva/design.md § R6`) they have fonts + corpora + spellcheck but NO stroke data. Re-check anyway via:
- <https://github.com/OpenPecha>
- <https://github.com/BDRC-DL>
- Monlam AI (Tibetan AI org) — search GitHub for "monlam tibetan stroke"

### Checkpoint 4 — TibHCR (REJECTED)

141k samples but **OFFLINE** (raster images only, no pen-stroke sequence). Useless for our purpose. Mention it in design.md as evaluated-and-rejected.

### Checkpoint 5 — Synthetic fallback (TOOLING SMOKE ONLY)

If checkpoints 1–4 all fail: prove the toolchain accepts Tibetan codepoints by generating SYNTHETIC data:
- Pick 5 base consonants: ཀ ཁ ག ང ཅ
- Render each glyph from Noto Sans Tibetan (OFL) via `node-canvas` to a 1024×1024 mask.
- Run `tools/skeletonize.ts` (already exists) to get a skeleton.
- Heuristic stroke order: split skeleton at junctions; order by Y descending then X ascending (Tibetan writes top-to-bottom, left-to-right).
- Emit per-char JSON.
- **CRITICAL: stroke ORDER is fabricated.** This validates the pipeline's coordinate handling and the `<HanziWriter>` lib accepts U+0F00 codepoints. It does NOT produce learner-correct data. Document this loudly in NOTICE and STATUS.

If you reach Checkpoint 5, write up findings + ask user whether to ship synthetic or wait for a real source.

## Validation steps (regardless of source)

1. **`tools/build-stroke-data-bod.ts`** following the `-deva.ts` pattern.
2. **Spike route**: `apps/alphaTiles/app/spike-bod.tsx` — clone of `spike-deva.tsx` with Tibetan chars instead of Devanagari.
3. **Web smoke**: `APP_LANG=eng ./nx run alphaTiles:web-export --skip-nx-cache` then puppeteer harness at `/tmp/pup/` against `/spike-bod`.
4. **Manual eyeball**: open the spike route in a real browser, click each char, hit ANIMATE. Confirm:
   - Character renders without visual gaps / disjoint pieces.
   - Stroke order matches a reference (use chris fynn's "How to write the Tibetan script": <https://sites.google.com/view/chrisfynn/home/tibetanscriptfonts/howtowritethetibetanscript>).
   - Quiz mode accepts a finger-trace and `onComplete` fires.

5. **License sanity check** before committing any extracted data:
   - Source license accepted: CC0, CC BY, CC BY-SA, public domain, OFL (font-derived).
   - Source license REJECTED: non-commercial, research-only, GPL/AGPL (incompatible with our app store releases).
   - Add per-source attribution to `apps/alphaTiles/NOTICE.md`.

## Acceptance criteria

To call this change "done":

- [ ] At least 5 Tibetan Uchen base consonants render correctly via `<HanziWriter>` in the spike route.
- [ ] License-clean for commercial use (CC BY-SA 3.0 minimum; or synthetic via OFL font).
- [ ] Reuses `tools/skeletonize.ts` — no new centerline-extraction code unless the source dataset has a fundamentally different shape (e.g. raw pen XY coords needing different normalization).
- [ ] STATUS.md hand-off written in the same style as `game-india-deva/STATUS.md`.
- [ ] Documents which path you took (1, 2, 3, or 5) and what the next agent should do for Phase 2 (more chars).

## What NOT to do

- **Do NOT hand-author stroke data per character.** If the source isn't permissive, stop and report — don't trace strokes by hand.
- **Do NOT generalise prematurely.** The yue/deva/bod libraries are clones of `feature-game-taiwan`. We refactor to a shared `feature-game-stroke` lib only when we have a third script confirmed shippable. (`game-bod-uchen` would be that third script — but only if data is real, not synthetic.)
- **Do NOT skip the Web SSR fix.** Lazy-import `@jamsch/react-native-hanzi-writer` inside `useEffect` — see `openspec/changes/game-taiwan/STATUS.md` for the worklets-TDZ root cause.
- **Do NOT trust label numbers in any new SVG corpus.** Sort by `transform="translate(tx,…)"` (see `game-india-deva/STATUS.md` Key learnings).

## Stretch goal (do AFTER core acceptance criteria)

Generalise `tools/build-stroke-data-{deva,bod}.ts` into a shared core: parse + license-gate + cache + extract. The script-specific bits are: codepoint range, Wikimedia category name, parser quirks (if any). ~200 LoC reuse achievable.

## Hand-off back to user

When done, write a STATUS.md following the `game-india-deva/STATUS.md` template:
- TL;DR for the next agent
- Done section with stroke counts table
- Key learnings (what was specific to Tibetan)
- Hand-off section with prioritised next-tasks
- Hard constraints carried forward

Then commit + ping user.

---

## Quick reference

| | Devanagari | Tibetan Uchen |
|---|---|---|
| Codepoint range | U+0900–U+097F | U+0F00–U+0FFF |
| Wikimedia category | `Devanagari stroke order (SVG)` (13 chars) | none confirmed |
| Likely OSS source | Wikimedia SVG (CC BY-SA 3.0) | MRG-OHTC online db (license TBD) |
| Stroke-order standardisation | strict | loose (per chris fynn) |
| Char count target (v1) | 12 (vowels) shipped | 5 (base consonants) |
| Pipeline reused | `tools/skeletonize.ts` | same |
| Game lib reused | `feature-game-taiwan` clone | `feature-game-taiwan` clone |
