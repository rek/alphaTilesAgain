import { buildSyllableChoices } from '../buildSyllableChoices';

const syl = (s: string, distractors: [string, string, string] = ['', '', '']) => ({
  syllable: s,
  distractors,
  audioName: '',
  duration: 0,
  color: '',
});

describe('buildSyllableChoices', () => {
  const allSyllables = [syl('ka'), syl('ki'), syl('ko'), syl('ku'), syl('ke')];

  it('SL1 picks 4 from pool and ensures correct is present', () => {
    const correct = syl('xi');
    const r = buildSyllableChoices({
      challengeLevel: 1,
      correct,
      syllablePool: ['ka', 'ki', 'ko', 'ku', 'ke'],
      allSyllables,
      rand: () => 0,
    });
    expect(r.visibleChoiceCount).toBe(4);
    const visible = r.choices.filter((c) => c.visible).map((c) => c.text);
    expect(visible).toContain('xi');
    expect(visible).toHaveLength(4);
  });

  it('SL2 returns correct + 3 distractors', () => {
    const correct = syl('ka', ['ki', 'ko', 'ku']);
    const r = buildSyllableChoices({
      challengeLevel: 2,
      correct,
      syllablePool: ['ka', 'ki', 'ko', 'ku', 'ke'],
      allSyllables,
      rand: () => 0,
    });
    const visible = r.choices.filter((c) => c.visible).map((c) => c.text).sort();
    expect(visible).toEqual(['ka', 'ki', 'ko', 'ku']);
  });

  it('SL2 fills missing slots from random pool when distractors collapse', () => {
    const correct = syl('ka', ['ka', 'ka', 'ka']);
    const r = buildSyllableChoices({
      challengeLevel: 2,
      correct,
      syllablePool: ['ka', 'ki', 'ko'],
      allSyllables,
      rand: () => 0,
    });
    const visible = r.choices.filter((c) => c.visible).map((c) => c.text);
    expect(visible).toHaveLength(4);
    expect(visible).toContain('ka');
  });
});
