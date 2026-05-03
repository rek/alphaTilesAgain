/**
 * build-stroke-data-deva.ts
 *
 * Phase 1 SVG extractor for Devanagari stroke data. Source: Wikimedia Commons
 * Category:Devanagari stroke order (SVG).
 *
 * SVG structure observed (Saurmandal corpus):
 *   - Each SVG renders the character at 4 stages SIDE-BY-SIDE — one <g> per
 *     stage with `inkscape:label="1".."4"` and a horizontal translate(...).
 *   - All 4 groups contain the SAME set of <path> elements. Stage progression
 *     is encoded by the per-path FILL COLOR: a path is `fill:#c8c8c8` (grey)
 *     when it represents a stroke that's "not yet drawn at this stage", and
 *     either has no fill in style or `fill:#000` when it's "drawn".
 *   - At stage N, paths NOT-grey are the strokes drawn so far. The path that
 *     transitions grey→non-grey at stage N is the stroke drawn at stage N.
 *   - Multiple paths can transition at the same stage when a single stroke is
 *     decomposed into sub-paths (head + serif, body + counter, etc.). They're
 *     merged into one stroke.
 *
 * Pipeline:
 *   1. Wikimedia API: list category, fetch metadata, license-gate.
 *   2. Cache raw SVG.
 *   3. Find all numeric-labelled <g>s, sorted ascending.
 *   4. For each path index, find the smallest N where it's NOT grey →
 *      that's its drawing stage.
 *   5. Group paths by stage. ascending stage order = drawing order.
 *   6. Combine sub-paths within a stage into one merged d-string.
 *   7. Apply parent group transform via svgpath (curve-preserving).
 *   8. Compute combined bbox; rescale to a TARGET_BOX, Y-flipped to MMH.
 *   9. Round to integers.
 *  10. Sample MEDIAN_COUNT points along each stroke's centerline via
 *      symmetric pair-averaging on closed loops.
 *  11. Emit per-character JSON; write attribution.
 *
 * Output JSONs are committed; raw SVG cache is gitignored.
 *
 * Run: npx tsx tools/build-stroke-data-deva.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { XMLParser } from 'fast-xml-parser';
import { svgPathProperties as _svgPathProperties } from 'svg-path-properties';
import svgpath from 'svgpath';

const svgPathProperties = (d: string) =>
  new (_svgPathProperties as unknown as new (s: string) => {
    getTotalLength(): number;
    getPointAtLength(pos: number): { x: number; y: number };
  })(d);

const REPO_ROOT = path.resolve(__dirname, '..');
const CACHE_DIR = path.join(REPO_ROOT, 'tools', 'data', 'wikimedia-deva-cache');
const OUT_DIR = path.join(REPO_ROOT, 'tools', 'data', 'devanagari-strokes');
const ATTRIBUTION_PATH = path.join(CACHE_DIR, '_attribution.json');

const CATEGORY = 'Devanagari stroke order (SVG)';
const WIKI_API = 'https://commons.wikimedia.org/w/api.php';
const USER_AGENT = 'alphaTiles-research/1.0 (rekarnar@gmail.com)';

const ACCEPTED_LICENSES = new Set([
  'cc-by-3.0', 'cc-by-sa-3.0', 'cc-by-2.0', 'cc-by-sa-2.0',
  'cc-by-1.0', 'cc-by-sa-1.0', 'cc-by-4.0', 'cc-by-sa-4.0',
  'cc0', 'public domain', 'pd',
]);

const TARGET_BOX = 1024;
const MEDIAN_COUNT = 10;
const ROUND_PRECISION = 1; // 1 decimal place — keeps curves smooth at 1024 scale
const GREY_FILL_PATTERNS = [/#c8c8c8/i, /#cccccc/i, /rgb\(\s*200\s*,\s*200\s*,\s*200\s*\)/i];

main().catch((e) => {
  console.error('[build-stroke-data-deva] fatal:', e);
  process.exit(1);
});

async function main(): Promise<void> {
  ensureDir(CACHE_DIR);
  ensureDir(OUT_DIR);

  const files = await listCategoryFiles(CATEGORY);
  console.log(`[build-stroke-data-deva] category lists ${files.length} files`);

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

    const cachePath = path.join(CACHE_DIR, `${ch}.svg`);
    let svgText: string;
    if (fs.existsSync(cachePath)) {
      svgText = fs.readFileSync(cachePath, 'utf-8');
    } else {
      svgText = await fetchText(meta.url);
      if (!svgText) {
        rejected.push({ title, reason: 'failed to download SVG' });
        continue;
      }
      fs.writeFileSync(cachePath, svgText, 'utf-8');
    }

    const result = extractStrokes(svgText);
    if (result.error) {
      rejected.push({ title, reason: result.error });
      continue;
    }

    fs.writeFileSync(
      path.join(OUT_DIR, `${ch}.json`),
      JSON.stringify({ character: ch, strokes: result.strokes, medians: result.medians }) + '\n',
      'utf-8',
    );

    attribution.push({
      character: ch,
      title,
      artist: meta.artist,
      license: licenseKey,
      sourceUrl: meta.descriptionUrl ?? meta.url,
      strokeCount: result.strokes.length,
    });
    covered.push(ch);
  }

  fs.writeFileSync(
    ATTRIBUTION_PATH,
    JSON.stringify({ generatedAt: new Date().toISOString(), entries: attribution }, null, 2) + '\n',
    'utf-8',
  );

  console.log(
    `[build-stroke-data-deva] covered=${covered.length} rejected=${rejected.length} chars=[${covered.join(' ')}]`,
  );
  for (const r of rejected) {
    console.warn(`[build-stroke-data-deva] reject ${r.title}: ${r.reason}`);
  }
}

// ---------------------------------------------------------------------------
// Wikimedia API
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
  console.warn(`[build-stroke-data-deva] fetch failed after ${attempts} attempts: ${url} (${String(lastErr)})`);
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

async function fetchText(url: string): Promise<string> {
  const res = await fetchWithRetry(url);
  if (!res) return '';
  return await res.text();
}

// ---------------------------------------------------------------------------
// Character extraction from filename
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
// SVG → strokes
// ---------------------------------------------------------------------------

interface ExtractResult {
  strokes: string[];
  medians: number[][][];
  error?: string;
}

interface PathEntry {
  d: string;
  style: string;
  index: number; // document-order index within the group
}

interface NumericGroup {
  n: number;
  paths: PathEntry[];
  transformChain: string[];
}

export function extractStrokes(svgText: string): ExtractResult {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    preserveOrder: true,
    parseAttributeValue: false,
  });
  const tree = parser.parse(svgText);

  const allNumericGroups = collectNumericLabelGroups(tree, []);
  if (allNumericGroups.length === 0) {
    return { strokes: [], medians: [], error: 'no inkscape:label="N" numeric groups found' };
  }

  // Some Wikimedia SVGs are messy: outlier groups with off-by-one path counts
  // (artist added an extra ornament in one stage), or duplicate labels at
  // different nesting depths (झ). Pick groups whose path count matches the
  // MODE; dedupe by label (first-seen wins).
  const counts = allNumericGroups.map((g) => g.paths.length).filter((c) => c > 0);
  if (counts.length === 0) {
    return { strokes: [], medians: [], error: 'no groups with paths' };
  }
  const modal = modeOf(counts);
  const seenLabels = new Set<number>();
  const numericGroups: NumericGroup[] = [];
  for (const g of allNumericGroups) {
    if (g.paths.length !== modal) continue;
    if (seenLabels.has(g.n)) continue;
    seenLabels.add(g.n);
    numericGroups.push(g);
  }
  if (numericGroups.length < 2) {
    return {
      strokes: [],
      medians: [],
      error: `not enough consistent groups (modal count=${modal}, kept=${numericGroups.length}, raw=${allNumericGroups.map((g) => `${g.n}:${g.paths.length}`).join(',')})`,
    };
  }
  numericGroups.sort((a, b) => a.n - b.n);
  const expected = modal;

  // For each path index, find the smallest stage N at which it's NOT grey.
  // That's the drawing stage of the stroke containing that path.
  const drawingStage: number[] = new Array(expected).fill(Infinity);
  for (const g of numericGroups) {
    g.paths.forEach((p, i) => {
      if (!isGreyStyle(p.style)) {
        drawingStage[i] = Math.min(drawingStage[i], g.n);
      }
    });
  }

  // Use the highest-N group as the canonical source of d-strings + transform —
  // it has every path styled normally so we don't accidentally pick a grey one.
  const canonical = numericGroups[numericGroups.length - 1];
  const parentTransformStr = canonical.transformChain.join(' ');

  // Group path indices by drawing stage, ascending.
  const stages = [...new Set(drawingStage)].filter((s) => Number.isFinite(s)).sort((a, b) => a - b);
  if (stages.length === 0) {
    return { strokes: [], medians: [], error: 'all paths are grey at every stage' };
  }
  const strokeGroups = stages.map((stage) =>
    canonical.paths.filter((_, i) => drawingStage[i] === stage).map((p) => p.d),
  );

  // Apply the parent transform to each path (curve-preserving) and union the
  // sub-paths of a single stroke into one d-string by concatenation.
  const baked: string[] = strokeGroups.map((subPaths) => {
    const transformed = subPaths.map((d) =>
      parentTransformStr
        ? svgpath(d).transform(parentTransformStr).abs().toString()
        : svgpath(d).abs().toString(),
    );
    return transformed.join(' ');
  });

  // Compute global bbox via svg-path-properties on the post-transform paths.
  // svg-path-properties handles multi-subpath d-strings (each `M` is a new sub).
  const bboxes = baked.map((d) => measureBbox(d));
  const unionBbox = unionOf(bboxes);

  const w = Math.max(1e-6, unionBbox.maxX - unionBbox.minX);
  const h = Math.max(1e-6, unionBbox.maxY - unionBbox.minY);
  const scale = Math.min(TARGET_BOX / w, TARGET_BOX / h);
  const offsetX = (TARGET_BOX - w * scale) / 2;
  const offsetY = (TARGET_BOX - h * scale) / 2;

  // Build a single chained transform: translate to put bbox.min at origin,
  // scale+Y-flip, translate to center in 1024×1024 box (Y-flipped offset too).
  // svgpath chain (right-most applied first to coords):
  //   translate(offsetX, TARGET_BOX - offsetY)   ← move centered, Y axis already flipped below
  //   scale(scale, -scale)                       ← Y-flip baked in
  //   translate(-bbox.minX, -bbox.minY)
  const finalStrokes: string[] = baked.map((d) =>
    svgpath(d)
      .translate(-unionBbox.minX, -unionBbox.minY)
      .scale(scale, -scale)
      .translate(offsetX, TARGET_BOX - offsetY)
      .abs()
      .round(ROUND_PRECISION)
      .toString(),
  );

  // Sample medians along centerlines. For multi-subpath strokes we sample each
  // subpath separately and concatenate their centerlines.
  // Then enforce a consistent writing direction per stroke: horizontal-dominant
  // strokes go left→right; vertical-dominant strokes go top→bottom (in MMH
  // coords, top = larger Y, so top→bottom means start.y > end.y).
  const finalMedians: number[][][] = finalStrokes
    .map((d) => sampleCenterlineMedians(d, MEDIAN_COUNT))
    .map(enforceWritingDirection);

  return { strokes: finalStrokes, medians: finalMedians };
}

function enforceWritingDirection(medians: number[][]): number[][] {
  if (medians.length < 2) return medians;
  const [sx, sy] = medians[0];
  const [ex, ey] = medians[medians.length - 1];
  const dx = ex - sx;
  const dy = ey - sy;
  let reverse = false;
  if (Math.abs(dx) >= Math.abs(dy)) {
    // Horizontal-dominant: enforce left → right.
    if (dx < 0) reverse = true;
  } else {
    // Vertical-dominant: enforce top → bottom. MMH Y=top is the larger value,
    // so top→bottom means start.y > end.y, i.e. dy < 0. Reverse if dy > 0.
    if (dy > 0) reverse = true;
  }
  return reverse ? [...medians].reverse() : medians;
}

// ---------------------------------------------------------------------------
// XML walking — collect numeric-labeled groups w/ per-path style + d
// ---------------------------------------------------------------------------

type PreservedNode = Record<string, unknown>;

function collectNumericLabelGroups(
  nodes: PreservedNode[],
  parentChain: string[],
): NumericGroup[] {
  const out: NumericGroup[] = [];
  for (const node of nodes) {
    for (const tag of Object.keys(node)) {
      if (tag.startsWith(':@')) continue;
      const children = node[tag] as PreservedNode[] | undefined;
      const attrs = (node as { ':@'?: Record<string, string> })[':@'] ?? {};
      const transform = attrs['@_transform'];
      const chain = transform ? [...parentChain, transform] : parentChain;
      if (tag === 'g') {
        const label = attrs['@_inkscape:label'];
        if (label && /^\d+$/.test(label)) {
          const paths = collectPathsWithStyle(children ?? []);
          out.push({ n: parseInt(label, 10), paths, transformChain: chain });
        }
      }
      if (Array.isArray(children)) {
        out.push(...collectNumericLabelGroups(children, chain));
      }
    }
  }
  return out;
}

function collectPathsWithStyle(nodes: PreservedNode[]): PathEntry[] {
  const out: PathEntry[] = [];
  let idx = 0;
  function walk(arr: PreservedNode[]): void {
    for (const node of arr) {
      for (const tag of Object.keys(node)) {
        if (tag.startsWith(':@')) continue;
        const attrs = (node as { ':@'?: Record<string, string> })[':@'] ?? {};
        if (tag === 'path' && attrs['@_d']) {
          out.push({
            d: attrs['@_d'],
            style: attrs['@_style'] ?? '',
            index: idx++,
          });
          continue;
        }
        // Don't descend into nested labeled groups — those are sibling stages
        // (e.g. label="3" inside label="4") or non-stroke groups (Arrows,
        // Start markers). Only walk into UNLABELED <g>s and other elements.
        if (tag === 'g' && attrs['@_inkscape:label']) continue;
        const children = node[tag] as PreservedNode[] | undefined;
        if (Array.isArray(children)) walk(children);
      }
    }
  }
  walk(nodes);
  return out;
}

function isGreyStyle(style: string): boolean {
  if (!style) return false;
  return GREY_FILL_PATTERNS.some((re) => re.test(style));
}

// ---------------------------------------------------------------------------
// Bounding box on a (multi-subpath) d-string
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Centerline median sampling
//
// Wikimedia stroke paths are filled-glyph perimeter loops. The centerline
// runs roughly down the middle of the loop. We approximate by sampling pairs
// of points symmetric around t=0.5 and averaging — for elongated stroke
// shapes this traces the midline from path-start to path-midpoint.
//
// Multi-subpath strokes: split at each `M` command, sample each subpath's
// centerline separately, concatenate with even point counts per subpath.
// ---------------------------------------------------------------------------

function sampleCenterlineMedians(d: string, totalSamples: number): number[][] {
  const subPaths = splitOnMoveTo(d);
  if (subPaths.length === 0) return [];

  // For "3"-shaped or multi-counter strokes, the d-string contains sub-paths
  // for the outer perimeter PLUS inner counters (holes). Use only the longest.
  const lens = subPaths.map((sd) => svgPathProperties(sd).getTotalLength());
  let longestIdx = 0;
  for (let i = 1; i < lens.length; i++) if (lens[i] > lens[longestIdx]) longestIdx = i;
  const outline = subPaths[longestIdx];

  // Densely sample the closed-loop outline.
  const N = 256;
  const props = svgPathProperties(outline);
  const totalLen = props.getTotalLength();
  if (totalLen === 0) return [];
  const pts: [number, number][] = [];
  for (let i = 0; i < N; i++) {
    const p = props.getPointAtLength((i / N) * totalLen);
    pts.push([p.x, p.y]);
  }

  // Find the two outline tips: the pair (i, j) with maximum chord distance.
  // For an elongated stroke shape these are the two ends of the stroke;
  // walking each side of the loop between them traces the two edges of the
  // pen path, whose pairwise average is the centerline.
  let tipA = 0, tipB = 0, maxD2 = -1;
  for (let i = 0; i < N; i++) {
    for (let j = i + 1; j < N; j++) {
      const dx = pts[i][0] - pts[j][0];
      const dy = pts[i][1] - pts[j][1];
      const d2 = dx * dx + dy * dy;
      if (d2 > maxD2) {
        maxD2 = d2;
        tipA = i;
        tipB = j;
      }
    }
  }

  // Walk side A: tipA → tipB stepping forward through the array (length pA).
  // Walk side B: tipA → tipB stepping backward through the array (length pB).
  // Pair samples at proportional progress so each pair is on opposite edges.
  const pA = (tipB - tipA + N) % N;
  const pB = N - pA;

  const result: number[][] = [];
  for (let k = 0; k < totalSamples; k++) {
    const alpha = totalSamples === 1 ? 0.5 : k / (totalSamples - 1);
    // Side A: index = tipA + alpha * pA
    const iA = (tipA + Math.round(alpha * pA)) % N;
    // Side B: index = tipA - alpha * pB (mod N)
    const iB = (tipA - Math.round(alpha * pB) + N * 10) % N;
    const ax = pts[iA][0];
    const ay = pts[iA][1];
    const bx = pts[iB][0];
    const by = pts[iB][1];
    const px = Math.max(0, Math.min(TARGET_BOX, Math.round((ax + bx) / 2)));
    const py = Math.max(0, Math.min(TARGET_BOX, Math.round((ay + by) / 2)));
    result.push([px, py]);
  }
  return result;
}

function splitOnMoveTo(d: string): string[] {
  // Split a d-string at each M/m command (top-level moveto). Preserve commands
  // inside curves. Simple regex split — d-strings from svgpath.toString() use
  // capital letters with absolute coords, separated by spaces.
  const parts = d.split(/(?=\s*[Mm]\s*)/).map((s) => s.trim()).filter(Boolean);
  return parts;
}

// ---------------------------------------------------------------------------
// Misc
// ---------------------------------------------------------------------------

function ensureDir(d: string): void {
  fs.mkdirSync(d, { recursive: true });
}

function die(msg: string): never {
  console.error(`[build-stroke-data-deva] ${msg}`);
  process.exit(1);
}

function stripHtml(s: string | undefined): string | undefined {
  if (!s) return undefined;
  return s.replace(/<[^>]+>/g, '').trim();
}

function modeOf(arr: number[]): number {
  const counts = new Map<number, number>();
  for (const x of arr) counts.set(x, (counts.get(x) ?? 0) + 1);
  let best = arr[0];
  let bestCount = 0;
  for (const [v, c] of counts) {
    if (c > bestCount || (c === bestCount && v > best)) {
      bestCount = c;
      best = v;
    }
  }
  return best;
}

interface Attribution {
  character: string;
  title: string;
  artist: string | undefined;
  license: string;
  sourceUrl: string;
  strokeCount: number;
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
