import { checkWordlistCharacters } from '../checkWordlistCharacters';
import { mkParsed, mkWordRow } from '../../__tests__/testHelpers';

describe('checkWordlistCharacters', () => {
  it('no issues on clean wordlist', () => {
    const parsed = mkParsed({
      wordRows: [
        mkWordRow({ wordInLWC: 'apple', wordInLOP: 'apple' }),
        mkWordRow({ wordInLWC: 'bat', wordInLOP: 'bat' }),
      ],
    });
    expect(checkWordlistCharacters(parsed)).toHaveLength(0);
  });

  it('flags invalid LWC chars (uppercase)', () => {
    const parsed = mkParsed({
      wordRows: [mkWordRow({ wordInLWC: 'Apple', wordInLOP: 'apple' })],
    });
    const issues = checkWordlistCharacters(parsed);
    expect(issues).toContainEqual(expect.objectContaining({
      code: 'INVALID_WORDLIST_LWC_CHARS',
      severity: 'error',
    }));
  });

  it('flags empty LOP value', () => {
    const parsed = mkParsed({
      wordRows: [mkWordRow({ wordInLWC: 'apple', wordInLOP: '' })],
    });
    const issues = checkWordlistCharacters(parsed);
    expect(issues).toContainEqual(expect.objectContaining({
      code: 'EMPTY_LOP_VALUE',
      severity: 'error',
    }));
  });

  it('emits warning when >5% of words have spaces in LOP', () => {
    // 2 out of 2 words have spaces = 100% > 5%
    const parsed = mkParsed({
      wordRows: [
        mkWordRow({ wordInLWC: 'red_apple', wordInLOP: 'red apple' }),
        mkWordRow({ wordInLWC: 'blue_bird', wordInLOP: 'blue bird' }),
      ],
    });
    const issues = checkWordlistCharacters(parsed);
    expect(issues).toContainEqual(expect.objectContaining({
      code: 'MANY_WORDS_HAVE_SPACES',
      severity: 'warning',
    }));
  });
});
