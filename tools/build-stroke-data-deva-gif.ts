/**
 * build-stroke-data-deva-gif.ts
 *
 * Phase 2 GIF extractor for Devanagari consonants. Source: Wikimedia Commons
 * Category:Devanagari stroke order (GIF) (~72 files; mostly CC BY 3.0).
 * Complements the SVG extractor (Phase 1) which only covered 13 chars.
 *
 * Pipeline:
 *   1. List the category via Wikimedia API.
 *   2. Reject files whose license isn't permissive (same allowlist as -deva.ts).
 *   3. Cache the raw GIF.
 *   4. Decode all frames via omggif. Skip frame 0 (preview = full character)
 *      and frame 1 (animation reset = nearly empty).
 *   5. Per remaining frame n: compute "new dark pixels" = (frame_n is dark)
 *      AND (frame_(n-1) is bright). Track centroid of new pixels.
 *   6. When centroid jumps by > BOUNDARY_THRESHOLD between consecutive frames,
 *      mark a stroke boundary.
 *   7. Per stroke segment: union of new-pixels masks → tools/skeletonize.ts
 *      Zhang-Suen thinning + skeleton trace → polyline.
 *   8. Sample medians along the polyline; build a smoothed SVG path d-string.
 *   9. Compute global bbox across all strokes; rescale to 0..1024 box,
 *      Y-flipped to MMH coords.
 *  10. Emit per-character JSON in `tools/data/devanagari-strokes/<char>.json`
 *      (same dir as Phase 1 SVG output — consonants extend the vowel set).
 *
 * Run: npx tsx tools/build-stroke-data-deva-gif.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { GifReader } from 'omggif';
import { createCanvas } from 'canvas';
import potrace from 'potrace';
import svgpath from 'svgpath';
import {
  thinZhangSuen,
  traceSkeleton,
  samplePolyline,
} from './skeletonize';

const REPO_ROOT = path.resolve(__dirname, '..');
const CACHE_DIR = path.join(REPO_ROOT, 'tools', 'data', 'wikimedia-deva-gif-cache');
const OUT_DIR = path.join(REPO_ROOT, 'tools', 'data', 'devanagari-strokes');
const ATTRIBUTION_PATH = path.join(CACHE_DIR, '_attribution.json');

const CATEGORY = 'Devanagari stroke order (GIF)';
const WIKI_API = 'https://commons.wikimedia.org/w/api.php';
const USER_AGENT = 'alphaTiles-research/1.0 (rekarnar@gmail.com)';

const ACCEPTED_LICENSES = new Set([
  'cc-by-3.0', 'cc-by-sa-3.0', 'cc-by-2.0', 'cc-by-sa-2.0',
  'cc-by-1.0', 'cc-by-sa-1.0', 'cc-by-4.0', 'cc-by-sa-4.0',
  'cc0', 'public domain', 'pd',
]);

const TARGET_BOX = 1024;
const MEDIAN_COUNT = 15;
/**
 * Centroid jump (px) above which we declare a stroke boundary. Tuned on क
 * (3-stroke reference): jumps were 65, 69, 168 with intra-stroke spread up to
 * ~32. Threshold of 50 cleanly separates the two populations.
 */
const BOUNDARY_THRESHOLD = 50;
const SKIP_INITIAL_FRAMES = 2; // frame 0 = full preview, frame 1 = reset
const ROUND_PRECISION = 1;

main().catch((e) => {
  console.error('[build-stroke-data-deva-gif] fatal:', e);
  process.exit(1);
});

