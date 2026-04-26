import { buildKeyboard } from '../buildKeyboard';
import type { KeyTile } from '../types';
import {
  makeTile, makeParsed, makeSyllable, makeKey, seededRng,
} from './fixtures';

const PALETTE = ['#0', '#1', '#2', '#3', '#4', '#5'];

describe('buildKeyboard', () => {
  describe('CL1', () => {
    it('T-CL1: returns parsed tiles shuffled, duplicates preserved', () => {
      const parsed = [
        makeParsed('a'),
        makeParsed('b'),
        makeParsed('a'),
      ];
      const r = buildKeyboard({
        level: 1,
        variant: 'T',
        parsedTiles: parsed,
        parsedSyllables: [],
        tileList: [makeTile('a'), makeTile('b')],
        syllableList: [],
        keyList: [],
        colorList: PALETTE,
        rng: seededRng(1),
      });
      expect(r.keys).toHaveLength(3);
      const texts = r.keys.map((k: KeyTile) => k.text).sort();
      expect(texts).toEqual(['a', 'a', 'b']);
      expect(r.paginated).toBe(false);
      expect(r.totalScreens).toBe(1);
    });

    it('T-CL1: uses colorList[k % 5] cycle', () => {
      const parsed = [makeParsed('a'), makeParsed('b'), makeParsed('c')];
      const r = buildKeyboard({
        level: 1, variant: 'T',
        parsedTiles: parsed, parsedSyllables: [],
        tileList: [], syllableList: [], keyList: [],
        colorList: PALETTE, rng: seededRng(1),
      });
      expect(r.keys[0].bgColor).toBe('#0');
      expect(r.keys[1].bgColor).toBe('#1');
      expect(r.keys[2].bgColor).toBe('#2');
    });

    it('S-CL1: returns parsed syllables shuffled, duplicates preserved', () => {
      const syls = [makeSyllable('ka'), makeSyllable('to')];
      const r = buildKeyboard({
        level: 1, variant: 'S',
        parsedTiles: [], parsedSyllables: syls,
        tileList: [], syllableList: [], keyList: [],
        colorList: PALETTE, rng: seededRng(1),
      });
      expect(r.keys.map((k: KeyTile) => k.text).sort()).toEqual(['ka', 'to']);
    });
  });

  describe('CL2', () => {
    it('T-CL2: keyboard size is 2x parsed length', () => {
      const tiles = [makeTile('a', 'V', ['e', 'o', 'i']), makeTile('b', 'C', ['p', 'd', 'g'])];
      const parsed = [makeParsed('a', 'V'), makeParsed('b', 'C')];
      const r = buildKeyboard({
        level: 2, variant: 'T',
        parsedTiles: parsed, parsedSyllables: [],
        tileList: [...tiles, makeTile('e'), makeTile('o'), makeTile('i'),
                   makeTile('p'), makeTile('d'), makeTile('g')],
        syllableList: [], keyList: [],
        colorList: PALETTE, rng: seededRng(1),
      });
      expect(r.keys).toHaveLength(4);
    });

    it('S-CL2: keyboard size is 2x parsed length', () => {
      const target = makeSyllable('ka', ['ke', 'ko', 'ki']);
      const r = buildKeyboard({
        level: 2, variant: 'S',
        parsedTiles: [], parsedSyllables: [target],
        tileList: [], syllableList: [target, makeSyllable('ke'), makeSyllable('ko')],
        keyList: [],
        colorList: PALETTE, rng: seededRng(1),
      });
      expect(r.keys).toHaveLength(2);
    });
  });

  describe('CL3-T', () => {
    it('uses keyList from aa_keyboard.txt', () => {
      const keys = [makeKey('a', '0'), makeKey('b', '1'), makeKey('c', '2')];
      const r = buildKeyboard({
        level: 3, variant: 'T',
        parsedTiles: [makeParsed('a')], parsedSyllables: [],
        tileList: [], syllableList: [], keyList: keys,
        colorList: PALETTE, rng: seededRng(1),
      });
      expect(r.keys.map((k: KeyTile) => k.text)).toEqual(['a', 'b', 'c']);
      expect(r.keys.map((k: KeyTile) => k.bgColor)).toEqual(['#0', '#1', '#2']);
      expect(r.paginated).toBe(false);
    });

    it('paginates when keyList.length > 35', () => {
      const keys = Array.from({ length: 70 }, (_, i) => makeKey(`k${i}`, '0'));
      const r = buildKeyboard({
        level: 3, variant: 'T',
        parsedTiles: [makeParsed('k0')], parsedSyllables: [],
        tileList: [], syllableList: [], keyList: keys,
        colorList: PALETTE, rng: seededRng(1),
      });
      expect(r.paginated).toBe(true);
      expect(r.totalScreens).toBe(3);
      expect(r.partial).toBe(4);
    });

    it('does not paginate at 35 keys exactly', () => {
      const keys = Array.from({ length: 35 }, (_, i) => makeKey(`k${i}`, '0'));
      const r = buildKeyboard({
        level: 3, variant: 'T',
        parsedTiles: [makeParsed('k0')], parsedSyllables: [],
        tileList: [], syllableList: [], keyList: keys,
        colorList: PALETTE, rng: seededRng(1),
      });
      expect(r.paginated).toBe(false);
    });
  });

  describe('CL3-S', () => {
    it('caps at 18 keys total (no pagination)', () => {
      const target = makeSyllable('ka', ['ke', 'ko', 'ki']);
      const pool = Array.from({ length: 30 }, (_, i) => makeSyllable(`s${i}`));
      const r = buildKeyboard({
        level: 3, variant: 'S',
        parsedTiles: [], parsedSyllables: [target],
        tileList: [], syllableList: [target, ...pool], keyList: [],
        colorList: PALETTE, rng: seededRng(1),
      });
      expect(r.keys.length).toBeLessThanOrEqual(18);
      expect(r.paginated).toBe(false);
    });
  });

  describe('CL4-T', () => {
    it('dedupes adjacent duplicates and applies type colors', () => {
      const tiles = [
        makeTile('a', 'C'),
        makeTile('a', 'C'),
        makeTile('e', 'V'),
        makeTile('-', 'T'),
        makeTile('?', 'X'),
      ];
      const r = buildKeyboard({
        level: 4, variant: 'T',
        parsedTiles: [makeParsed('a', 'C')], parsedSyllables: [],
        tileList: tiles, syllableList: [], keyList: [],
        colorList: PALETTE, rng: seededRng(1),
      });
      expect(r.keys).toHaveLength(4);
      expect(r.keys[0].bgColor).toBe('#1');
      expect(r.keys[1].bgColor).toBe('#2');
      expect(r.keys[2].bgColor).toBe('#3');
      expect(r.keys[3].bgColor).toBe('#4');
    });

    it('paginates when deduped tileList exceeds 35', () => {
      const tiles = Array.from({ length: 50 }, (_, i) => makeTile(`t${i}`, 'C'));
      const r = buildKeyboard({
        level: 4, variant: 'T',
        parsedTiles: [makeParsed('t0', 'C')], parsedSyllables: [],
        tileList: tiles, syllableList: [], keyList: [],
        colorList: PALETTE, rng: seededRng(1),
      });
      expect(r.paginated).toBe(true);
      expect(r.totalScreens).toBe(2);
      expect(r.partial).toBe(17);
    });
  });

  describe('S-CL4', () => {
    it('returns empty keyboard (caller redirects)', () => {
      const r = buildKeyboard({
        level: 4, variant: 'S',
        parsedTiles: [], parsedSyllables: [makeSyllable('ka')],
        tileList: [], syllableList: [], keyList: [],
        colorList: PALETTE, rng: seededRng(1),
      });
      expect(r.keys).toEqual([]);
      expect(r.visible).toBe(0);
    });
  });
});
