import { buildChoices } from '../buildChoices';
import type { LangAssets } from '@alphaTiles/data-language-assets';

type TileRow = LangAssets['tiles']['rows'][number];

function row(base: string, type = 'V'): TileRow {
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
    tileColor: '',
    stageOfFirstAppearance: 1,
    stageOfFirstAppearanceType2: 1,
    stageOfFirstAppearanceType3: 1,
  };
}

const vowels = ['a', 'e', 'i', 'o', 'u'].map((b) => row(b, 'V'));
const consonants = ['k', 'g', 'm', 'n', 'p', 's', 't'].map((b) => row(b, 'C'));
const tones = ['́', '̀'].map((b) => row(b, 'T'));

describe('buildChoices', () => {
  it('CL1 shows 4 vowel choices including correct', () => {
    const correct = { base: 'a', alt1: '', alt2: '', alt3: '' };
    const r = buildChoices({ challengeLevel: 1, correct, vowels, consonants, tones, rand: () => 0 });
    expect(r.visibleChoiceCount).toBe(4);
    const visible = r.choices.filter((c) => c.visible).map((c) => c.text);
    expect(visible).toHaveLength(4);
    expect(visible).toContain('a');
  });

  it('CL3 shows up to 15 vowels including correct', () => {
    const big = Array.from({ length: 20 }, (_, i) => row(`v${i}`, 'V'));
    const correct = { base: 'v17', alt1: '', alt2: '', alt3: '' };
    const r = buildChoices({ challengeLevel: 3, correct, vowels: big, consonants, tones, rand: () => 0 });
    expect(r.visibleChoiceCount).toBe(15);
    const visible = r.choices.filter((c) => c.visible).map((c) => c.text);
    expect(visible).toHaveLength(15);
    expect(visible).toContain('v17');
  });

  it('CL3 caps at pool size when pool < 15', () => {
    const correct = { base: 'a', alt1: '', alt2: '', alt3: '' };
    const r = buildChoices({ challengeLevel: 3, correct, vowels, consonants, tones, rand: () => 0 });
    expect(r.visibleChoiceCount).toBe(5);
  });

  it('CL7 with 2 tones shows 2 buttons', () => {
    const correct = { base: '́', alt1: '', alt2: '', alt3: '' };
    const r = buildChoices({ challengeLevel: 7, correct, vowels, consonants, tones, rand: () => 0 });
    expect(r.visibleChoiceCount).toBe(2);
  });

  it('CL7 caps at 4 when more tones exist', () => {
    const manyTones = Array.from({ length: 6 }, (_, i) => row(`t${i}`, 'T'));
    const correct = { base: 't3', alt1: '', alt2: '', alt3: '' };
    const r = buildChoices({ challengeLevel: 7, correct, vowels, consonants, tones: manyTones, rand: () => 0 });
    expect(r.visibleChoiceCount).toBe(4);
  });

  it('CL2 returns correct + 3 distractors', () => {
    const correct = { base: 'a', alt1: 'e', alt2: 'i', alt3: 'o' };
    const r = buildChoices({ challengeLevel: 2, correct, vowels, consonants, tones, rand: () => 0.5 });
    const visible = r.choices.filter((c) => c.visible).map((c) => c.text).sort();
    expect(visible).toEqual(['a', 'e', 'i', 'o']);
  });

  it('CL5 returns correct + 3 distractor consonants', () => {
    const correct = { base: 'k', alt1: 'g', alt2: 'm', alt3: 'n' };
    const r = buildChoices({ challengeLevel: 5, correct, vowels, consonants, tones, rand: () => 0 });
    const visible = r.choices.filter((c) => c.visible).map((c) => c.text).sort();
    expect(visible).toEqual(['g', 'k', 'm', 'n']);
  });

  it('CL4 includes correct consonant when not in random sample', () => {
    const correct = { base: 'z', alt1: '', alt2: '', alt3: '' };
    const r = buildChoices({ challengeLevel: 4, correct, vowels, consonants, tones, rand: () => 0 });
    const visible = r.choices.filter((c) => c.visible).map((c) => c.text);
    expect(visible).toContain('z');
  });
});
