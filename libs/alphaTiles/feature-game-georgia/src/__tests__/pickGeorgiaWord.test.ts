import {
  pickGeorgiaTileWord,
  pickGeorgiaSyllableWord,
} from '../pickGeorgiaWord';
import { makeTile } from './testFixtures';

function makeWord(s: string) {
  return {
    wordInLWC: s,
    wordInLOP: s,
    duration: 0,
    mixedDefs: '',
    stageOfFirstAppearance: '1',
  };
}

describe('pickGeorgiaTileWord (CorV filter)', () => {
  const tiles = ['c', 'a', 't', 'd', 'o', 'g'].map((b) =>
    makeTile(b, b === 'a' || b === 'o' ? 'V' : 'C'),
  );
  const corVTexts = new Set(tiles.map((t) => t.base));

  it('returns insufficient-content for empty word list', () => {
    const res = pickGeorgiaTileWord({
      level: 1,
      words: [],
      tiles,
      corVTexts,
      scriptType: 'Roman',
      placeholderCharacter: '◌',
      rng: () => 0,
    });
    expect('error' in res).toBe(true);
  });

  it('picks a tile-mode word when correct is in corV', () => {
    const res = pickGeorgiaTileWord({
      level: 1,
      words: [makeWord('cat'), makeWord('dog')],
      tiles,
      corVTexts,
      scriptType: 'Roman',
      placeholderCharacter: '◌',
      rng: () => 0,
    });
    expect('word' in res).toBe(true);
    if ('word' in res) {
      expect(['c', 'd']).toContain(res.correct.base);
    }
  });

  it('retries when correct is not in corV', () => {
    const tilesNoC = tiles.filter((t) => t.base !== 'c');
    const corVTextsNoC = new Set(tilesNoC.map((t) => t.base));
    let n = 0;
    const rng = () => (n++ === 0 ? 0 : 0.999); // first pick → idx 0 ('cat'), then 'dog'
    const res = pickGeorgiaTileWord({
      level: 1,
      words: [makeWord('cat'), makeWord('dog')],
      tiles,
      corVTexts: corVTextsNoC,
      scriptType: 'Roman',
      placeholderCharacter: '◌',
      rng,
    });
    expect('word' in res).toBe(true);
    if ('word' in res) {
      expect(res.correct.base).toBe('d');
    }
  });
});

describe('pickGeorgiaSyllableWord (no CorV filter)', () => {
  it('skips CorV check entirely', () => {
    const res = pickGeorgiaSyllableWord({
      words: [
        {
          wordInLWC: 'saka',
          wordInLOP: 'saka',
          duration: 0,
          mixedDefs: '',
          stageOfFirstAppearance: '1',
        },
      ],
      rng: () => 0,
    });
    expect('word' in res).toBe(true);
  });
});
