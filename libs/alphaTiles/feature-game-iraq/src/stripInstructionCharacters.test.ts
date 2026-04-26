import { stripInstructionCharacters } from './stripInstructionCharacters';

describe('stripInstructionCharacters', () => {
  it('strips period (syllable break)', () => {
    expect(stripInstructionCharacters('sun.burn')).toBe('sunburn');
  });

  it('strips hashtag (intra-syllable tile break)', () => {
    expect(stripInstructionCharacters('k#uun')).toBe('kuun');
  });

  it('strips multiple of both', () => {
    expect(stripInstructionCharacters('a.b#c.d')).toBe('abcd');
  });

  it('returns input unchanged when no instruction chars present', () => {
    expect(stripInstructionCharacters('cat')).toBe('cat');
  });

  it('handles empty string', () => {
    expect(stripInstructionCharacters('')).toBe('');
  });
});