async function main(): Promise<void> {
  ensureDir(CACHE_DIR);
  ensureDir(OUT_DIR);

  const files = await listCategoryFiles(CATEGORY);
  console.log(`[build-stroke-data-deva-gif] category lists ${files.length} files`);

  const attribution: Attribution[] = [];
  const covered: string[] = [];
  const rejected: Array<{ title: string; reason: string }> = [];

  for (const title of files) {
    const ch = extractCharFromTitle(title);
    if (!ch) {
      rejected.push({ title, reason: 'cannot extract character from filename' });
      continue;
    }

    const meta = await fetchImageInfo(title);
    if (!meta) {
      rejected.push({ title, reason: 'no imageinfo from API' });
      continue;
    }

    const licenseKey = (meta.license ?? '').toLowerCase().trim();
    if (!ACCEPTED_LICENSES.has(licenseKey)) {
      rejected.push({ title, reason: `license '${licenseKey}' not in allowlist` });
      continue;
    }

    const cachePath = path.join(CACHE_DIR, `${ch}.gif`);
    if (!fs.existsSync(cachePath)) {
      const buf = await fetchBinary(meta.url);
      if (!buf) {
        rejected.push({ title, reason: 'failed to download GIF' });
        continue;
      }
      fs.writeFileSync(cachePath, buf);
    }

    // If we already have an SVG-derived JSON for this char (Phase 1 covers
    // some), don't overwrite — SVG is higher-fidelity. The vowel set comes
    // from Phase 1; GIF mostly has consonants the SVG corpus lacks.
    const outPath = path.join(OUT_DIR, `${ch}.json`);
    const phase1Exists = fs.existsSync(outPath) &&
      JSON.parse(fs.readFileSync(outPath, 'utf-8')).source !== 'gif';
    if (phase1Exists) {
      // Skip — but still record attribution so we don't lose it.
      // Actually: prefer the existing higher-fidelity SVG output.
      rejected.push({ title, reason: `skipping ${ch}; SVG-derived output already exists` });
      continue;
    }

    const buf = fs.readFileSync(cachePath);
    const result = await extractFromGif(buf);
    if (result.error) {
      rejected.push({ title, reason: result.error });
      continue;
    }

    fs.writeFileSync(
      outPath,
      JSON.stringify({
        character: ch,
        strokes: result.strokes,
        medians: result.medians,
        source: 'gif',
      }) + '\n',
      'utf-8',
    );

    attribution.push({
      character: ch,
      title,
      artist: meta.artist,
      license: licenseKey,
      sourceUrl: meta.descriptionUrl ?? meta.url,
      strokeCount: result.strokes.length,
      frameCount: result.frameCount,
      boundaries: result.boundaries,
    });
    covered.push(ch);
  }

  fs.writeFileSync(
    ATTRIBUTION_PATH,
    JSON.stringify({ generatedAt: new Date().toISOString(), entries: attribution }, null, 2) + '\n',
    'utf-8',
  );

  console.log(
    `[build-stroke-data-deva-gif] covered=${covered.length} rejected=${rejected.length} chars=[${covered.join(' ')}]`,
  );
  for (const r of rejected) {
    console.warn(`[build-stroke-data-deva-gif] reject ${r.title}: ${r.reason}`);
  }
}

// ---------------------------------------------------------------------------
// Wikimedia API (copy of -deva.ts; refactor when a 3rd extractor lands)
// ---------------------------------------------------------------------------

async function fetchWithRetry(url: string | URL, attempts = 4): Promise<Response | null> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
      if (res.ok) return res;
      lastErr = `HTTP ${res.status}`;
    } catch (e) {
      lastErr = e;
    }
    await new Promise((r) => setTimeout(r, 500 * Math.pow(2, i)));
  }
  console.warn(`[build-stroke-data-deva-gif] fetch failed: ${url} (${String(lastErr)})`);
  return null;
}

async function listCategoryFiles(category: string): Promise<string[]> {
  const url = new URL(WIKI_API);
  url.searchParams.set('action', 'query');
  url.searchParams.set('list', 'categorymembers');
  url.searchParams.set('cmtitle', `Category:${category}`);
  url.searchParams.set('cmlimit', '200');
  url.searchParams.set('cmtype', 'file');
  url.searchParams.set('format', 'json');
  const res = await fetchWithRetry(url);
  if (!res) die('category list failed');
  const data: WikiCategoryResp = await res.json();
  return (data.query?.categorymembers ?? []).map((f) => f.title);
}

