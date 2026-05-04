/**
 * Stroke centerline extraction via raster + Zhang-Suen thinning.
 *
 * Pipeline:
 *   1. Rasterize the SVG path (filled) to a binary mask via node-canvas.
 *   2. Apply Zhang-Suen thinning to reduce the filled region to a
 *      one-pixel-wide skeleton.
 *   3. Find skeleton endpoints (pixels with exactly 1 neighbour). Pick the
 *      two farthest-apart endpoints as the centerline ends.
 *   4. Walk the skeleton between those endpoints, ordering pixels along the
 *      path. Branches off the main line are pruned via shortest-path search.
 *   5. Sample N points along the ordered polyline by arc length.
 *   6. Convert raster coords back to the original SVG/MMH coord space.
 *
 * Used by build-stroke-data-deva.ts to replace pair-averaging on outline
 * loops with a real medial axis. Reusable for Phase 2 GIF extractor.
 */

import { createCanvas } from 'canvas';
import svgpath from 'svgpath';

const RASTER = 512; // px on each side; bigger = more skeleton detail, slower
const PADDING = 8;  // px margin so thinning never hits the edge

export interface BBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export function rasterizePath(d: string, bbox: BBox): { mask: Uint8Array; w: number; h: number } {
  const w = RASTER;
  const h = RASTER;
  const canvas = createCanvas(w, h);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'rgba(0,0,0,0)';
  ctx.fillRect(0, 0, w, h);
  // Center the path's bbox into the canvas with PADDING margin.
  const bbW = Math.max(1e-6, bbox.maxX - bbox.minX);
  const bbH = Math.max(1e-6, bbox.maxY - bbox.minY);
  const s = Math.min((w - 2 * PADDING) / bbW, (h - 2 * PADDING) / bbH);
  const ox = PADDING + (w - 2 * PADDING - bbW * s) / 2 - bbox.minX * s;
  const oy = PADDING + (h - 2 * PADDING - bbH * s) / 2 - bbox.minY * s;
  ctx.translate(ox, oy);
  ctx.scale(s, s);
  ctx.fillStyle = 'black';
  ctx.beginPath();
  // svgpath.abs() converts every segment to absolute coords; iterate emits
  // each segment as ['M', x, y] / ['L', x, y] / ['Q', cpx, cpy, x, y] / etc.
  // We translate to canvas calls. Curves are preserved (no flattening).
  svgpath(d).abs().unarc().unshort().iterate((seg, _i, x, y) => {
    const cmd = seg[0];
    switch (cmd) {
      case 'M': ctx.moveTo(seg[1] as number, seg[2] as number); break;
      case 'L': ctx.lineTo(seg[1] as number, seg[2] as number); break;
      case 'H': ctx.lineTo(seg[1] as number, y); break;
      case 'V': ctx.lineTo(x, seg[1] as number); break;
      case 'C':
        ctx.bezierCurveTo(
          seg[1] as number, seg[2] as number,
          seg[3] as number, seg[4] as number,
          seg[5] as number, seg[6] as number,
        );
        break;
      case 'Q':
        ctx.quadraticCurveTo(
          seg[1] as number, seg[2] as number,
          seg[3] as number, seg[4] as number,
        );
        break;
      case 'Z':
      case 'z':
        ctx.closePath();
        break;
      default: break;
    }
  });
  ctx.fill();
  const img = ctx.getImageData(0, 0, w, h);
  const mask = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) {
    mask[i] = img.data[i * 4 + 3] > 64 ? 1 : 0;
  }
  return { mask, w, h };
}

/** Inverse of rasterizePath's transform: raster (x,y) → original (x,y). */
export function makeUnrasterize(bbox: BBox): (rx: number, ry: number) => [number, number] {
  const bbW = Math.max(1e-6, bbox.maxX - bbox.minX);
  const bbH = Math.max(1e-6, bbox.maxY - bbox.minY);
  const s = Math.min((RASTER - 2 * PADDING) / bbW, (RASTER - 2 * PADDING) / bbH);
  const ox = PADDING + (RASTER - 2 * PADDING - bbW * s) / 2 - bbox.minX * s;
  const oy = PADDING + (RASTER - 2 * PADDING - bbH * s) / 2 - bbox.minY * s;
  return (rx, ry) => [(rx - ox) / s, (ry - oy) / s];
}

