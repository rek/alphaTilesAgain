import { buildWrongCL3 } from '../buildWrongCL3';
import { makeTile, makeParsed, seededRng } from './testFixtures';

describe('buildWrongCL3', () => {
  // word "cat" → ['c','a','t']; CL3 picks idx ∈ {0, 1} and replaces with a distractor of that tile.
  const parsed = [makeParsed('c'), makeParsed('a', 'V'), makeParsed('t')];
  const tileMap = new Map([
    ['c', makeTile('c', 'C', ['k', 's', 'x'])],
    ['a', makeTile('a', 'V', ['e', 'i', 'o'])],
    ['t', makeTile('t', 'C', ['p', 'q', 'r'])],
    ['k', makeTile('k')], ['s', makeTile('s')], ['x', makeTile('x')],
    ['e', makeTile('e', 'V')], ['i', makeTile('i', 'V')], ['o', makeTile('o', 'V')],
    ['p', makeTile('p')], ['q', makeTile('q')], ['r', makeTile('r')],
  ]);

  it('replaces a non-last tile with one of its distractors', () => {
    for (let seed = 1; seed < 50; seed++) {
      const text = buildWrongCL3({
        parsed, tileMap, prior: [], correct: 'cat',
        wordInLOP: 'cat', scriptType: 'Roman', rng: seededRng(seed),
      });
      if (text === null) continue;
      expect(text[2]).toBe('t'); // last tile preserved
      // Exactly one position differs from 'cat'
      const diffs = ['c', 'a', 't'].reduce(
        (n, ch, i) => n + (ch !== text[i] ? 1 : 0),
        0,
      );
      expect(diffs).toBe(1);
      // The replacement at the differing position is in that tile's distractor trio.
      if (text[0] !== 'c') expect(['k', 's', 'x']).toContain(text[0]);
      if (text[1] !== 'a') expect(['e', 'i', 'o']).toContain(text[1]);
    }
  });

  it('returns null when all distractor trios are empty', () => {
    const text = buildWrongCL3({
      parsed,
      tileMap: new Map([
        ['c', makeTile('c')],
        ['a', makeTile('a', 'V')],
        ['t', makeTile('t')],
      ]),
      prior: [], correct: 'cat',
      wordInLOP: 'cat', scriptType: 'Roman', rng: seededRng(1),
    });
    expect(text).toBeNull();
  });
});
