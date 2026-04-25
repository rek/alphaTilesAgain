import { placeWords, COLS, ROWS } from '../placeWords';

// Deterministic seeded LCG for repeatable runs.
function lcg(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

function pathStep(path: number[]): { dx: number; dy: number } | null {
  if (path.length < 2) return null;
  const [a, b] = path;
  return { dx: (b % COLS) - (a % COLS), dy: Math.floor(b / COLS) - Math.floor(a / COLS) };
}

const candidates = [
  { word: 'cat', tiles: ['c', 'a', 't'] },
  { word: 'dog', tiles: ['d', 'o', 'g'] },
  { word: 'fish', tiles: ['f', 'i', 's', 'h'] },
  { word: 'bird', tiles: ['b', 'i', 'r', 'd'] },
  { word: 'horse', tiles: ['h', 'o', 'r', 's', 'e'] },
  { word: 'mouse', tiles: ['m', 'o', 'u', 's', 'e'] },
  { word: 'ant', tiles: ['a', 'n', 't'] },
];

describe('placeWords', () => {
  it('places up to 7 words; respects MIN/MAX tile bounds', () => {
    const { placed } = placeWords({ candidates, level: 3, rng: lcg(42) });
    expect(placed.length).toBeLessThanOrEqual(7);
    expect(placed.length).toBeGreaterThan(0);
    placed.forEach((p) => {
      expect(p.path.length).toBe(p.tiles.length);
      expect(p.path.length).toBeGreaterThanOrEqual(3);
      expect(p.path.length).toBeLessThanOrEqual(7);
    });
  });

  it('skips words whose tile count is < 3 or > 7', () => {
    const odd = [
      { word: 'a', tiles: ['a'] },
      { word: 'ab', tiles: ['a', 'b'] },
      { word: 'eightTile', tiles: ['1', '2', '3', '4', '5', '6', '7', '8'] },
      { word: 'ok', tiles: ['o', 'k', 'k'] },
    ];
    const { placed } = placeWords({ candidates: odd, level: 3, rng: lcg(7) });
    expect(placed.length).toBe(1);
    expect(placed[0].word).toBe('ok');
  });

  it('CL1 placements step exclusively right or down', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const { placed } = placeWords({ candidates, level: 1, rng: lcg(seed) });
      placed.forEach((p) => {
        const step = pathStep(p.path);
        if (step === null) throw new Error('expected step for placed path');
        const ok =
          (step.dx === 1 && step.dy === 0) || (step.dx === 0 && step.dy === 1);
        expect(ok).toBe(true);
      });
    }
  });

  it('CL3 NEVER produces an up-right path (idx-4 Java bug)', () => {
    // Brute-force across many seeds — if up-right is reachable we'd see it.
    let upRightCount = 0;
    let totalCells = 0;
    for (let seed = 1; seed <= 200; seed++) {
      const { placed } = placeWords({ candidates, level: 3, rng: lcg(seed) });
      placed.forEach((p) => {
        const step = pathStep(p.path);
        if (step && step.dx === 1 && step.dy === -1) upRightCount++;
        totalCells += p.path.length;
      });
    }
    expect(upRightCount).toBe(0);
    expect(totalCells).toBeGreaterThan(0); // sanity: we did place words
  });

  it('does not overwrite already-placed cells', () => {
    const { grid, placed } = placeWords({ candidates, level: 3, rng: lcg(99) });
    const occupied = new Set<number>();
    placed.forEach((p) => {
      p.path.forEach((idx) => {
        expect(occupied.has(idx) ? 'collision' : 'ok').toBe('ok');
        occupied.add(idx);
      });
    });
    occupied.forEach((idx) => {
      expect(grid[idx]).not.toBeNull();
    });
  });

  it('all placement paths stay within the 7×7 grid', () => {
    const { placed } = placeWords({ candidates, level: 3, rng: lcg(123) });
    placed.forEach((p) => {
      p.path.forEach((idx) => {
        expect(idx).toBeGreaterThanOrEqual(0);
        expect(idx).toBeLessThan(COLS * ROWS);
      });
    });
  });
});
