import { pickPeruWord } from '../pickPeruWord';

function makeWord(s: string) {
  return { wordInLWC: s, wordInLOP: s, duration: 0, mixedDefs: '', stageOfFirstAppearance: '1' };
}
function makeTile(base: string, type = 'C') {
  return {
    base, alt1: '', alt2: '', alt3: '',
    type, audioName: '', upper: base,
    tileTypeB: 'none', audioNameB: '',
    tileTypeC: 'none', audioNameC: '',
    iconicWord: '', tileColor: '0',
    stageOfFirstAppearance: 1,
    stageOfFirstAppearanceType2: 1,
    stageOfFirstAppearanceType3: 1,
  };
}

describe('pickPeruWord', () => {
  const tiles = ['c', 'a', 't', 'd', 'o', 'g', 'h'].map((b, i) =>
    makeTile(b, i % 2 === 0 ? 'C' : 'V'),
  );

  it('returns insufficient-content when words is empty', () => {
    const res = pickPeruWord({
      words: [], tiles,
      scriptType: 'Roman', placeholderCharacter: '◌',
    });
    expect('error' in res).toBe(true);
  });

  it('picks a word with >=2 parsed tiles', () => {
    const res = pickPeruWord({
      words: [makeWord('cat'), makeWord('dog')],
      tiles,
      scriptType: 'Roman',
      placeholderCharacter: '◌',
      rng: () => 0,
    });
    expect('word' in res).toBe(true);
    if ('word' in res) {
      expect(res.parsed.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('rejects single-tile words', () => {
    const res = pickPeruWord({
      words: [makeWord('a')], // only 'a' is a vowel tile, single tile parse
      tiles: [makeTile('a', 'V')],
      scriptType: 'Roman',
      placeholderCharacter: '◌',
    });
    expect('error' in res).toBe(true);
  });
});
