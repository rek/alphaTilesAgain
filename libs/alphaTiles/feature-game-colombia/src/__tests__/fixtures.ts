import type { ParsedTile } from '@shared/util-phoneme';
import type { TileRow, KeyboardKey } from '../buildKeyboard';
import type { SyllableRow } from '../drawSyllableDistractor';

export function makeTile(
  base: string,
  type = 'C',
  alts: [string, string, string] = ['', '', ''],
): TileRow {
  return {
    base,
    alt1: alts[0],
    alt2: alts[1],
    alt3: alts[2],
    type,
    audioName: '',
    upper: base,
    tileTypeB: 'none',
    audioNameB: '',
    tileTypeC: 'none',
    audioNameC: '',
    iconicWord: '',
    tileColor: '0',
    stageOfFirstAppearance: 1,
    stageOfFirstAppearanceType2: 1,
    stageOfFirstAppearanceType3: 1,
  } as TileRow;
}

export function makeParsed(base: string, type = 'C'): ParsedTile {
  return {
    base,
    typeOfThisTileInstance: type,
    stageOfFirstAppearanceForThisTileType: 1,
    audioForThisTileType: '',
    tileType: type,
    tileTypeB: 'none',
    tileTypeC: 'none',
  };
}

export function makeSyllable(
  syllable: string,
  distractors: [string, string, string] = ['', '', ''],
): SyllableRow {
  return {
    syllable,
    distractors,
    audioName: '',
    duration: 0,
    color: '0',
  } as SyllableRow;
}

export function makeKey(key: string, color = '0'): KeyboardKey {
  return { key, color } as KeyboardKey;
}

export function seededRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}
