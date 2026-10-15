import { tierForGame } from './tierForGame';

describe('tierForGame', () => {
  it('mapped mechanic → its #13 tier', () => {
    expect(tierForGame('romania')).toBe(1);
    expect(tierForGame('sudan')).toBe(0);
    expect(tierForGame('thailand')).toBe(2);
    expect(tierForGame('mexico')).toBe(3);
    expect(tierForGame('united-states')).toBe(4);
    expect(tierForGame('chile')).toBe(5);
    expect(tierForGame('china')).toBe(6);
  });

  it('taiwan (post-#13 class) is construction, tier 4', () => {
    expect(tierForGame('taiwan')).toBe(4);
  });

  it('unmapped mechanic → default tier 3', () => {
    expect(tierForGame('unknown-future-mechanic')).toBe(3);
  });

  it('every tier is within 0..6', () => {
    for (const key of ['sudan', 'iraq', 'malaysia', 'romania', 'georgia', 'peru', 'ecuador', 'brazil', 'colombia', 'italy', 'japan', 'myanmar']) {
      expect(tierForGame(key)).toBeGreaterThanOrEqual(0);
      expect(tierForGame(key)).toBeLessThanOrEqual(6);
    }
  });
});
