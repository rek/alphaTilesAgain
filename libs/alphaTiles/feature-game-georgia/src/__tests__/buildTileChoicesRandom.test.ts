import { buildTileChoicesRandom } from '../buildTileChoicesRandom';
import { makeTile, seededRng } from './testFixtures';

describe('buildTileChoicesRandom', () => {
  const corV = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map((b) =>
    makeTile(b, b === 'a' || b === 'e' ? 'V' : 'C'),
  );

  it('produces N distinct choices when corV.length >= N', () => {
    const slots = buildTileChoicesRandom({
      visibleGameButtons: 6,
      corV,
      correctText: 'c',
      rng: seededRng(7),
    });
    expect(slots).toHaveLength(6);
    expect(new Set(slots).size).toBe(6);
    expect(slots).toContain('c');
  });

  it('fallback overwrite never targets the last visible slot', () => {
    // Force the fallback path: correct is 'z' which is NOT in corV.
    // For ALL seeds, the overwrite target must be in [0, visibleGameButtons - 2].
    for (let seed = 1; seed <= 25; seed++) {
      const slots = buildTileChoicesRandom({
        visibleGameButtons: 6,
        corV,
        correctText: 'z',
        rng: seededRng(seed),
      });
      const idx = slots.indexOf('z');
      expect(idx).toBeGreaterThanOrEqual(0);
      expect(idx).toBeLessThan(5); // never index 5 (last visible)
    }
  });

  it('uses nextInt(corV.length) — last entry IS reachable (no off-by-one)', () => {
    // With a small corV and many trials, every entry including last must
    // appear at least once across many seeds.
    const small = corV.slice(0, 4); // ['a','b','c','d']
    const lastSeen = new Set<string>();
    for (let seed = 1; seed <= 200; seed++) {
      const slots = buildTileChoicesRandom({
        visibleGameButtons: 4,
        corV: small,
        correctText: 'a',
        rng: seededRng(seed),
      });
      for (const s of slots) lastSeen.add(s);
    }
    expect(lastSeen.has('d')).toBe(true);
  });
});
