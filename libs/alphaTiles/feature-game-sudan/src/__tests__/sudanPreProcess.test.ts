import {
  buildSudanData,
  TILE_PAGE_SIZE,
  SYLLABLE_PAGE_SIZE,
} from '../sudanPreProcess';

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
  placeholder13: string;
  stageOfFirstAppearance: number;
  stageOfFirstAppearanceType2: number;
  stageOfFirstAppearanceType3: number;
};

function tile(
  base: string,
  type: string,
  opts: Partial<TileRow> = {},
): TileRow {
  return {
    base,
    alt1: '',
    alt2: '',
    alt3: '',
    type,
    audioName: opts.audioName ?? base,
    upper: '',
    tileTypeB: 'none',
    audioNameB: '',
    tileTypeC: 'none',
    audioNameC: '',
    iconicWord: '',
    tileColor: '0',
    placeholder13: '',
    stageOfFirstAppearance: opts.stageOfFirstAppearance ?? 1,
    stageOfFirstAppearanceType2: 1,
    stageOfFirstAppearanceType3: 1,
  };
}

function makeAssets(
  rows: TileRow[],
  syllableRows: { syllable: string; audioName: string; color: string; duration: number }[] = [],
) {
  const fullSyllables = syllableRows.map((s) => ({
    ...s,
    distractors: ['', '', ''] as [string, string, string],
  }));
  return {
    tiles: { rows, headers: {} },
    syllables: { rows: fullSyllables },
  } as unknown as Parameters<typeof buildSudanData>[0];
}

describe('buildSudanData — tile filter', () => {
  it('excludes SAD tiles', () => {
    const rows = [
      tile('a', 'V'),
      tile('sad', 'SAD'),
      tile('b', 'C'),
    ];
    const data = buildSudanData(makeAssets(rows));
    const flat = data.tilePages.flat().map((t) => t.base);
    expect(flat).toEqual(['a', 'b']);
  });

  it('excludes silent placeholder consonants (audio = zz_no_audio_needed)', () => {
    const rows = [
      tile('a', 'V'),
      tile('p', 'PC', { audioName: 'zz_no_audio_needed' }),
      tile('q', 'C', { audioName: 'zz_no_audio_needed' }),
      tile('b', 'C'),
    ];
    const data = buildSudanData(makeAssets(rows));
    const flat = data.tilePages.flat().map((t) => t.base);
    expect(flat).toEqual(['a', 'b']);
  });

  it('respects stage gate', () => {
    const rows = [
      tile('a', 'V', { stageOfFirstAppearance: 1 }),
      tile('b', 'C', { stageOfFirstAppearance: 3 }),
      tile('c', 'C', { stageOfFirstAppearance: 7 }),
    ];
    const data = buildSudanData(makeAssets(rows), 2);
    const flat = data.tilePages.flat().map((t) => t.base);
    expect(flat).toEqual(['a']);
  });

  it('preserves typeOfThisTileInstance and audio identifiers', () => {
    const rows = [tile('x', 'V', { audioName: 'x_aud' })];
    const data = buildSudanData(makeAssets(rows));
    expect(data.tilePages[0][0]).toEqual({
      base: 'x',
      typeOfThisTileInstance: 'V',
      audioForThisTileType: 'x_aud',
    });
  });
});

describe('buildSudanData — pagination', () => {
  it('tiles paginate at TILE_PAGE_SIZE (63)', () => {
    const N = TILE_PAGE_SIZE * 2 + 5;
    const rows = Array.from({ length: N }, (_, i) => tile(`t${i}`, 'V'));
    const data = buildSudanData(makeAssets(rows));
    expect(data.tilePages.length).toBe(Math.ceil(N / TILE_PAGE_SIZE));
    expect(data.tilePages[0]).toHaveLength(TILE_PAGE_SIZE);
    expect(data.tilePages[1]).toHaveLength(TILE_PAGE_SIZE);
    expect(data.tilePages[2]).toHaveLength(5);
  });

  it('a single empty page is returned for empty tile list', () => {
    const data = buildSudanData(makeAssets([]));
    expect(data.tilePages).toHaveLength(1);
    expect(data.tilePages[0]).toEqual([]);
  });

  it('exactly one page when count <= TILE_PAGE_SIZE', () => {
    const rows = Array.from({ length: TILE_PAGE_SIZE }, (_, i) => tile(`t${i}`, 'V'));
    const data = buildSudanData(makeAssets(rows));
    expect(data.tilePages).toHaveLength(1);
    expect(data.tilePages[0]).toHaveLength(TILE_PAGE_SIZE);
  });

  it('syllables paginate at SYLLABLE_PAGE_SIZE (35)', () => {
    const N = SYLLABLE_PAGE_SIZE * 3 + 10;
    const syllables = Array.from({ length: N }, (_, i) => ({
      syllable: `s${i}`,
      audioName: `s${i}_aud`,
      color: String(i % 5),
      duration: 100,
    }));
    const data = buildSudanData(makeAssets([], syllables));
    expect(data.syllablePages.length).toBe(Math.ceil(N / SYLLABLE_PAGE_SIZE));
    expect(data.syllablePages[0]).toHaveLength(SYLLABLE_PAGE_SIZE);
    expect(data.syllablePages[3]).toHaveLength(10);
  });

  it('syllables empty list yields one empty page', () => {
    const data = buildSudanData(makeAssets([], []));
    expect(data.syllablePages).toHaveLength(1);
    expect(data.syllablePages[0]).toEqual([]);
  });
});
