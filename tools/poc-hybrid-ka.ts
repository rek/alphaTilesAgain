/**
 * PoC: font-quality glyph SHAPE from Noto Sans Devanagari +
 *      stroke ORDER + per-pixel segmentation from the Wikimedia GIF.
 *
 * Pipeline (for क only):
 *   1. Render Noto Sans Devanagari "क" via node-canvas at high resolution
 *      → font glyph mask.
 *   2. Decode the GIF, derive per-stroke pen-trail masks via frame-diff +
 *      connectivity-based stroke boundary detection (same as Phase 2).
 *   3. Compute affine transform from GIF bbox → font bbox so the two
 *      coordinate systems align.
 *   4. Per font-mask pixel: assign the stroke index whose transformed
 *      pen-trail mask is closest. Distance via 2D distance transform on
 *      each stroke's mask, picking the smallest distance.
 *   5. Per stroke: extract the labeled pixel region → potrace → smooth
 *      Bézier d-string.
 *   6. Emit a JSON in the same shape as the existing GIF extractor for
 *      drop-in replacement in spike-deva.tsx.
 *
 * Run: npx tsx tools/poc-hybrid-ka.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { GifReader } from 'omggif';
import { createCanvas, registerFont } from 'canvas';
import potrace from 'potrace';
import svgpath from 'svgpath';
import { thinZhangSuen, traceSkeleton, samplePolyline } from './skeletonize';

const REPO_ROOT = path.resolve(__dirname, '..');
const GIF_PATH = path.join(REPO_ROOT, 'tools', 'data', 'wikimedia-deva-gif-cache', 'क.gif');
const OUT_PATH = path.join(REPO_ROOT, 'tools', 'data', 'devanagari-strokes', 'क.json');

const FONT_PATH = '/usr/share/fonts/truetype/noto/NotoSansDevanagari-Regular.ttf';
const FONT_FAMILY = 'NotoDeva';
const TARGET_BOX = 1024;
const FONT_RENDER = 1024; // glyph render resolution
const MEDIAN_COUNT = 15;

main().catch((e) => {
  console.error('[poc-hybrid] fatal:', e);
  process.exit(1);
});

async function main(): Promise<void> {
  registerFont(FONT_PATH, { family: FONT_FAMILY });

  // Step 1: render font glyph at high resolution.
  console.log('[poc] rendering क from Noto Sans Devanagari…');
  const fontMask = renderGlyphMask('क');
  console.log(`  font mask: ${fontMask.bbox.maxX - fontMask.bbox.minX}×${fontMask.bbox.maxY - fontMask.bbox.minY} px in ${FONT_RENDER}×${FONT_RENDER} canvas`);

  // Step 2: decode GIF, get per-stroke pen-trail masks.
  console.log('[poc] decoding GIF + segmenting strokes…');
  const gif = decodeGifStrokes(fs.readFileSync(GIF_PATH));
  console.log(`  GIF: ${gif.w}×${gif.h}, ${gif.strokes.length} strokes, ${gif.totalFrames} frames`);

  // Step 3: align coordinate systems (GIF bbox → font bbox).
  const align = computeAffine(gif.bbox, fontMask.bbox);
  console.log(`  align: GIF (${gif.w}×${gif.h}) → font (${FONT_RENDER}×${FONT_RENDER})`);

  // Step 4: per font-mask pixel, label by nearest GIF stroke.
  console.log('[poc] labeling font pixels by stroke ownership…');
  const labels = labelFontPixels(fontMask.mask, FONT_RENDER, gif.strokes, gif.w, gif.h, align);

  // Step 5: per stroke, extract labeled pixels.
  console.log('[poc] extracting per-stroke font regions…');
  const strokeMasks: Array<{ subMask: Uint8Array; pixelCount: number }> = [];
  for (let k = 0; k < gif.strokes.length; k++) {
    const subMask = new Uint8Array(FONT_RENDER * FONT_RENDER);
    let count = 0;
    for (let i = 0; i < labels.length; i++) {
      if (labels[i] === k + 1) { subMask[i] = 1; count++; }
    }
    strokeMasks.push({ subMask, pixelCount: count });
  }

  // Compute the GLYPH bbox so the final output fits the 0..1024 MMH box with
  // padding. Using FONT_RENDER coords as-is leaves the glyph at ~half size
  // (it occupies only the middle of the 1024×1024 canvas).
  const PAD = 64; // px in the MMH 1024 frame
  const fontBb = fontMask.bbox;
  const bbW = Math.max(1e-6, fontBb.maxX - fontBb.minX);
  const bbH = Math.max(1e-6, fontBb.maxY - fontBb.minY);
  const fitScale = Math.min((TARGET_BOX - 2 * PAD) / bbW, (TARGET_BOX - 2 * PAD) / bbH);
  const fitOffsetX = (TARGET_BOX - bbW * fitScale) / 2;
  const fitOffsetY = (TARGET_BOX - bbH * fitScale) / 2;
  // svgpath chain (right→left applied to coords):
  //   translate(fitOffsetX, TARGET_BOX - fitOffsetY)  ← center + Y-base
  //   scale(fitScale, -fitScale)                       ← scale + Y-flip
  //   translate(-fontBb.minX, -fontBb.minY)            ← bbox to origin
  const remapD = (d: string): string =>
    svgpath(d)
      .translate(-fontBb.minX, -fontBb.minY)
      .scale(fitScale, -fitScale)
      .translate(fitOffsetX, TARGET_BOX - fitOffsetY)
      .abs()
      .round(1)
      .toString();
  const remapPoint = (fx: number, fy: number): [number, number] => {
    const nx = (fx - fontBb.minX) * fitScale + fitOffsetX;
    const ny = TARGET_BOX - ((fy - fontBb.minY) * fitScale + fitOffsetY);
    return [
      Math.max(0, Math.min(TARGET_BOX, Math.round(nx))),
      Math.max(0, Math.min(TARGET_BOX, Math.round(ny))),
    ];
  };

  const finalStrokes: string[] = [];
  const finalMedians: number[][][] = [];
  for (let k = 0; k < strokeMasks.length; k++) {
    const { subMask, pixelCount } = strokeMasks[k];
    console.log(`  stroke ${k + 1}: ${pixelCount} font px labeled`);
    if (pixelCount < 16) continue;
    // Save debug PNG for inspection.
    {
      const dbg = createCanvas(FONT_RENDER, FONT_RENDER);
      const dctx = dbg.getContext('2d');
      dctx.fillStyle = 'white';
      dctx.fillRect(0, 0, FONT_RENDER, FONT_RENDER);
      dctx.fillStyle = 'black';
      for (let y = 0; y < FONT_RENDER; y++) {
        for (let x = 0; x < FONT_RENDER; x++) {
          if (subMask[y * FONT_RENDER + x]) dctx.fillRect(x, y, 1, 1);
        }
      }
      fs.writeFileSync(`/tmp/poc-stroke-${k + 1}.png`, dbg.toBuffer('image/png'));
    }
    const d = await maskToPotraceSvg(subMask, FONT_RENDER, FONT_RENDER);
    if (!d) continue;
    finalStrokes.push(remapD(d));

    // Medians from the GIF CENTERLINE (the artist's actual pen motion),
    // mapped through the GIF→font affine and then the font→MMH remap.
    // Skeletonising the BFS-labeled region instead would fork wherever
    // segmentation bleed put two stroke parts in the same label, producing
    // a centerline that doesn't trace the real writing motion.
    const gifStroke = gif.strokes[k];
    const centerlineInFont = gifStroke.centerline.map(([x, y]) => align.apply(x, y));
    const remapped = centerlineInFont.map(([fx, fy]) => remapPoint(fx, fy));
    const medians = samplePolyline(remapped, MEDIAN_COUNT).map(([x, y]) => [
      Math.round(x), Math.round(y),
    ]);
    finalMedians.push(medians);
    console.log(`  stroke ${k + 1}: ${pixelCount} font px → ${finalStrokes[finalStrokes.length - 1].length} chars d-string, ${medians.length} medians`);
  }

  fs.writeFileSync(
    OUT_PATH,
    JSON.stringify({
      character: 'क',
      strokes: finalStrokes,
      medians: finalMedians,
      source: 'gif+font-hybrid',
    }) + '\n',
    'utf-8',
  );
  console.log(`[poc] wrote ${OUT_PATH} — ${finalStrokes.length} strokes`);
}

// ---------------------------------------------------------------------------
// Font glyph rendering
// ---------------------------------------------------------------------------

interface FontMaskResult {
  mask: Uint8Array;
  bbox: BBox;
}

function renderGlyphMask(ch: string): FontMaskResult {
  const canvas = createCanvas(FONT_RENDER, FONT_RENDER);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, FONT_RENDER, FONT_RENDER);
  ctx.fillStyle = 'black';
  ctx.font = `${FONT_RENDER * 0.7}px ${FONT_FAMILY}`;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  ctx.fillText(ch, FONT_RENDER / 2, FONT_RENDER / 2);

  // Capture mask + bbox.
  const img = ctx.getImageData(0, 0, FONT_RENDER, FONT_RENDER);
  const mask = new Uint8Array(FONT_RENDER * FONT_RENDER);
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (let y = 0; y < FONT_RENDER; y++) {
    for (let x = 0; x < FONT_RENDER; x++) {
      const j = (y * FONT_RENDER + x) * 4;
      const v = (img.data[j] + img.data[j + 1] + img.data[j + 2]) / 3;
      if (v < 128) {
        mask[y * FONT_RENDER + x] = 1;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  return { mask, bbox: { minX, minY, maxX, maxY } };
}

// ---------------------------------------------------------------------------
// GIF stroke segmentation (lifted from build-stroke-data-deva-gif.ts)
// ---------------------------------------------------------------------------

interface GifStrokes {
  w: number;
  h: number;
  strokes: Array<{ mask: Uint8Array; centerline: [number, number][] }>;
  bbox: BBox;
  totalFrames: number;
}

function decodeGifStrokes(buf: Buffer): GifStrokes {
  const reader = new GifReader(buf);
  const w = reader.width;
  const h = reader.height;
  const N = reader.numFrames();
  const SKIP = 2;
  const BOUNDARY_THRESHOLD = 50;

  const darks: Uint8Array[] = [];
  for (let i = 0; i < N; i++) {
    const rgba = new Uint8Array(w * h * 4);
    reader.decodeAndBlitFrameRGBA(i, rgba);
    const dark = new Uint8Array(w * h);
    for (let j = 0; j < w * h; j++) {
      const a = rgba[j * 4 + 3];
      const v = (rgba[j * 4] + rgba[j * 4 + 1] + rgba[j * 4 + 2]) / 3;
      dark[j] = a > 64 && v < 128 ? 1 : 0;
    }
    darks.push(dark);
  }

  interface F { idx: number; newMask: Uint8Array; cx: number; cy: number; }
  const frames: F[] = [];
  for (let i = SKIP; i < N; i++) {
    const newMask = new Uint8Array(w * h);
    let count = 0, sx = 0, sy = 0;
    const prev = darks[i - 1], cur = darks[i];
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const j = y * w + x;
        if (cur[j] && !prev[j]) { newMask[j] = 1; count++; sx += x; sy += y; }
      }
    }
    if (count > 0) frames.push({ idx: i, newMask, cx: sx / count, cy: sy / count });
  }

  const segments: F[][] = [[frames[0]]];
  for (let k = 1; k < frames.length; k++) {
    const prev = frames[k - 1], cur = frames[k];
    const connected = masksAdjacent(prev.newMask, cur.newMask, w, h);
    const jump = Math.hypot(cur.cx - prev.cx, cur.cy - prev.cy);
    if (!connected || jump > BOUNDARY_THRESHOLD) segments.push([cur]);
    else segments[segments.length - 1].push(cur);
  }

  const strokes: GifStrokes['strokes'] = [];
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const seg of segments) {
    const mask = new Uint8Array(w * h);
    for (const f of seg) {
      for (let j = 0; j < w * h; j++) if (f.newMask[j]) mask[j] = 1;
    }
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (mask[y * w + x]) {
          if (x < minX) minX = x; if (x > maxX) maxX = x;
          if (y < minY) minY = y; if (y > maxY) maxY = y;
        }
      }
    }
    const skel = new Uint8Array(mask);
    thinZhangSuen(skel, w, h);
    const centerline = traceSkeleton(skel, w, h);
    strokes.push({ mask, centerline });
  }
  return { w, h, strokes, bbox: { minX, minY, maxX, maxY }, totalFrames: N };
}

function masksAdjacent(a: Uint8Array, b: Uint8Array, w: number, h: number): boolean {
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (!a[y * w + x]) continue;
      for (let dy = -1; dy <= 1; dy++) {
        const ny = y + dy; if (ny < 0 || ny >= h) continue;
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx; if (nx < 0 || nx >= w) continue;
          if (b[ny * w + nx]) return true;
        }
      }
    }
  }
  return false;
}

// ---------------------------------------------------------------------------
// Affine alignment (GIF bbox → font bbox)
// ---------------------------------------------------------------------------

interface BBox { minX: number; minY: number; maxX: number; maxY: number; }

interface Affine {
  apply(x: number, y: number): [number, number];
}

function computeAffine(gif: BBox, font: BBox): Affine {
  // Scale + translate so GIF bbox maps onto FONT bbox (uniform scale,
  // preserving aspect by fitting the smaller axis with padding).
  const gifW = gif.maxX - gif.minX;
  const gifH = gif.maxY - gif.minY;
  const fontW = font.maxX - font.minX;
  const fontH = font.maxY - font.minY;
  const sx = fontW / gifW;
  const sy = fontH / gifH;
  return {
    apply(x: number, y: number): [number, number] {
      const fx = (x - gif.minX) * sx + font.minX;
      const fy = (y - gif.minY) * sy + font.minY;
      return [fx, fy];
    },
  };
}

// ---------------------------------------------------------------------------
// Per-pixel labeling
// ---------------------------------------------------------------------------

/**
 * For each font-mask pixel, find which GIF stroke owns it. Strategy:
 * compute distance transform from each stroke's mask (in font coords),
 * assign each pixel to the stroke with the smallest distance. Distance is
 * approximated via Chebyshev (8-neighbour BFS), good enough for nearest-
 * stroke decisions at this resolution.
 *
 * Tie-breaker: lowest stroke index (= drawn earliest).
 */
