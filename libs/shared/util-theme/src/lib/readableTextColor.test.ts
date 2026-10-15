import { readFileSync } from 'fs';
import { join } from 'path';
import { contrastRatio } from './contrastRatio';
import { readableAccentColor } from './readableAccentColor';
import { readableTextColor } from './readableTextColor';

function packColours(pack: string) {
  const file = join(__dirname, '../../../../../languages', pack, 'aa_colors.txt');
  return readFileSync(file, 'utf8').match(/#[0-9a-f]{6}/gi) ?? [];
}

describe('contrastRatio', () => {
  it('matches WCAG reference values', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 1);
    expect(contrastRatio('#FFFF00', '#FFFFFF')).toBeCloseTo(1.07, 2);
    expect(contrastRatio('#fff', '#ffffff')).toBe(1);
    expect(contrastRatio('nope', '#000')).toBe(1);
  });
});

describe('readableTextColor', () => {
  it('dark text on yellow and green', () => {
    expect(readableTextColor('#FFFF00')).toBe('#000000');
    expect(readableTextColor('#4CAF50')).toBe('#000000');
  });

  it('keeps white on purple / blue / red tiles', () => {
    expect(readableTextColor('#9C27B0')).toBe('#FFFFFF');
    expect(readableTextColor('#2196F3')).toBe('#FFFFFF');
    expect(readableTextColor('#F44336')).toBe('#FFFFFF');
    expect(readableTextColor('#000080')).toBe('#FFFFFF');
  });

  it('accepts 3-digit, 8-digit and missing #', () => {
    expect(readableTextColor('#ff0')).toBe('#000000');
    expect(readableTextColor('000080ff')).toBe('#FFFFFF');
  });

  it('falls back to dark text for junk', () => {
    expect(readableTextColor(undefined)).toBe('#000000');
    expect(readableTextColor('red')).toBe('#000000');
  });

  it.each(['yue', 'eng'])('every %s pack colour reaches AA large text (3:1)', (pack) => {
    const hexes = packColours(pack);
    expect(hexes.length).toBeGreaterThan(0);
    for (const bg of hexes) {
      expect(contrastRatio(bg, readableTextColor(bg))).toBeGreaterThanOrEqual(3);
    }
  });
});

describe('readableAccentColor', () => {
  it('keeps a dark-enough colour, replaces yellow on white', () => {
    expect(readableAccentColor('#9C27B0')).toBe('#9C27B0');
    expect(readableAccentColor('#FFFF00')).toBe('#1F2937');
  });

  it.each(['yue', 'eng'])('every %s pack colour as text on white reaches 3:1', (pack) => {
    for (const c of packColours(pack)) {
      expect(contrastRatio(readableAccentColor(c), '#FFFFFF')).toBeGreaterThanOrEqual(3);
    }
  });
});
