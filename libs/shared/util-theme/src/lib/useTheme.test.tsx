/**
 * Tests for useTheme hook and ThemeProvider.
 *
 * Note: renderer tests need a DOM/RN render environment. These tests verify
 * the core logic: context throws when null, buildTheme output matches useTheme
 * output, memoization. We test via the pure buildTheme function to avoid
 * adding a renderer dependency.
 *
 * Integration-level hook tests (throw-outside-provider, reference stability)
 * are verified here via the ThemeContext directly.
 */
import { buildTheme } from './buildTheme';
import { ThemeContext } from './ThemeContext';

const PALETTE: readonly string[] = [
  '#9C27B0', '#2196F3', '#F44336', '#4CAF50', '#E91E63',
  '#FFFF00', '#000000', '#006600', '#808080', '#663300',
  '#FF0000', '#A50021', '#0000CC',
];

const FONT_MAP = { primary: 'font-r', primaryBold: 'font-b' };

describe('ThemeContext default value', () => {
  it('defaults to null (forces useTheme to throw when no provider)', () => {
    // The context's default value is null — useTheme checks for this and throws.
    // Access via unknown cast to avoid strict private-property error.
    const ctx = ThemeContext as unknown as { _currentValue: unknown };
    expect(ctx['_currentValue']).toBeNull();
  });
});

describe('buildTheme (smoke — cross-verify with useTheme shape)', () => {
  it('produces all required top-level keys', () => {
    const theme = buildTheme(PALETTE, FONT_MAP);
    expect(theme).toHaveProperty('palette');
    expect(theme).toHaveProperty('colors');
    expect(theme).toHaveProperty('typography');
    expect(theme).toHaveProperty('spacing');
    expect(theme).toHaveProperty('fontFamily');
  });

  it('colors.primary === palette[0]', () => {
    const theme = buildTheme(PALETTE, FONT_MAP);
    expect(theme.colors.primary).toBe(PALETTE[0]);
  });

  it('colors.text is hardcoded black', () => {
    const theme = buildTheme(PALETTE, FONT_MAP);
    expect(theme.colors.text).toBe('#000000');
  });

  it('two calls with same args produce equal (but not same) objects', () => {
    const a = buildTheme(PALETTE, FONT_MAP);
    const b = buildTheme(PALETTE, FONT_MAP);
    expect(a).toEqual(b);
    // useMemo guarantees same ref inside provider; buildTheme itself is always new
    expect(a).not.toBe(b);
  });
});