function labelFontPixels(
  fontMask: Uint8Array,
  fontSize: number,
  strokes: Array<{ mask: Uint8Array; centerline: [number, number][] }>,
  _gifW: number,
  _gifH: number,
  align: Affine,
): Uint8Array {
  // BFS seeds = each stroke's CENTERLINE (1-pixel-wide skeleton from the
  // GIF). Using the full pen-trail mask as seeds bleeds across strokes
  // when adjacent strokes overlap; centerlines are sparser and stay closer
  // to the true pen motion.
  const projected: Uint8Array[] = strokes.map((s) => {
    const m = new Uint8Array(fontSize * fontSize);
    for (const [x, y] of s.centerline) {
      const [fx, fy] = align.apply(x, y);
      const ix = Math.round(fx);
      const iy = Math.round(fy);
      if (ix >= 0 && ix < fontSize && iy >= 0 && iy < fontSize) {
        m[iy * fontSize + ix] = 1;
      }
    }
    return m;
  });

  // Multi-source BFS: for each font pixel, the smallest distance to any
  // stroke's projected mask, plus the stroke index that's nearest.
  const labels = new Uint8Array(fontSize * fontSize);
  const dist = new Int32Array(fontSize * fontSize).fill(0x7fffffff);
  const queue: number[] = [];

  // Seed: every projected pixel of each stroke is distance 0 with that
  // stroke's index. Lower index wins on collision.
  for (let k = projected.length - 1; k >= 0; k--) {
    const p = projected[k];
    for (let i = 0; i < p.length; i++) {
      if (p[i]) {
        labels[i] = k + 1; // 1-indexed; 0 = unassigned
        dist[i] = 0;
      }
    }
  }
  for (let i = 0; i < dist.length; i++) {
    if (dist[i] === 0) queue.push(i);
  }

  // BFS expanding label by 8-neighbour adjacency.
  let head = 0;
  while (head < queue.length) {
    const idx = queue[head++];
    const cx = idx % fontSize;
    const cy = (idx - cx) / fontSize;
    const myDist = dist[idx];
    const myLabel = labels[idx];
    for (let dy = -1; dy <= 1; dy++) {
      const ny = cy + dy; if (ny < 0 || ny >= fontSize) continue;
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const nx = cx + dx; if (nx < 0 || nx >= fontSize) continue;
        const nIdx = ny * fontSize + nx;
        if (myDist + 1 < dist[nIdx]) {
          dist[nIdx] = myDist + 1;
          labels[nIdx] = myLabel;
          queue.push(nIdx);
        }
      }
    }
  }

  // Mask labels to font glyph only: pixels outside the font glyph become 0.
  for (let i = 0; i < fontMask.length; i++) {
    if (!fontMask[i]) labels[i] = 0;
  }
  return labels;
}

// ---------------------------------------------------------------------------
// Potrace helper (shared with build-stroke-data-deva-gif.ts; inlined for PoC)
// ---------------------------------------------------------------------------

async function maskToPotraceSvg(
  mask: Uint8Array,
  w: number,
  h: number,
): Promise<string | null> {
  const canvas = createCanvas(w, h);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = 'black';
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (mask[y * w + x]) ctx.fillRect(x, y, 1, 1);
    }
  }
  // Slight blur on source-pixel edges.
  const blurred = createCanvas(w, h);
  // node-canvas exposes `filter` on its 2D context; DOM type doesn't.
  const bctx = blurred.getContext('2d') as ReturnType<typeof blurred.getContext> & { filter: string };
  bctx.filter = 'blur(1px)';
  bctx.drawImage(canvas, 0, 0);
  const png = blurred.toBuffer('image/png');

  return new Promise((resolve) => {
    potrace.trace(
      png,
      { threshold: 128, turdSize: 4, optCurve: true, optTolerance: 0.6, alphaMax: 1.3 },
      (err: unknown, svg: string) => {
        if (err) { resolve(null); return; }
        const m = svg.match(/d="([^"]+)"/);
        resolve(m ? m[1] : null);
      },
    );
  });
}