/**
 * Zhang-Suen thinning. In-place mutation; returns the same buffer for chain
 * convenience.
 */
export function thinZhangSuen(mask: Uint8Array, w: number, h: number): Uint8Array {
  const at = (x: number, y: number) => mask[y * w + x];
  let changed = true;
  while (changed) {
    changed = false;
    for (let pass = 0; pass < 2; pass++) {
      const toRemove: number[] = [];
      for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
          if (at(x, y) === 0) continue;
          const p2 = at(x, y - 1);
          const p3 = at(x + 1, y - 1);
          const p4 = at(x + 1, y);
          const p5 = at(x + 1, y + 1);
          const p6 = at(x, y + 1);
          const p7 = at(x - 1, y + 1);
          const p8 = at(x - 1, y);
          const p9 = at(x - 1, y - 1);
          const B = p2 + p3 + p4 + p5 + p6 + p7 + p8 + p9;
          if (B < 2 || B > 6) continue;
          // Count 0→1 transitions in p2..p9..p2.
          const ring = [p2, p3, p4, p5, p6, p7, p8, p9, p2];
          let A = 0;
          for (let i = 0; i < 8; i++) if (ring[i] === 0 && ring[i + 1] === 1) A++;
          if (A !== 1) continue;
          if (pass === 0) {
            if (p2 * p4 * p6 !== 0) continue;
            if (p4 * p6 * p8 !== 0) continue;
          } else {
            if (p2 * p4 * p8 !== 0) continue;
            if (p2 * p6 * p8 !== 0) continue;
          }
          toRemove.push(y * w + x);
        }
      }
      if (toRemove.length > 0) {
        for (const idx of toRemove) mask[idx] = 0;
        changed = true;
      }
    }
  }
  return mask;
}

/**
 * Trace the longest path through the skeleton: find all endpoints
 * (1-neighbour pixels), then BFS from each endpoint to find the most-distant
 * endpoint. The path between them is the centerline.
 *
 * Branches off the main line are ignored.
 *
 * Returns ordered pixel coords [[x,y], …] along the path.
 */
