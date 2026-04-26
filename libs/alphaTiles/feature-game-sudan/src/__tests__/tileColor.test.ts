import { tileColor } from '../tileColor';

const COLORS = ['#000', '#111', '#222', '#333', '#444', '#555'];

describe('tileColor', () => {
  it('C returns colorList[1]', () => {
    expect(tileColor('C', COLORS)).toBe('#111');
  });

  it('V returns colorList[2]', () => {
    expect(tileColor('V', COLORS)).toBe('#222');
  });

  it('T returns colorList[3]', () => {
    expect(tileColor('T', COLORS)).toBe('#333');
  });

  it.each(['LV', 'AV', 'BV', 'FV', 'AD', 'D', 'PC', 'X', 'SAD', ''])(
    'falls through to default colorList[4] for type "%s"',
    (type) => {
      expect(tileColor(type, COLORS)).toBe('#444');
    },
  );

  it('vowel sub-types do NOT case-fold to V (matches Java)', () => {
    expect(tileColor('LV', COLORS)).not.toBe(tileColor('V', COLORS));
  });
});
