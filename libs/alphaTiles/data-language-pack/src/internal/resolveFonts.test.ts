import { resolveFonts } from './resolveFonts';

describe('resolveFonts', () => {
  it('returns primary font handle', () => {
    const result = resolveFonts({ primary: 500 });
    expect(result.primary).toBe(500);
    expect(result.primaryBold).toBeUndefined();
  });

  it('returns primaryBold when present', () => {
    const result = resolveFonts({ primary: 500, primaryBold: 501 });
    expect(result.primaryBold).toBe(501);
  });

  it('returns empty fonts when pack has no custom font (system font)', () => {
    expect(resolveFonts({ primary: null, primaryBold: null })).toEqual({});
    expect(resolveFonts({})).toEqual({});
  });
});