async function fetchImageInfo(
  title: string,
): Promise<{ url: string; descriptionUrl?: string; license?: string; artist?: string } | null> {
  const url = new URL(WIKI_API);
  url.searchParams.set('action', 'query');
  url.searchParams.set('titles', title);
  url.searchParams.set('prop', 'imageinfo');
  url.searchParams.set('iiprop', 'url|extmetadata');
  url.searchParams.set('format', 'json');
  const res = await fetchWithRetry(url);
  if (!res) return null;
  const data: WikiImageInfoResp = await res.json();
  const pages = data.query?.pages ?? {};
  for (const pid of Object.keys(pages)) {
    const info = pages[pid].imageinfo?.[0];
    if (!info) continue;
    const em = info.extmetadata ?? {};
    return {
      url: info.url ?? '',
      descriptionUrl: info.descriptionurl,
      license: em.License?.value,
      artist: stripHtml(em.Artist?.value),
    };
  }
  return null;
}

async function fetchBinary(url: string): Promise<Buffer | null> {
  const res = await fetchWithRetry(url);
  if (!res) return null;
  const buf = await res.arrayBuffer();
  return Buffer.from(buf);
}

// ---------------------------------------------------------------------------
// Filename → character. Two GIF naming conventions in the corpus:
//   "File:Deva-X-order.gif"            ← newer; Unicode in middle
//   "File:Devanagari <ipa> X.gif"      ← older; Unicode at end
// In both cases we just pull the first Devanagari codepoint.
// ---------------------------------------------------------------------------

function extractCharFromTitle(title: string): string | null {
  for (const ch of title) {
    const cp = ch.codePointAt(0);
    if (cp === undefined) continue;
    if (cp >= 0x0900 && cp <= 0x097f) return ch;
  }
  return null;
}

// ---------------------------------------------------------------------------
// GIF → strokes via frame-diff + centroid-tracked stroke boundaries
// ---------------------------------------------------------------------------

interface ExtractResult {
  strokes: string[];
  medians: number[][][];
  frameCount?: number;
  boundaries?: number[];
  error?: string;
}

