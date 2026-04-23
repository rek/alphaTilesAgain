import { resolveFonts } from './resolveFonts';
import { LangAssetsBindError } from '../LangAssetsBindError';

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

  it('throws LangAssetsBindError (font) when primary is absent', () => {
    expect(() => resolveFonts({ primary: undefined })).toThrow(
      LangAssetsBindError,
    );
    expect(() => resolveFonts({ primary: undefined })).toThrow(/font/);
    expect(() => resolveFonts({ primary: undefined })).toThrow(/primary/);
  });
});
