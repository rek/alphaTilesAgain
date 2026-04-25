import { buildAllChoices } from '../buildAllChoices';
import { makeTile, makeParsed, seededRng } from './testFixtures';

const TILES = [
  makeTile('c', 'C', ['k', 's', 'x']),
  makeTile('a', 'V', ['e', 'i', 'o']),
  makeTile('t', 'C', ['p', 'q', 'r']),
  makeTile('k'), makeTile('s'), makeTile('x'),
  makeTile('e', 'V'), makeTile('i', 'V'), makeTile('o', 'V'),
  makeTile('p'), makeTile('q'), makeTile('r'),
  makeTile('b'), makeTile('d'), makeTile('f'),
];
const TILE_MAP = new Map(TILES.map((t) => [t.base, t]));
const PARSED = [makeParsed('c'), makeParsed('a', 'V'), makeParsed('t')];

describe('buildAllChoices', () => {
  it('CL1 returns 4 unique choices with correct present', () => {
    const res = buildAllChoices({
      level: 1,
      parsed: PARSED, tileMap: TILE_MAP,
      pools: { V: [], C: [], T: [], AD: [] },
      wordInLOP: 'cat', mixedDefs: '', tiles: TILES,
      scriptType: 'Roman', placeholderCharacter: '◌',
      rng: seededRng(7),
    });
    expect('error' in res).toBe(false);
    if ('error' in res) return;
    expect(res.choices).toHaveLength(4);
    expect(new Set(res.choices).size).toBe(4);
    expect(res.choices).toContain(res.correct);
    // CL1: each wrong has tile[0] replaced from c's trio (k|s|x), tiles[1..2] = 'at'
    for (const c of res.choices) {
      if (c === res.correct) continue;
      expect(['kat', 'sat', 'xat']).toContain(c);
    }
  });

  it('CL2 returns 4 unique choices', () => {
    const res = buildAllChoices({
      level: 2,
      parsed: PARSED, tileMap: TILE_MAP,
      pools: {
        V: [makeTile('e', 'V'), makeTile('i', 'V'), makeTile('o', 'V')],
        C: [makeTile('b'), makeTile('d'), makeTile('f')],
        T: [], AD: [],
      },
      wordInLOP: 'cat', mixedDefs: '', tiles: TILES,
      scriptType: 'Roman', placeholderCharacter: '◌',
      rng: seededRng(99),
    });
    expect('error' in res).toBe(false);
    if ('error' in res) return;
    expect(res.choices).toHaveLength(4);
    expect(new Set(res.choices).size).toBe(4);
    expect(res.choices).toContain(res.correct);
    // CL2 preserves the last tile 't'
    for (const c of res.choices) expect(c[2]).toBe('t');
  });

  it('CL3 returns 4 unique choices, last tile preserved', () => {
    const res = buildAllChoices({
      level: 3,
      parsed: PARSED, tileMap: TILE_MAP,
      pools: { V: [], C: [], T: [], AD: [] },
      wordInLOP: 'cat', mixedDefs: '', tiles: TILES,
      scriptType: 'Roman', placeholderCharacter: '◌',
      rng: seededRng(123),
    });
    expect('error' in res).toBe(false);
    if ('error' in res) return;
    expect(res.choices).toHaveLength(4);
    expect(new Set(res.choices).size).toBe(4);
    for (const c of res.choices) expect(c[2]).toBe('t');
  });

  it('correctSlot is in [0..3]', () => {
    const res = buildAllChoices({
      level: 3,
      parsed: PARSED, tileMap: TILE_MAP,
      pools: { V: [], C: [], T: [], AD: [] },
      wordInLOP: 'cat', mixedDefs: '', tiles: TILES,
      scriptType: 'Roman', placeholderCharacter: '◌',
      rng: seededRng(5),
    });
    if ('error' in res) return;
    expect(res.correctSlot).toBeGreaterThanOrEqual(0);
    expect(res.correctSlot).toBeLessThan(4);
    expect(res.choices[res.correctSlot]).toBe(res.correct);
  });

  it('CL1 returns degenerate when tile[0] has no distractor trio', () => {
    const res = buildAllChoices({
      level: 1,
      parsed: [makeParsed('z'), makeParsed('a', 'V'), makeParsed('t')],
      tileMap: new Map([
        ['z', makeTile('z')],
        ['a', makeTile('a', 'V')],
        ['t', makeTile('t')],
      ]),
      pools: { V: [], C: [], T: [], AD: [] },
      wordInLOP: 'zat', mixedDefs: '',
      tiles: [makeTile('z'), makeTile('a', 'V'), makeTile('t')],
      scriptType: 'Roman', placeholderCharacter: '◌',
      rng: seededRng(1),
    });
    expect('error' in res).toBe(true);
  });
});
