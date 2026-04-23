import { buildTheme } from './buildTheme';

const ENG_PALETTE: readonly string[] = [
  '#9C27B0', '#2196F3', '#F44336', '#4CAF50', '#E91E63',
  '#FFFF00', '#000000', '#006600', '#808080', '#663300',
  '#FF0000', '#A50021', '#0000CC',
];

describe('buildTheme', () => {
  describe('palette', () => {
    it('passes 13-entry palette through as-is', () => {
      const theme = buildTheme(ENG_PALETTE, { primary: 'font-r' });
      expect(theme.palette).toBe(ENG_PALETTE);
      expect(theme.palette.length).toBe(13);
    });

    it('colors.primary equals palette[0]', () => {
      const theme = buildTheme(ENG_PALETTE, { primary: 'font-r' });
      expect(theme.colors.primary).toBe(ENG_PALETTE[0]);
    });

    it('colors.background equals palette[0]', () => {
      const theme = buildTheme(ENG_PALETTE, { primary: 'font-r' });
      expect(theme.colors.background).toBe(ENG_PALETTE[0]);
    });

    it('colors.text is hardcoded black', () => {
      const theme = buildTheme(ENG_PALETTE, { primary: 'font-r' });
      expect(theme.colors.text).toBe('#000000');
    });
  });

  describe('typography', () => {
    it('lg equals { fontSize: 20, lineHeight: 28 }', () => {
      const theme = buildTheme(ENG_PALETTE, { primary: 'font-r' });
      expect(theme.typography.lg).toEqual({ fontSize: 20, lineHeight: 28 });
    });

    it('xs, sm, md, xl, 2xl are present', () => {
      const theme = buildTheme(ENG_PALETTE, { primary: 'font-r' });
      const keys = Object.keys(theme.typography);
      expect(keys).toEqual(expect.arrayContaining(['xs', 'sm', 'md', 'lg', 'xl', '2xl']));
      expect(keys.length).toBe(6);
    });
  });

  describe('spacing', () => {
    it('spacing[4] equals 16', () => {
      const theme = buildTheme(ENG_PALETTE, { primary: 'font-r' });
      expect(theme.spacing[4]).toBe(16);
    });

    it('spacing[0] equals 0', () => {
      const theme = buildTheme(ENG_PALETTE, { primary: 'font-r' });
      expect(theme.spacing[0]).toBe(0);
    });

    it('spacing[16] equals 64', () => {
      const theme = buildTheme(ENG_PALETTE, { primary: 'font-r' });
      expect(theme.spacing[16]).toBe(64);
    });
  });

  describe('fontFamily', () => {
    it('uses provided primary font name', () => {
      const theme = buildTheme(ENG_PALETTE, { primary: 'andikanewbasic_r' });
      expect(theme.fontFamily.primary).toBe('andikanewbasic_r');
    });

    it('uses provided primaryBold when present', () => {
      const theme = buildTheme(ENG_PALETTE, {
        primary: 'andikanewbasic_r',
        primaryBold: 'andikanewbasic_b',
      });
      expect(theme.fontFamily.primaryBold).toBe('andikanewbasic_b');
    });

    it('falls back primaryBold to primary when pack omits bold', () => {
      const theme = buildTheme(ENG_PALETTE, { primary: 'andikanewbasic_r' });
      expect(theme.fontFamily.primaryBold).toBe('andikanewbasic_r');
    });
  });
});