export function traceSkeleton(skeleton: Uint8Array, w: number, h: number): [number, number][] {
  const endpoints: number[] = [];
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const idx = y * w + x;
      if (skeleton[idx] === 0) continue;
      let n = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          if (skeleton[(y + dy) * w + (x + dx)]) n++;
        }
      }
      if (n === 1) endpoints.push(idx);
    }
  }
  if (endpoints.length === 0) {
    // No endpoints (closed loop). Pick any skeleton pixel as the start.
    for (let i = 0; i < skeleton.length; i++) {
      if (skeleton[i]) { endpoints.push(i); break; }
    }
    if (endpoints.length === 0) return [];
  }

  // BFS from each endpoint. Distance map = parent map → reconstruct path.
  function bfs(start: number): { dist: Int32Array; parent: Int32Array } {
    const dist = new Int32Array(skeleton.length).fill(-1);
    const parent = new Int32Array(skeleton.length).fill(-1);
    dist[start] = 0;
    const queue: number[] = [start];
    let head = 0;
    while (head < queue.length) {
      const idx = queue[head++];
      const x = idx % w;
      const y = (idx - x) / w;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
          const nIdx = ny * w + nx;
          if (skeleton[nIdx] === 0) continue;
          if (dist[nIdx] !== -1) continue;
          dist[nIdx] = dist[idx] + 1;
          parent[nIdx] = idx;
          queue.push(nIdx);
        }
      }
    }
    return { dist, parent };
  }

  // Pick endpoint A as any one. BFS to find farthest B. BFS from B to find
  // farthest A* (true diameter). Path A* → B is the longest.
  const ep0 = endpoints[0];
  const { dist: d1 } = bfs(ep0);
  let farIdx = ep0;
  let farDist = 0;
  for (let i = 0; i < d1.length; i++) {
    if (d1[i] > farDist) { farDist = d1[i]; farIdx = i; }
  }
  const { dist: d2, parent: p2 } = bfs(farIdx);
  let otherIdx = farIdx;
  let otherDist = 0;
  for (let i = 0; i < d2.length; i++) {
    if (d2[i] > otherDist) { otherDist = d2[i]; otherIdx = i; }
  }

  // Walk parent pointers from otherIdx back to farIdx — the "main spine".
  const spine: number[] = [];
  let cur = otherIdx;
  while (cur !== -1) {
    spine.push(cur);
    if (cur === farIdx) break;
    cur = p2[cur];
  }
  spine.reverse(); // farIdx → otherIdx

  // Splice in branch stubs that lead into pinches/concavities. From each
  // skeleton pixel adjacent to the spine but not on it, BFS through unused
  // pixels to find the deepest endpoint. Insert a "detour" into the spine
  // at the connection: [spine[k], stub[1..tip..1], spine[k+1]] so the median
  // line actually visits the pinch tip before continuing.
  const onSpine = new Uint8Array(skeleton.length);
  for (const idx of spine) onSpine[idx] = 1;

  const visited = new Uint8Array(skeleton.length);
  for (let i = 0; i < skeleton.length; i++) if (onSpine[i]) visited[i] = 1;

  // For each spine index k, find adjacent off-spine pixels; for each, BFS into
  // the unused skeleton to find the deepest tip. Build a detour.
  type Detour = { afterIdx: number; deviation: number[] };
  const detours: Detour[] = [];
  for (let k = 0; k < spine.length; k++) {
    const sIdx = spine[k];
    const sx = sIdx % w;
    const sy = (sIdx - sx) / w;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const nx = sx + dx;
        const ny = sy + dy;
        if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
        const nIdx = ny * w + nx;
        if (skeleton[nIdx] === 0) continue;
        if (visited[nIdx]) continue;
        // BFS into the unused stub from nIdx; collect deepest pixel.
        const stubDist = new Int32Array(skeleton.length).fill(-1);
        const stubParent = new Int32Array(skeleton.length).fill(-1);
        stubDist[nIdx] = 1;
        const queue: number[] = [nIdx];
        visited[nIdx] = 1;
        let head = 0;
        let deepIdx = nIdx;
        while (head < queue.length) {
          const cIdx = queue[head++];
          const cx = cIdx % w;
          const cy = (cIdx - cx) / w;
          if (stubDist[cIdx] > stubDist[deepIdx]) deepIdx = cIdx;
          for (let ddy = -1; ddy <= 1; ddy++) {
            for (let ddx = -1; ddx <= 1; ddx++) {
              if (ddx === 0 && ddy === 0) continue;
              const ex = cx + ddx;
              const ey = cy + ddy;
              if (ex < 0 || ex >= w || ey < 0 || ey >= h) continue;
              const eIdx = ey * w + ex;
              if (skeleton[eIdx] === 0) continue;
              if (visited[eIdx]) continue;
              visited[eIdx] = 1;
              stubDist[eIdx] = stubDist[cIdx] + 1;
              stubParent[eIdx] = cIdx;
              queue.push(eIdx);
            }
          }
        }
        // Walk parent chain from deepIdx back to nIdx → that's the stub path.
        const stubPath: number[] = [];
        let pcur = deepIdx;
        while (pcur !== -1 && pcur !== nIdx) {
          stubPath.push(pcur);
          pcur = stubParent[pcur];
        }
        stubPath.push(nIdx);
        stubPath.reverse(); // nIdx → deepIdx
        if (stubPath.length === 0) continue;
        // Detour: into the stub then back out (same path twice — produces a
        // "spike" toward the pinch tip in the resampled medians).
        const detour: number[] = [...stubPath, ...stubPath.slice(0, -1).reverse()];
        detours.push({ afterIdx: k, deviation: detour });
      }
    }
  }
  // Sort detours by descending afterIdx so insertion doesn't invalidate later
  // indices.
  detours.sort((a, b) => b.afterIdx - a.afterIdx);
  const merged = [...spine];
  for (const det of detours) {
    merged.splice(det.afterIdx + 1, 0, ...det.deviation);
  }

  return merged.map((idx) => {
    const x = idx % w;
    const y = (idx - x) / w;
    return [x, y] as [number, number];
  });
}

/**
 * Dilate a binary mask by `radius` pixels (8-neighborhood). Smooths jagged
 * edges from low-resolution rasters before boundary tracing.
 */
export function dilate(mask: Uint8Array, w: number, h: number, radius: number): Uint8Array {
  let cur = mask;
  for (let r = 0; r < radius; r++) {
    const next = new Uint8Array(w * h);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (cur[y * w + x]) {
          next[y * w + x] = 1;
          continue;
        }
        for (let dy = -1; dy <= 1 && !next[y * w + x]; dy++) {
          const ny = y + dy;
          if (ny < 0 || ny >= h) continue;
          for (let dx = -1; dx <= 1; dx++) {
            const nx = x + dx;
            if (nx < 0 || nx >= w) continue;
            if (cur[ny * w + nx]) { next[y * w + x] = 1; break; }
          }
        }
      }
    }
    cur = next;
  }
  return cur;
}

