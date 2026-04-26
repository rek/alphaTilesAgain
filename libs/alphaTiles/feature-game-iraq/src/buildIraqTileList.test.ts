import { buildIraqTileList } from './buildIraqTileList';

type TileRow = {
  base: string;
  alt1: string;
  alt2: string;
  alt3: string;
  type: string;
  audioName: string;
  upper: string;
  tileTypeB: string;
  audioNameB: string;
  tileTypeC: string;
  audioNameC: string;
  iconicWord: string;
  tileColor: string;
  stageOfFirstAppearance: number;
  stageOfFirstAppearanceType2: number;
  stageOfFirstAppearanceType3: number;
};

function tile(
  base: string,
  type = 'C',
  opts: Partial<TileRow> = {},
): TileRow {
  return {
    base,
    alt1: '',
    alt2: '',
    alt3: '',
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
    ...opts,
  };
}

describe('buildIraqTileList', () => {
  it('excludes SAD tiles', () => {
    const tiles = [tile('a', 'V'), tile(' ', 'SAD'), tile('b', 'C')];
    const out = buildIraqTileList({ tiles, differentiatesTileTypes: true });
    expect(out.map((t) => t.base)).toEqual(['a', 'b']);
  });

  it('excludes silent placeholder consonants (PC + zz_no_audio_needed)', () => {
    const tiles = [
      tile('a', 'V'),
      tile('x', 'PC', { audioName: 'zz_no_audio_needed' }),
      tile('b', 'C'),
    ];
    const out = buildIraqTileList({ tiles, differentiatesTileTypes: true });
    expect(out.map((t) => t.base)).toEqual(['a', 'b']);
  });

  it('keeps non-silent PC tiles', () => {
    const tiles = [tile('a', 'V'), tile('x', 'PC', { audioName: 'x_audio' })];
    const out = buildIraqTileList({ tiles, differentiatesTileTypes: true });
    expect(out.map((t) => t.base)).toEqual(['a', 'x']);
  });

  it('sorts alphabetically by base', () => {
    const tiles = [tile('c'), tile('a'), tile('b')];
    const out = buildIraqTileList({ tiles, differentiatesTileTypes: true });
    expect(out.map((t) => t.base)).toEqual(['a', 'b', 'c']);
  });

  it('keeps multitype duplicates when differentiatesTileTypes=true', () => {
    const tiles = [tile('a', 'V'), tile('a', 'C')];
    const out = buildIraqTileList({ tiles, differentiatesTileTypes: true });
    expect(out.map((t) => `${t.base}-${t.type}`)).toEqual(['a-V', 'a-C']);
  });

  it('drops multitype duplicates by base when differentiatesTileTypes=false', () => {
    const tiles = [tile('a', 'V'), tile('a', 'C'), tile('b', 'C')];
    const out = buildIraqTileList({ tiles, differentiatesTileTypes: false });
    expect(out.map((t) => `${t.base}-${t.type}`)).toEqual(['a-V', 'b-C']);
  });

  it('returns empty list when input is empty', () => {
    expect(buildIraqTileList({ tiles: [], differentiatesTileTypes: false })).toEqual([]);
  });
});
