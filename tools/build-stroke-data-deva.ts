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
const MEDIAN_COUNT = 15;
const ROUND_PRECISION = 1; // 1 decimal place — keeps curves smooth at 1024 scale
// "Not drawn" markers in a path/parent style. Catches:
//   - any neutral light-grey hex (#c0c0c0..#dadada with R≈G≈B), e.g. #c8c8c8 (अ), #c9c9c9 (ए, ई)
//   - rgb(R,R,R) where R ∈ ~[180, 220]
//   - opacity < 0.5 (faded out — explicitly hidden)
//   - fill:none (transparent)
function isGreyStyle(style: string): boolean {
  if (!style) return false;
  // Match each declaration via the merged style string (k:v;…).
  const decls = new Map<string, string>();
  for (const decl of style.split(';')) {
    const i = decl.indexOf(':');
    if (i < 0) continue;
    decls.set(decl.slice(0, i).trim(), decl.slice(i + 1).trim());
  }
  const opacity = parseFloat(decls.get('opacity') ?? '1');
  if (Number.isFinite(opacity) && opacity < 0.5) return true;
  const fill = (decls.get('fill') ?? '').toLowerCase();
  if (!fill || fill === 'inherit') return false;
  if (fill === 'none' || fill === 'transparent') return true;
  // Hex #RRGGBB
  const hex = fill.match(/^#([0-9a-f]{6})$/);
  if (hex) {
    const r = parseInt(hex[1].slice(0, 2), 16);
    const g = parseInt(hex[1].slice(2, 4), 16);
    const b = parseInt(hex[1].slice(4, 6), 16);
    if (Math.abs(r - g) < 16 && Math.abs(g - b) < 16 && r >= 160 && r <= 230) return true;
  }
  const hex3 = fill.match(/^#([0-9a-f]{3})$/);
  if (hex3) {
    const r = parseInt(hex3[1][0] + hex3[1][0], 16);
    const g = parseInt(hex3[1][1] + hex3[1][1], 16);
    const b = parseInt(hex3[1][2] + hex3[1][2], 16);
    if (Math.abs(r - g) < 16 && Math.abs(g - b) < 16 && r >= 160 && r <= 230) return true;
  }
  // rgb(R,G,B)
  const rgb = fill.match(/^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (rgb) {
    const r = parseInt(rgb[1], 10);
    const g = parseInt(rgb[2], 10);
    const b = parseInt(rgb[3], 10);
    if (Math.abs(r - g) < 16 && Math.abs(g - b) < 16 && r >= 160 && r <= 230) return true;
  }
  return false;
}

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
  /**
   * X-translate of the group's own `transform` (parsed from its first
   * `translate(tx, …)` clause). Inkscape places stage groups side-by-side via
   * horizontal translates; the smallest tx is the chronologically first stage,
   * regardless of the inkscape:label number. For some chars (e.g. ई) labels
   * are NOT in chronological order.
   */
  tx: number;
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
  // Wikimedia stroke-order SVGs use two ordering conventions:
  //   (A) Side-by-side stages (अ, ई, ए, ओ, …). Each group is translated
  //       horizontally so the stages display in a row. Sort by tx ascending
  //       to recover chronological order — `inkscape:label="N"` is just an
  //       identifier and may NOT be in tx order (e.g. ई has labels 1,3,2).
  //   (B) Stacked stages (ऐ). All groups share the same tx; the displayed
  //       image is the final character with the latest stroke highlighted.
  //       Here the inkscape:label number IS the drawing order (1 = first).
  // Detect by looking at tx spread: < 1 unit total → layout B; otherwise A.
  const txMin = Math.min(...numericGroups.map((g) => g.tx));
  const txMax = Math.max(...numericGroups.map((g) => g.tx));
  const txSpread = txMax - txMin;
  const isSinglePathLayout = modal === 1; // truly one-path-per-group (rare; not in current corpus)
  const isStackedLayout = txSpread < 1; // ऐ-style: same tx for all groups
  if (isSinglePathLayout || isStackedLayout) {
    numericGroups.sort((a, b) => a.n - b.n);
  } else {
    numericGroups.sort((a, b) => a.tx - b.tx);
    numericGroups.forEach((g, i) => { g.n = i + 1; });
  }
  const expected = modal;

  // For each path index, find the smallest stage N at which it's NOT grey.
  // That's the drawing stage of the stroke containing that path.
  const drawingStage: number[] = new Array(expected).fill(Infinity);
  if (isSinglePathLayout) {
    // Each group contributes its own path. Path index isn't comparable across
    // groups because every group has a different path. We synthesize a
    // virtual path index per group so each ends up its own stroke.
    // Concretely: combine all group's lone paths into a flat list ordered by
    // label, and assign drawingStage[i] = i+1 for path i.
    const flatPaths: PathEntry[] = [];
    for (const g of numericGroups) {
      flatPaths.push(...g.paths);
    }
    drawingStage.length = flatPaths.length;
    for (let i = 0; i < flatPaths.length; i++) drawingStage[i] = i + 1;
    // Replace canonical with a synthetic group containing all flat paths in order.
    const canonicalSyn: NumericGroup = {
      n: numericGroups.length,
      tx: 0,
      paths: flatPaths,
      transformChain: numericGroups[numericGroups.length - 1].transformChain,
    };
    numericGroups.length = 0;
    numericGroups.push(canonicalSyn);
  } else {
    for (const g of numericGroups) {
      g.paths.forEach((p, i) => {
        if (!isGreyStyle(p.style)) {
          drawingStage[i] = Math.min(drawingStage[i], g.n);
        }
      });
    }
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
          const groupStyle = attrs['@_style'] ?? '';
          const paths = collectPathsWithStyle(children ?? [], groupStyle);
          out.push({
            n: parseInt(label, 10),
            tx: extractTranslateX(transform),
            paths,
            transformChain: chain,
          });
        }
      }
      if (Array.isArray(children)) {
        out.push(...collectNumericLabelGroups(children, chain));
      }
    }
  }
  return out;
}