export async function extractFromGif(buf: Buffer): Promise<ExtractResult> {
  const reader = new GifReader(buf);
  const w = reader.width;
  const h = reader.height;
  const N = reader.numFrames();
  if (N < SKIP_INITIAL_FRAMES + 2) {
    return { strokes: [], medians: [], error: `too few frames (${N})` };
  }

  // Decode all frames into binary "dark" masks.
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

  // Per-frame "new dark" mask = darks[n] AND NOT darks[n-1]. Track centroid.
  // Skip the first two frames (full preview + animation reset).
  interface FrameInfo {
    idx: number;
    newMask: Uint8Array;
    cx: number;
    cy: number;
    count: number;
  }
  const frames: FrameInfo[] = [];
  for (let i = SKIP_INITIAL_FRAMES; i < N; i++) {
    const newMask = new Uint8Array(w * h);
    let count = 0;
    let sumX = 0;
    let sumY = 0;
    const prev = darks[i - 1];
    const cur = darks[i];
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const j = y * w + x;
        if (cur[j] && !prev[j]) {
          newMask[j] = 1;
          count++;
          sumX += x;
          sumY += y;
        }
      }
    }
    if (count > 0) {
      frames.push({ idx: i, newMask, cx: sumX / count, cy: sumY / count, count });
    }
  }
  if (frames.length === 0) {
    return { strokes: [], medians: [], error: 'no animated frames detected' };
  }

  // Detect stroke boundaries by spatial CONNECTIVITY: when the pen lifts and
  // restarts elsewhere, the current frame's new-pixel cluster has no overlap
  // and no 8-neighbour adjacency with the previous frame's cluster. This is
  // robust across GIFs with widely different frame counts (centroid-distance
  // thresholding doesn't generalise — different artists pace the animation
  // differently). Centroid jump is kept as a SECONDARY signal for cases where
  // brief connectivity overlaps occur during pen lift.
  const segments: FrameInfo[][] = [[frames[0]]];
  const boundaries: number[] = [];
  for (let k = 1; k < frames.length; k++) {
    const prev = frames[k - 1];
    const cur = frames[k];
    const connected = masksAreAdjacent(prev.newMask, cur.newMask, w, h);
    const jump = Math.hypot(cur.cx - prev.cx, cur.cy - prev.cy);
    const isBoundary = !connected || jump > BOUNDARY_THRESHOLD;
    if (isBoundary) {
      segments.push([cur]);
      boundaries.push(cur.idx);
    } else {
      segments[segments.length - 1].push(cur);
    }
  }

  // Per segment: union the new-pixel masks. Render to a high-res PNG and
  // run potrace to vectorize → smooth Bézier path. Holes (counters) come for
  // free since potrace emits multi-subpath SVG with proper winding.
  // Centerline (skeleton-trace) is kept for medians (quiz scoring); only the
  // d-string output changes.
  const strokes: Array<{ centerline: [number, number][]; svgPath: string }> = [];
  for (const seg of segments) {
    const union = new Uint8Array(w * h);
    for (const f of seg) {
      for (let j = 0; j < w * h; j++) if (f.newMask[j]) union[j] = 1;
    }
    let count = 0;
    for (let j = 0; j < union.length; j++) if (union[j]) count++;
    if (count < 4) continue;

    const svgPath = await maskToPotraceSvg(union, w, h);
    if (!svgPath) continue;

    const centerlineMask = new Uint8Array(union); // copy
    thinZhangSuen(centerlineMask, w, h);
    const centerline = traceSkeleton(centerlineMask, w, h);
    if (centerline.length < 2) continue;

    strokes.push({ centerline, svgPath });
  }
  if (strokes.length === 0) {
    return { strokes: [], medians: [], error: 'no strokes after skeletonization' };
  }

  // Compute global bbox in pixel coords across all stroke masks (cheap pass
  // — we already have skeletons from each stroke's union).
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const s of strokes) {
    for (const [x, y] of s.centerline) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
  // Pad bbox by a few px so stroke widths don't get cropped at the edge.
  const PAD = 4;
  minX -= PAD; minY -= PAD; maxX += PAD; maxY += PAD;
  const bbW = Math.max(1e-6, maxX - minX);
  const bbH = Math.max(1e-6, maxY - minY);
  const scale = Math.min(TARGET_BOX / bbW, TARGET_BOX / bbH);
  const offsetX = (TARGET_BOX - bbW * scale) / 2;
  const offsetY = (TARGET_BOX - bbH * scale) / 2;
  // svgpath transform chain (rightmost applied first to coords):
  //   translate(offsetX, TARGET_BOX - offsetY)   ← center within MMH box
  //   scale(scale, -scale)                       ← scale + Y-flip to MMH
  //   translate(-minX, -minY)                    ← bbox to origin
  const applyTransform = (d: string): string =>
    svgpath(d)
      .translate(-minX, -minY)
      .scale(scale, -scale)
      .translate(offsetX, TARGET_BOX - offsetY)
      .abs()
      .round(ROUND_PRECISION)
      .toString();

  const finalStrokes: string[] = [];
  const finalMedians: number[][][] = [];
  for (const s of strokes) {
    finalStrokes.push(applyTransform(s.svgPath));

    // Medians: remap centerline pixel coords → MMH coords (same transform).
    const cm = s.centerline.map(([x, y]) => {
      const nx = (x - minX) * scale + offsetX;
      const ny = TARGET_BOX - ((y - minY) * scale + offsetY);
      return [
        Math.max(0, Math.min(TARGET_BOX, Math.round(nx))),
        Math.max(0, Math.min(TARGET_BOX, Math.round(ny))),
      ] as [number, number];
    });
    const medians = samplePolyline(cm, MEDIAN_COUNT);
    finalMedians.push(medians.map(([x, y]) => [Math.round(x), Math.round(y)]));
  }

  return {
    strokes: finalStrokes,
    medians: finalMedians,
    frameCount: N,
    boundaries,
  };
}

