import { refAudioKey } from '../refAudioKey';

const tileRow = {
  base: '醫生',
  alt1: '護士',
  alt2: '打針',
  alt3: '醫治',
  type: 'X',
  audioName: 'zz_doctor',
  upper: '醫生',
  tileTypeB: 'none',
  audioNameB: 'X',
  tileTypeC: 'none',
  audioNameC: 'X',
  iconicWord: '0',
  tileColor: '0',
  stageOfFirstAppearance: 1,
  stageOfFirstAppearanceType2: 1,
  stageOfFirstAppearanceType3: 1,
};

describe('refAudioKey', () => {
  it('keys tile refs by tile.base, not the AudioName column (H1: door 234 silent)', () => {
    expect(refAudioKey({ kind: 'tile', tileRow, display: 'TILE_AUDIO' })).toEqual({
      category: 'tile',
      key: '醫生',
    });
  });

  it('keys word refs by wordInLWC', () => {
    const wordRow = { wordInLWC: 'zz_doctor', wordInLOP: '醫生', duration: 0, mixedDefs: '-', stageOfFirstAppearance: '1' };
    expect(refAudioKey({ kind: 'word', wordRow, display: 'WORD_AUDIO' })).toEqual({
      category: 'word',
      key: 'zz_doctor',
    });
  });

  it('keys syllable refs by syllable, not audioName', () => {
    const syllableRow = { syllable: '醫', distractors: ['a', 'b', 'c'] as [string, string, string], audioName: 'yi1', duration: 0, color: '0' };
    expect(refAudioKey({ kind: 'syllable', syllableRow, display: 'SYLLABLE_AUDIO' })).toEqual({
      category: 'syllable',
      key: '醫',
    });
  });
});
