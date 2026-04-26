import { stripInstructionCharacters } from '../stripInstructionCharacters';

describe('stripInstructionCharacters', () => {
  it('strips dot syllable breaks', () => {
    expect(stripInstructionCharacters('sun.burn')).toBe('sunburn');
  });

  it('strips hash tile breaks', () => {
    expect(stripInstructionCharacters('k#uun')).toBe('kuun');
  });

  it('strips both characters', () => {
    expect(stripInstructionCharacters('a.b#c.d')).toBe('abcd');
  });

  it('leaves a clean word untouched', () => {
    expect(stripInstructionCharacters('cat')).toBe('cat');
  });

  it('handles empty string', () => {
    expect(stripInstructionCharacters('')).toBe('');
  });
});
