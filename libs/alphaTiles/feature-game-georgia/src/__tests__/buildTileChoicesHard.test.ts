import { buildTileChoicesHard } from '../buildTileChoicesHard';
import { makeTile, seededRng } from './testFixtures';

describe('buildTileChoicesHard', () => {
  const corV = ['ca', 'co', 'cu', 'ka', 'ko', 'sa', 'so', 'ta', 'to', 'last'].map(
    (b) => makeTile(b, 'C'),
  );

  it('first 4 entries (insertion order) are correct + 3 distractors', () => {
    const out = buildTileChoicesHard({
      visibleGameButtons: 6,
      corV,
      correctText: 'ca',
      distractors: ['ka', 'sa', 'ta'],
      rng: seededRng(11),
    });
    expect(out.slice(0, 4)).toEqual(['ca', 'ka', 'sa', 'ta']);
    expect(out).toHaveLength(6);
  });

  it("nextInt off-by-one: corV's last entry is never drawn", () => {
    // We use a corV where 'last' is the final entry. After 100 seeds, no
    // slot should equal 'last' (since it'd only enter via passes A/B/C and
    // all use floor(rng() * (corV.length - 1)) which excludes idx 9).
    for (let seed = 1; seed <= 100; seed++) {
      const out = buildTileChoicesHard({
        visibleGameButtons: 6,
        corV,
        correctText: 'ca',
        distractors: ['ka', 'sa', 'ta'],
        rng: seededRng(seed),
      });
      expect(out.includes('last')).toBe(false);
    }
  });

  it('returns deterministic length N when corV is large enough', () => {
    const out = buildTileChoicesHard({
      visibleGameButtons: 6,
      corV,
      correctText: 'ca',
      distractors: ['ka', 'sa', 'ta'],
      rng: seededRng(1),
    });
    expect(out).toHaveLength(6);
    expect(new Set(out).size).toBe(6);
  });
});
