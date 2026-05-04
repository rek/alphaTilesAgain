/**
 * build-stroke-data-bod.ts — SYNTHETIC stroke-data extractor for Tibetan Uchen.
 *
 * **Tooling-smoke only. NOT shippable.**
 *
 * Stroke order is FABRICATED. The four real-data sources for Uchen
 * (MRG-OHTC, Wikimedia, OpenPecha/BDRC/Monlam, TibHCR) are all license-blocked
 * or wrong-shape — see openspec/changes/game-bod-uchen/STATUS.md "Sources
 * evaluated" for the full table.
 *
 * What this script proves:
 *   1. The MMH JSON shape works for U+0F00–U+0FFF codepoints.
 *   2. `<HanziWriter>` accepts Tibetan characters at the React layer.
 *   3. The skeletonization pipeline (`tools/skeletonize.ts`) handles Tibetan
 *      glyph topologies (loops, junctions, vertical-stroke head bars).
 *
 * What it does NOT prove:
 *   - Learner-correct stroke order (we order subpaths top-to-bottom by bbox-Y;
 *     real Tibetan stroke order per chris fynn varies and follows pen-lift
 *     conventions, not glyph-subpath geometry).
 *   - Per-stroke decomposition matching how a Tibetan writer actually breaks
 *     the glyph into pen-strokes (we use the FONT's outline subpaths, which
 *     are TTF-author rendering choices, not stroke choices).
 *
 * Pipeline:
 *   1. Load Noto Serif Tibetan (OFL, system font on Linux/Debian/Ubuntu).
 *   2. For each char, get the glyph's vector path via opentype.js.
 *   3. Split d-string at each `M` command → one filled subpath = one
 *      synthetic "stroke".
 *   4. Sort subpaths top-to-bottom (Tibetan writes top-to-bottom).
 *   5. Compute global bbox; scale to 1024×1024 with 5% padding; centered.
 *      No Y-flip — opentype glyph paths use Y-up convention which matches
 *      the MMH output convention (unlike Wikimedia SVG → deva, which is
 *      Y-down and DOES need a flip).
 *   6. Skeletonize each baked subpath → MMH medians via existing
 *      `tools/skeletonize.ts` pipeline.
 *   7. Emit per-character JSON; write attribution + synthetic-data warning.
 *
 * Run: npx tsx tools/build-stroke-data-bod.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import opentype from 'opentype.js';
import { svgPathProperties as _svgPathProperties } from 'svg-path-properties';
import svgpath from 'svgpath';
import {
  rasterizePath,
  thinZhangSuen,
  traceSkeleton,
  samplePolyline,
  makeUnrasterize,
} from './skeletonize';

const svgPathProperties = (d: string) =>
  new (_svgPathProperties as unknown as new (s: string) => {
    getTotalLength(): number;
    getPointAtLength(pos: number): { x: number; y: number };
  })(d);

const REPO_ROOT = path.resolve(__dirname, '..');
const FONT_PATH = '/usr/share/fonts/truetype/noto/NotoSerifTibetan-Regular.ttf';
const OUT_DIR = path.join(REPO_ROOT, 'tools', 'data', 'uchen-strokes');
const ATTRIBUTION_PATH = path.join(OUT_DIR, '_attribution.json');

// Phase 1 char set — five base consonants per PROMPT.md acceptance criteria.
// Spans U+0F40–U+0F45 with one gap at U+0F43 (intentional — that codepoint
// is a digraph that maps to a different cluster).
const CHARS = ['ཀ', 'ཁ', 'ག', 'ང', 'ཅ'];

const TARGET_BOX = 1024;
const PADDING_FRACTION = 0.05; // 5% margin so the glyph doesn't kiss the edge
const MEDIAN_COUNT = 15;
const ROUND_PRECISION = 1;

try {
  main();
} catch (e) {
  console.error('[build-stroke-data-bod] fatal:', e);
  process.exit(1);
}

function main(): void {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const buf = fs.readFileSync(FONT_PATH);
  const font = opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
  console.log(
    `[build-stroke-data-bod] loaded ${path.basename(FONT_PATH)} unitsPerEm=${font.unitsPerEm}`,
  );

  const attribution: Attribution[] = [];
  const covered: string[] = [];
  const rejected: Array<{ char: string; reason: string }> = [];

  for (const ch of CHARS) {
    const cp = ch.codePointAt(0)!;
    const glyph = font.charToGlyph(ch);
    if (!glyph || glyph.index === 0) {
      rejected.push({ char: ch, reason: 'glyph not found in font' });
      continue;
    }

    const dRaw = glyph.path.toPathData(2);
    if (!dRaw) {
      rejected.push({ char: ch, reason: 'empty path' });
      continue;
    }

    const result = extractStrokesFromGlyphPath(dRaw);
    if (result.error) {
      rejected.push({ char: ch, reason: result.error });
      continue;
    }

    fs.writeFileSync(
      path.join(OUT_DIR, `${ch}.json`),
      JSON.stringify({ character: ch, strokes: result.strokes, medians: result.medians }) + '\n',
      'utf-8',
    );

    attribution.push({
      character: ch,
      codepoint: `U+${cp.toString(16).toUpperCase().padStart(4, '0')}`,
      glyphName: glyph.name ?? null,
      strokeCount: result.strokes.length,
    });
    covered.push(ch);
  }

  fs.writeFileSync(
    ATTRIBUTION_PATH,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        source: {
          font: 'Noto Serif Tibetan (Regular)',
          path: FONT_PATH,
          license: 'SIL Open Font License 1.1',
          licenseUrl: 'https://scripts.sil.org/OFL',
        },
        warning:
          'SYNTHETIC STROKE ORDER. Subpaths sorted top-to-bottom by bbox; real Tibetan stroke order per chris fynn writing guide is not encoded. Use for tooling-smoke ONLY, not for learner-facing release.',
        entries: attribution,
      },
      null,
      2,
    ) + '\n',
    'utf-8',
  );

  console.log(
    `[build-stroke-data-bod] covered=${covered.length} rejected=${rejected.length} chars=[${covered.join(' ')}]`,
  );
  for (const r of rejected) {
    console.warn(`[build-stroke-data-bod] reject ${r.char}: ${r.reason}`);
  }
}

interface ExtractResult {
  strokes: string[];
  medians: number[][][];
  error?: string;
}

function extractStrokesFromGlyphPath(dRaw: string): ExtractResult {
  // Normalise: absolute, no arcs, no shorthand. Then split at each M.
  const dNorm = svgpath(dRaw).abs().unarc().unshort().toString();
  const subpaths = splitOnMoveTo(dNorm);
  if (subpaths.length === 0) {
    return { strokes: [], medians: [], error: 'no subpaths after split' };
  }

  // Compute global bbox over all subpaths.
  const bboxes = subpaths.map(measureBbox);
  const union = unionOf(bboxes);
  const w = Math.max(1e-6, union.maxX - union.minX);
  const h = Math.max(1e-6, union.maxY - union.minY);
  const padding = TARGET_BOX * PADDING_FRACTION;
  const usable = TARGET_BOX - 2 * padding;
  const scale = Math.min(usable / w, usable / h);
  const offsetX = (TARGET_BOX - w * scale) / 2;
  const offsetY = (TARGET_BOX - h * scale) / 2;

  // Bake transform: input is Y-up (opentype font convention), MMH output is
  // also Y-up — no flip. translate(-minX,-minY) → scale(s,s) → translate(off).
  // Per-subpath ordering within the array matters for stroke order; we sort
  // by post-transform bbox top (max Y in MMH-Y-up convention).
  type Stroke = { d: string; topY: number; bboxIdx: number };
  const transformed: Stroke[] = subpaths.map((d, i) => {
    const baked = svgpath(d)
      .translate(-union.minX, -union.minY)
      .scale(scale, scale)
      .translate(offsetX, offsetY)
      .abs()
      .round(ROUND_PRECISION)
      .toString();
    const localBb = measureBbox(baked);
    return { d: baked, topY: localBb.maxY, bboxIdx: i };
  });

  // Tibetan writes top-to-bottom. In MMH Y-up convention, "top" = larger Y.
  // Sort descending so the topmost subpath is stroke 0.
  transformed.sort((a, b) => b.topY - a.topY);

  const finalStrokes = transformed.map((t) => t.d);
  const finalMedians = finalStrokes.map((d) => sampleCenterlineMedians(d, MEDIAN_COUNT));

  return { strokes: finalStrokes, medians: finalMedians };
}

function splitOnMoveTo(d: string): string[] {
  // Split on each M/m at the start of a sub-command. svgpath().toString() emits
  // capital M with absolute coords, separated by spaces.
  const parts = d.split(/(?=\s*[Mm]\s*)/).map((s) => s.trim()).filter(Boolean);
  return parts;
}

interface BBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

function measureBbox(d: string): BBox {
  const props = svgPathProperties(d);
  const len = props.getTotalLength();
  if (!Number.isFinite(len) || len === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  }
  const SAMPLES = 256;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (let i = 0; i <= SAMPLES; i++) {
    const p = props.getPointAtLength((i / SAMPLES) * len);
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }
  if (!Number.isFinite(minX)) return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  return { minX, minY, maxX, maxY };
}

function unionOf(bs: BBox[]): BBox {
  if (bs.length === 0) return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const b of bs) {
    if (b.minX < minX) minX = b.minX;
    if (b.minY < minY) minY = b.minY;
    if (b.maxX > maxX) maxX = b.maxX;
    if (b.maxY > maxY) maxY = b.maxY;
  }
  return { minX, minY, maxX, maxY };
}

function sampleCenterlineMedians(d: string, totalSamples: number): number[][] {
  if (!d || d.length === 0) return [];
  const bbox = measureBbox(d);
  if (bbox.maxX - bbox.minX < 1 || bbox.maxY - bbox.minY < 1) return [];

  const { mask, w, h } = rasterizePath(d, bbox);
  thinZhangSuen(mask, w, h);
  const skelPath = traceSkeleton(mask, w, h);
  if (skelPath.length === 0) return [];

  const samples = samplePolyline(skelPath, totalSamples);
  const unraster = makeUnrasterize(bbox);
  return samples.map(([rx, ry]) => {
    const [x, y] = unraster(rx, ry);
    return [
      Math.max(0, Math.min(TARGET_BOX, Math.round(x))),
      Math.max(0, Math.min(TARGET_BOX, Math.round(y))),
    ];
  });
}

interface Attribution {
  character: string;
  codepoint: string;
  glyphName: string | null;
  strokeCount: number;
}
