import { placeTiles } from '../placeTiles';

function seededRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

describe('placeTiles', () => {
  const area = { width: 360, height: 800 };

  it('returns 8 placements within bounds', () => {
    const out = placeTiles({ area, rng: seededRng(1) });
    expect(out).not.toBeNull();
    if (!out) return;
    expect(out).toHaveLength(8);
    const maxY2 = Math.floor(area.height * 0.85);
    for (const p of out) {
      expect(p.x + p.width).toBeLessThanOrEqual(area.width);
      expect(p.y + p.height).toBeLessThanOrEqual(maxY2);
    }
  });

  it('tile width is 25–50% of usable width', () => {
    const out = placeTiles({ area, rng: seededRng(7) });
    expect(out).not.toBeNull();
    if (!out) return;
    const minW = Math.floor(area.width * 0.25);
    const maxW = Math.floor(area.width * 0.5);
    for (const p of out) {
      expect(p.width).toBeGreaterThanOrEqual(minW);
      expect(p.width).toBeLessThanOrEqual(maxW);
    }
  });

  it('tile height equals floor(width / 4)', () => {
    const out = placeTiles({ area, rng: seededRng(11) });
    expect(out).not.toBeNull();
    if (!out) return;
    for (const p of out) {
      expect(p.height).toBe(Math.floor(p.width / 4));
    }
  });

  it('no two tiles overlap (with buffers)', () => {
    const out = placeTiles({ area, rng: seededRng(42) });
    expect(out).not.toBeNull();
    if (!out) return;
    const bx = Math.floor(area.width * 0.05);
    const by = Math.floor(area.height * 0.05);
    for (let i = 0; i < out.length; i++) {
      for (let j = i + 1; j < out.length; j++) {
        const a = out[i];
        const b = out[j];
        const ax2 = a.x + a.width;
        const ay2 = a.y + a.height;
        const bx2 = b.x + b.width;
        const by2 = b.y + b.height;
        const overlapX = ax2 + bx >= b.x && a.x - bx <= bx2;
        const overlapY = ay2 + by >= b.y && a.y - by <= by2;
        expect(overlapX && overlapY).toBe(false);
      }
    }
  });

  it('returns null for degenerate area', () => {
    const out = placeTiles({ area: { width: 0, height: 0 } });
    expect(out).toBeNull();
  });

  it('fuzz: 10 seeded runs all succeed on standard area', () => {
    for (let s = 1; s <= 10; s++) {
      const out = placeTiles({ area, rng: seededRng(s * 31) });
      expect(out).not.toBeNull();
    }
  });
});
