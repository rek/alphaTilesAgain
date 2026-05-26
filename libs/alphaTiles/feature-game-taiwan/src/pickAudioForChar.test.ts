import { pickAudioForChar } from './pickAudioForChar';

describe('pickAudioForChar', () => {
  it('returns syllable when the pack ships syllable audio for the char', () => {
    const result = pickAudioForChar({
      char: '女',
      syllables: { 女: 42 },
      audioForChar: { 女: 'daughter' },
    });
    expect(result).toEqual({ kind: 'syllable', char: '女' });
  });

  it('falls back to compound-word audio when no syllable entry exists', () => {
    const result = pickAudioForChar({
      char: '醫',
      syllables: {},
      audioForChar: { 醫: 'doctor' },
    });
    expect(result).toEqual({ kind: 'word', lwc: 'doctor' });
  });

  it('returns none when neither syllable nor compound audio exists', () => {
    const result = pickAudioForChar({
      char: 'X',
      syllables: {},
      audioForChar: {},
    });
    expect(result).toEqual({ kind: 'none' });
  });

  it('prefers syllable over compound when both are present', () => {
    const result = pickAudioForChar({
      char: '人',
      syllables: { 人: 7 },
      audioForChar: { 人: 'construction-worker' },
    });
    expect(result).toEqual({ kind: 'syllable', char: '人' });
  });

  it('treats syllables[char] === 0 as defined (handle id 0 is valid)', () => {
    const result = pickAudioForChar({
      char: '一',
      syllables: { 一: 0 },
      audioForChar: { 一: 'one-thousand' },
    });
    expect(result).toEqual({ kind: 'syllable', char: '一' });
  });
});
