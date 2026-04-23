import { checkGameStructure } from '../checkGameStructure';
import { mkParsed, mkGameRow, mkTileRow, mkWordRow, mkInventory } from '../../__tests__/testHelpers';

describe('checkGameStructure', () => {
  it('no issues on valid games', () => {
    const parsed = mkParsed({
      gameRows: [mkGameRow({ door: 1, country: 'UnitedStates' })],
    });
    expect(checkGameStructure(parsed, mkInventory())).toHaveLength(0);
  });

  it('flags unknown game country', () => {
    const parsed = mkParsed({
      gameRows: [mkGameRow({ country: 'Atlantis' })],
    });
    const issues = checkGameStructure(parsed, mkInventory());
    expect(issues).toContainEqual(expect.objectContaining({
      code: 'UNKNOWN_GAME_COUNTRY',
      severity: 'error',
    }));
  });

  it('flags non-sequential door', () => {
    const parsed = mkParsed({
      gameRows: [
        mkGameRow({ door: 1 }),
        mkGameRow({ door: 3 }), // skips 2
      ],
    });
    const issues = checkGameStructure(parsed, mkInventory());
    expect(issues).toContainEqual(expect.objectContaining({
      code: 'NON_SEQUENTIAL_GAME_DOORS',
      severity: 'warning',
    }));
  });

  it('flags insufficient 3/4-tile words for China', () => {
    const parsed = mkParsed({
      gameRows: [mkGameRow({ country: 'China' })],
    });
    const issues = checkGameStructure(parsed, mkInventory(), { threeCount: 0, fourCount: 0 });
    expect(issues).toContainEqual(expect.objectContaining({
      code: 'INSUFFICIENT_THREE_OR_FOUR_TILE_WORDS',
      severity: 'error',
    }));
  });

  it('no china issue when counts are sufficient', () => {
    const parsed = mkParsed({
      gameRows: [mkGameRow({ country: 'China' })],
    });
    const issues = checkGameStructure(parsed, mkInventory(), { threeCount: 2, fourCount: 3 });
    expect(issues.some((i) => i.code === 'INSUFFICIENT_THREE_OR_FOUR_TILE_WORDS')).toBe(false);
  });

  it('flags Italy wordlist too short', () => {
    const parsed = mkParsed({
      gameRows: [mkGameRow({ country: 'Italy' })],
      wordRows: Array.from({ length: 10 }, (_, i) =>
        mkWordRow({ wordInLWC: `word${i}` }),
      ),
    });
    const issues = checkGameStructure(parsed, mkInventory());
    expect(issues).toContainEqual(expect.objectContaining({
      code: 'WORDLIST_TOO_SHORT_FOR_ITALY',
      severity: 'error',
    }));
  });

  it('flags Brazil7 without tonal tiles', () => {
    const parsed = mkParsed({
      gameRows: [mkGameRow({ country: 'Brazil', challengeLevel: 7 })],
      tileRows: [mkTileRow({ base: 'a', type: 'V' })], // no type T
    });
    const issues = checkGameStructure(parsed, mkInventory());
    expect(issues).toContainEqual(expect.objectContaining({
      code: 'BRAZIL7_WITHOUT_TONAL_TILES',
      severity: 'error',
    }));
  });

  it('flags Colombia CL4 Syllable', () => {
    const parsed = mkParsed({
      gameRows: [mkGameRow({ country: 'Colombia', challengeLevel: 4, syllOrTile: 'S' })],
    });
    const issues = checkGameStructure(parsed, mkInventory());
    expect(issues).toContainEqual(expect.objectContaining({
      code: 'COLOMBIA_CL4_SYLLABLE',
      severity: 'error',
    }));
  });
});
