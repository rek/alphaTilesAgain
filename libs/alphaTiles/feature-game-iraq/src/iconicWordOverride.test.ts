import { resolveIconicWordOverride } from './iconicWordOverride';

function makeWord(wordInLOP: string) {
  return {
    wordInLWC: wordInLOP,
    wordInLOP,
    duration: 0,
    mixedDefs: '',
    stageOfFirstAppearance: '1',
  };
}

describe('resolveIconicWordOverride', () => {
  const words = [makeWord('cat'), makeWord('dog'), makeWord('apple')];

  it('returns null when level is not 2', () => {
    expect(resolveIconicWordOverride({ iconicWord: 'cat' }, words, 1)).toBeNull();
    expect(resolveIconicWordOverride({ iconicWord: 'cat' }, words, 3)).toBeNull();
  });

  it('returns null when iconicWord is empty', () => {
    expect(resolveIconicWordOverride({ iconicWord: '' }, words, 2)).toBeNull();
  });

  it('returns null when iconicWord is "-"', () => {
    expect(resolveIconicWordOverride({ iconicWord: '-' }, words, 2)).toBeNull();
  });

  it('returns null when iconicWord is not in wordlist', () => {
    expect(resolveIconicWordOverride({ iconicWord: 'zebra' }, words, 2)).toBeNull();
  });

  it('returns matching word when level=2 and iconicWord matches', () => {
    const out = resolveIconicWordOverride({ iconicWord: 'cat' }, words, 2);
    expect(out?.wordInLOP).toBe('cat');
  });
});
