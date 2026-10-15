import { selfTestSuggestion } from '../selfTestSuggestion';

describe('selfTestSuggestion', () => {
  const allTiers = [0, 1, 2, 3, 4, 5, 6];

  it('bands by share correct', () => {
    expect(selfTestSuggestion({ correct: 9, total: 10, tiers: allTiers })).toEqual({ band: 'high', step: 4 });
    expect(selfTestSuggestion({ correct: 6, total: 10, tiers: allTiers })).toEqual({ band: 'mid', step: 2 });
    expect(selfTestSuggestion({ correct: 4, total: 10, tiers: allTiers })).toEqual({ band: 'low', step: 0 });
  });

  it('moves to the nearest step the pack has', () => {
    // yue-like: no Step 1, starts at 0 then 2
    expect(selfTestSuggestion({ correct: 6, total: 10, tiers: [0, 2, 3, 5] }).step).toBe(2);
    expect(selfTestSuggestion({ correct: 10, total: 10, tiers: [0, 2, 3, 5] }).step).toBe(5);
    expect(selfTestSuggestion({ correct: 10, total: 10, tiers: [0, 2, 3] }).step).toBe(3);
  });

  it('empty run → low band', () => {
    expect(selfTestSuggestion({ correct: 0, total: 0, tiers: [] })).toEqual({ band: 'low', step: 0 });
  });
});
