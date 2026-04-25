import type { ParsedTile, TileEntry } from '@shared/util-phoneme';

export function makeTile(
  base: string,
  type = 'C',
  alts: [string, string, string] = ['', '', ''],
): TileEntry & { upper: string; iconicWord: string; tileColor: string } {
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
  };
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

export function seededRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}
