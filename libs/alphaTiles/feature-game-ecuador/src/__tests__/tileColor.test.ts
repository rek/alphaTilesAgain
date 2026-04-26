import { tileColor } from '../tileColor';

describe('tileColor', () => {
  const palette = ['#A', '#B', '#C', '#D', '#E', '#F', '#G'];

  it('cycles every 5 indices', () => {
    expect(tileColor(0, palette)).toBe(tileColor(5, palette));
    expect(tileColor(1, palette)).toBe(tileColor(6, palette));
    expect(tileColor(2, palette)).toBe(tileColor(7, palette));
  });

  it('uses fallback when palette has < 5 entries', () => {
    const c = tileColor(0, ['#X']);
    expect(c).toBe('#1565C0');
  });

  it('first 5 indices map to first 5 palette entries', () => {
    expect(tileColor(0, palette)).toBe('#A');
    expect(tileColor(1, palette)).toBe('#B');
    expect(tileColor(2, palette)).toBe('#C');
    expect(tileColor(3, palette)).toBe('#D');
    expect(tileColor(4, palette)).toBe('#E');
  });
});
