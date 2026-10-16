import { buildTypography } from './typography';

const BASE = {
  xs: { fontSize: 12, lineHeight: 16 },
  sm: { fontSize: 14, lineHeight: 20 },
  md: { fontSize: 16, lineHeight: 24 },
  lg: { fontSize: 20, lineHeight: 28 },
  xl: { fontSize: 28, lineHeight: 36 },
  '2xl': { fontSize: 40, lineHeight: 48 },
};

describe('buildTypography', () => {
  it('1.0 matches the pre-change frozen ladder', () => {
    expect(buildTypography(1)).toEqual(BASE);
  });

  it.each([1.3, 2])('%s multiplies every slot fontSize + lineHeight', (scale) => {
    const t = buildTypography(scale);
    for (const [slot, base] of Object.entries(BASE)) {
      const s = t[slot as keyof typeof t];
      expect(s.fontSize).toBeCloseTo(base.fontSize * scale);
      expect(s.lineHeight).toBeCloseTo(base.lineHeight * scale);
    }
  });

  it('preserves slot shape: exactly 6 keys, each { fontSize, lineHeight }', () => {
    const t = buildTypography(1.7);
    expect(Object.keys(t).sort()).toEqual(['2xl', 'lg', 'md', 'sm', 'xl', 'xs']);
    for (const s of Object.values(t)) {
      expect(Object.keys(s).sort()).toEqual(['fontSize', 'lineHeight']);
    }
  });
});
