import { checkSyllablesCoherence, shouldCheckSyllables } from '../checkSyllablesCoherence';
import { mkParsed, mkWordRow, mkSyllableRow, mkInventory } from '../../__tests__/testHelpers';

describe('shouldCheckSyllables', () => {
  it('returns false when fewer than 6 words contain dot', () => {
    const parsed = mkParsed({
      wordRows: Array.from({ length: 5 }, (_, i) =>
        mkWordRow({ wordInLWC: `word${i}`, wordInLOP: `syl.lab${i}` }),
      ),
    });
    expect(shouldCheckSyllables(parsed)).toBe(false);
  });

  it('returns true when 6+ words contain dot', () => {
    const parsed = mkParsed({
      wordRows: Array.from({ length: 6 }, (_, i) =>
        mkWordRow({ wordInLWC: `word${i}`, wordInLOP: `syl.lab${i}` }),
      ),
    });
    expect(shouldCheckSyllables(parsed)).toBe(true);
  });
});

describe('checkSyllablesCoherence', () => {
  it('emits SYLLABLES_SKIPPED when fewer than 6 words use dots', () => {
    const parsed = mkParsed({
      wordRows: [mkWordRow({ wordInLOP: 'ab' })],
    });
    const issues = checkSyllablesCoherence(parsed, mkInventory());
    expect(issues).toContainEqual(expect.objectContaining({
      code: 'SYLLABLES_SKIPPED',
      severity: 'info',
    }));
  });

  it('flags unknown syllable reference', () => {
    const words = Array.from({ length: 6 }, (_, i) =>
      mkWordRow({ wordInLWC: `word${i}`, wordInLOP: `syl.lab` }),
    );
    const parsed = mkParsed({
      wordRows: words,
      syllableRows: [mkSyllableRow('syl')], // 'lab' is missing
    });
    const issues = checkSyllablesCoherence(parsed, mkInventory());
    expect(issues).toContainEqual(expect.objectContaining({
      code: 'UNKNOWN_SYLLABLE_REFERENCE',
      severity: 'error',
    }));
  });

  it('flags syllable not used in wordlist', () => {
    const words = Array.from({ length: 6 }, (_, i) =>
      mkWordRow({ wordInLWC: `word${i}`, wordInLOP: `syl.lab` }),
    );
    const parsed = mkParsed({
      wordRows: words,
      syllableRows: [mkSyllableRow('syl'), mkSyllableRow('lab'), mkSyllableRow('unused')],
    });
    const issues = checkSyllablesCoherence(parsed, mkInventory());
    expect(issues).toContainEqual(expect.objectContaining({
      code: 'SYLLABLE_NOT_USED_IN_WORDLIST',
      severity: 'warning',
      context: expect.objectContaining({ syllable: 'unused' }),
    }));
  });

  it('no issues when syllables match words', () => {
    const words = Array.from({ length: 6 }, (_, i) =>
      mkWordRow({ wordInLWC: `word${i}`, wordInLOP: `syl.lab` }),
    );
    const parsed = mkParsed({
      wordRows: words,
      syllableRows: [mkSyllableRow('syl'), mkSyllableRow('lab')],
    });
    const issues = checkSyllablesCoherence(parsed, mkInventory({ syllableAudio: ['syllable_syl', 'syllable_lab'] }));
    // Should have no errors
    expect(issues.filter((i) => i.severity === 'error')).toHaveLength(0);
  });
});