function collectPathsWithStyle(nodes: PreservedNode[], inheritedStyle: string): PathEntry[] {
  const out: PathEntry[] = [];
  let idx = 0;
  function walk(arr: PreservedNode[], parentStyle: string): void {
    for (const node of arr) {
      for (const tag of Object.keys(node)) {
        if (tag.startsWith(':@')) continue;
        const attrs = (node as { ':@'?: Record<string, string> })[':@'] ?? {};
        if (tag === 'path' && attrs['@_d']) {
          // Effective style = parent inheritable + own (own wins on conflicts).
          const ownStyle = attrs['@_style'] ?? '';
          const effective = mergeStyles(parentStyle, ownStyle);
          out.push({ d: attrs['@_d'], style: effective, index: idx++ });
          continue;
        }
        if (tag === 'g' && attrs['@_inkscape:label']) continue;
        const children = node[tag] as PreservedNode[] | undefined;
        if (Array.isArray(children)) {
          const childInherited = mergeStyles(parentStyle, attrs['@_style'] ?? '');
          walk(children, childInherited);
        }
      }
    }
  }
  walk(nodes, inheritedStyle);
  return out;
}

function extractTranslateX(transform: string | undefined): number {
  if (!transform) return 0;
  const m = transform.match(/translate\(\s*(-?\d+\.?\d*)/);
  return m ? parseFloat(m[1]) : 0;
}

function mergeStyles(parent: string, own: string): string {
  // Parse "k:v;k:v" pairs, merge with own overriding parent on key match.
  const merged = new Map<string, string>();
  const parse = (s: string): void => {
    for (const decl of s.split(';')) {
      const i = decl.indexOf(':');
      if (i < 0) continue;
      const k = decl.slice(0, i).trim();
      const v = decl.slice(i + 1).trim();
      if (k) merged.set(k, v);
    }
  };
  parse(parent);
  parse(own);
  return [...merged].map(([k, v]) => `${k}:${v}`).join(';');
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

/**
 * Compute a stroke's centerline via raster + Zhang-Suen thinning. The d-string
 * is rasterized to a binary mask; thinned to a 1-pixel skeleton; the longest
 * skeleton path is traced and sampled to N medians. Handles arbitrarily curved
 * stroke shapes including self-folding ("3" / right-side-of-8) shapes that
 * pair-averaging breaks on.
 *
 * Multi-sub-path strokes (outer perimeter + inner counters) render correctly
 * via canvas's non-zero winding fill — counters with opposite winding leave
 * holes in the mask, and the skeleton naturally hugs the body's medial axis.
 */
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
