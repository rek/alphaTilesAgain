import { buildSyllableChoicesRandom } from '../buildSyllableChoicesRandom';
import { makeSyllable, seededRng } from './testFixtures';

describe('buildSyllableChoicesRandom', () => {
  const pool = ['ba', 'be', 'bi', 'bo', 'bu', 'ka', 'ke', 'ki'].map((s) =>
    makeSyllable(s),
  );

  it('is sequential after shuffle (slot t = pool[t])', () => {
    const slots = buildSyllableChoicesRandom({
      visibleGameButtons: 6,
      syllablePool: pool,
      correctText: 'ba',
      rng: seededRng(1),
    });
    expect(slots).toHaveLength(6);
    expect(slots).toEqual(['ba', 'be', 'bi', 'bo', 'bu', 'ka']);
  });

  it('overwrites a non-last slot when correct missing', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const slots = buildSyllableChoicesRandom({
        visibleGameButtons: 6,
        syllablePool: pool,
        correctText: 'zz',
        rng: seededRng(seed),
      });
      const idx = slots.indexOf('zz');
      expect(idx).toBeGreaterThanOrEqual(0);
      expect(idx).toBeLessThan(5); // last slot never overwritten
    }
  });
});
