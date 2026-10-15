import { fontNameMapOf } from '../fontNameMapOf';

describe('fontNameMapOf', () => {
  it('names the families the pack ships', () => {
    expect(fontNameMapOf({ fonts: { primary: 1, primaryBold: null }, failed: false })).toEqual({
      primary: 'primary',
      primaryBold: undefined,
    });
  });

  it('pack without fonts → system font', () => {
    expect(fontNameMapOf({ fonts: {}, failed: false })).toEqual({ primary: undefined, primaryBold: undefined });
  });

  it('load error → no family names (system font, no "Unrecognized font family")', () => {
    expect(fontNameMapOf({ fonts: { primary: 1, primaryBold: 2 }, failed: true })).toEqual({});
  });
});
