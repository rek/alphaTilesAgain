import { firstAudibleTile } from '../firstAudibleTile';

function tile(base: string, type = 'C', audioName = base) {
  return {
    base,
    alt1: 'x',
    alt2: 'y',
    alt3: 'z',
    type,
    audioName,
    upper: base.toUpperCase(),
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

function word(lop: string) {
  return {
    wordInLWC: lop,
    wordInLOP: lop,
    duration: 0,
    mixedDefs: '-',
    stageOfFirstAppearance: '1',
  };
}

describe('firstAudibleTile', () => {
  it('returns first tile when none silent', () => {
    const tiles = [tile('a'), tile('b'), tile('c')];
    expect(firstAudibleTile(word('abc'), tiles)?.base).toBe('a');
  });

  it('skips a leading silent (zz_no_audio_needed) tile', () => {
    // word "xab": "x" tile is silent, "a" should be returned as first audible.
    const tiles = [tile('x', 'PC', 'zz_no_audio_needed'), tile('a'), tile('b')];
    expect(firstAudibleTile(word('xab'), tiles)?.base).toBe('a');
  });

  it('skips multiple leading silent tiles', () => {
    const tiles = [
      tile('x', 'PC', 'zz_no_audio_needed'),
      tile('y', 'AD', 'zz_no_audio_needed'),
      tile('a'),
    ];
    expect(firstAudibleTile(word('xya'), tiles)?.base).toBe('a');
  });

  it('strips instruction characters before tokenising', () => {
    const tiles = [tile('a'), tile('b')];
    expect(firstAudibleTile(word('a.b'), tiles)?.base).toBe('a');
    expect(firstAudibleTile(word('a#b'), tiles)?.base).toBe('a');
  });

  it('returns null when word has no parseable tiles', () => {
    const tiles = [tile('a')];
    expect(firstAudibleTile(word('zzz'), tiles)).toBeNull();
  });

  it('falls back to first parsed tile when all are silent', () => {
    const tiles = [
      tile('a', 'PC', 'zz_no_audio_needed'),
      tile('b', 'AD', 'zz_no_audio_needed'),
    ];
    expect(firstAudibleTile(word('ab'), tiles)?.base).toBe('a');
  });

  it('uses longest-match tokenisation', () => {
    // 'sh' should beat 's' + 'h'
    const tiles = [tile('s'), tile('h'), tile('sh')];
    expect(firstAudibleTile(word('sha'), tiles)?.base).toBe('sh');
  });
});