/**
 * Moore-neighbour boundary trace. Returns the outer perimeter of a binary
 * region as an ordered list of pixel coords (closed loop). Used to convert a
 * pen-trail mask into a closed-polygon SVG path string for `<HanziWriter>`'s
 * fill-based rendering.
 *
 * Limitations: traces only the outermost connected component. Holes and
 * additional components are ignored.
 */
export function traceBoundary(
  mask: Uint8Array,
  w: number,
  h: number,
): [number, number][] {
  // Find leftmost-topmost 1-pixel as the start.
  let start = -1;
  for (let i = 0; i < mask.length; i++) {
    if (mask[i]) { start = i; break; }
  }
  if (start === -1) return [];

  // Moore-neighbor clockwise traversal. Direction codes 0..7 for (dx,dy):
  //   0=N, 1=NE, 2=E, 3=SE, 4=S, 5=SW, 6=W, 7=NW
  const DX = [0, 1, 1, 1, 0, -1, -1, -1];
  const DY = [-1, -1, 0, 1, 1, 1, 0, -1];
  const out: [number, number][] = [];
  let cur = start;
  // Came from "S" (4); start scanning from S+1=SW.
  let lastDir = 4;
  const MAX_STEPS = w * h * 8;
  for (let step = 0; step < MAX_STEPS; step++) {
    const cx = cur % w;
    const cy = (cur - cx) / w;
    out.push([cx, cy]);
    // Search for next boundary pixel: start at (lastDir+2) mod 8, scan
    // clockwise through 7 of the 8 neighbours.
    const startDir = (lastDir + 6) % 8; // back-step then search clockwise
    let found = -1;
    let foundDir = -1;
    for (let i = 0; i < 8; i++) {
      const d = (startDir + i) % 8;
      const nx = cx + DX[d];
      const ny = cy + DY[d];
      if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
      const ni = ny * w + nx;
      if (mask[ni]) {
        found = ni;
        foundDir = d;
        break;
      }
    }
    if (found === -1) break;
    if (found === start && step > 0) break;
    cur = found;
    lastDir = foundDir;
  }
  return out;
}

/**
 * One-shot pipeline for callers that already have a binary mask (e.g. from
 * GIF frame-diff). Skips the SVG rasterize step and returns medians in the
 * mask's pixel coordinate space — caller is responsible for mapping back.
 */
export function skeletonizeMask(
  mask: Uint8Array,
  w: number,
  h: number,
  totalSamples: number,
): [number, number][] {
  thinZhangSuen(mask, w, h);
  const path = traceSkeleton(mask, w, h);
  if (path.length === 0) return [];
  return samplePolyline(path, totalSamples);
}

/** Sample N points uniformly along arc length of an ordered pixel polyline. */
export function samplePolyline(pts: [number, number][], n: number): [number, number][] {
  if (pts.length === 0) return [];
  if (pts.length === 1) return [pts[0]];
  // Compute cumulative arc lengths.
  const cum: number[] = [0];
  for (let i = 1; i < pts.length; i++) {
    const dx = pts[i][0] - pts[i - 1][0];
    const dy = pts[i][1] - pts[i - 1][1];
    cum.push(cum[i - 1] + Math.hypot(dx, dy));
  }
  const total = cum[cum.length - 1];
  if (total === 0) return [pts[0]];
  const out: [number, number][] = [];
  for (let k = 0; k < n; k++) {
    const target = (k / (n - 1)) * total;
    // Binary search for segment.
    let lo = 0, hi = cum.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >>> 1;
      if (cum[mid] < target) lo = mid + 1;
      else hi = mid;
    }
    const i = Math.max(1, lo);
    const segLen = cum[i] - cum[i - 1];
    const t = segLen > 0 ? (target - cum[i - 1]) / segLen : 0;
    const x = pts[i - 1][0] + t * (pts[i][0] - pts[i - 1][0]);
    const y = pts[i - 1][1] + t * (pts[i][1] - pts[i - 1][1]);
    out.push([x, y]);
  }
  return out;
}
