// Match an ordered cell-index sequence against any placed-word path.
// Accepts forward OR reverse match (Method 1 reads endpoints in either order).
// Returns the index of the matching placed word, or -1.
export function matchPath({
  candidate,
  paths,
}: {
  candidate: number[];
  paths: ReadonlyArray<{ path: number[] }>;
}): number {
  for (let i = 0; i < paths.length; i++) {
    const p = paths[i].path;
    if (p.length !== candidate.length) continue;
    let forward = true;
    let reverse = true;
    for (let t = 0; t < p.length; t++) {
      if (p[t] !== candidate[t]) forward = false;
      if (p[t] !== candidate[p.length - 1 - t]) reverse = false;
      if (!forward && !reverse) break;
    }
    if (forward || reverse) return i;
  }
  return -1;
}