// ---------------------------------------------------------------------------
// Misc helpers
// ---------------------------------------------------------------------------

function ensureDir(d: string): void {
  fs.mkdirSync(d, { recursive: true });
}

function die(msg: string): never {
  console.error(`[build-stroke-data-deva-gif] ${msg}`);
  process.exit(1);
}

function stripHtml(s: string | undefined): string | undefined {
  if (!s) return undefined;
  return s.replace(/<[^>]+>/g, '').trim();
}

function round(x: number, decimals: number): number {
  const k = Math.pow(10, decimals);
  return Math.round(x * k) / k;
}

/**
 * Vectorize a binary mask via potrace → smooth Bézier SVG path.
 *
 * Pipeline: render mask to a 4× upsampled PNG (black-on-white) → potrace
 * with curve optimisation → extract the `d=` attribute. Holes (counters)
 * are emitted by potrace as additional sub-paths with reverse winding,
 * which SVG fill-rule renders as holes for free.
 *
 * 4× upsample makes potrace's curve fit cleaner on low-res GIF rasters
 * (217×181 source); cost is ~16× pixels, but potrace is fast.
 */
async function maskToPotraceSvg(
  mask: Uint8Array,
  w: number,
  h: number,
): Promise<string | null> {
  const SCALE = 4;
  const canvas = createCanvas(w * SCALE, h * SCALE);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, w * SCALE, h * SCALE);
  ctx.fillStyle = 'black';
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (mask[y * w + x]) ctx.fillRect(x * SCALE, y * SCALE, SCALE, SCALE);
    }
  }
  const png = canvas.toBuffer('image/png');

  return new Promise((resolve) => {
    potrace.trace(
      png,
      { threshold: 128, turdSize: 4, optCurve: true, optTolerance: 0.4 },
      (err: unknown, svg: string) => {
        if (err) { resolve(null); return; }
        const m = svg.match(/d="([^"]+)"/);
        if (!m) { resolve(null); return; }
        // Coords are in upsampled space (SCALE×). Pre-scale back so callers
        // can think in original mask pixel coords.
        const dStr = svgpath(m[1]).scale(1 / SCALE).abs().toString();
        resolve(dStr);
      },
    );
  });
}

/**
 * Two masks are "adjacent" if any 1-pixel of `a` is itself a 1-pixel of `b` or
 * is within an 8-neighbourhood of a 1-pixel of `b`. Within-stroke pen motion
 * keeps frame-to-frame masks adjacent; pen lift breaks adjacency.
 */
function masksAreAdjacent(a: Uint8Array, b: Uint8Array, w: number, h: number): boolean {
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const j = y * w + x;
      if (!a[j]) continue;
      // Check cell + 8 neighbours of `b`.
      for (let dy = -1; dy <= 1; dy++) {
        const ny = y + dy;
        if (ny < 0 || ny >= h) continue;
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx;
          if (nx < 0 || nx >= w) continue;
          if (b[ny * w + nx]) return true;
        }
      }
    }
  }
  return false;
}

interface Attribution {
  character: string;
  title: string;
  artist: string | undefined;
  license: string;
  sourceUrl: string;
  strokeCount: number;
  frameCount: number | undefined;
  boundaries: number[] | undefined;
}

interface WikiCategoryResp {
  query?: { categorymembers?: Array<{ title: string }> };
}
interface WikiImageInfoResp {
  query?: {
    pages?: Record<
      string,
      {
        imageinfo?: Array<{
          url?: string;
          descriptionurl?: string;
          extmetadata?: Record<string, { value: string }>;
        }>;
      }
    >;
  };
}
