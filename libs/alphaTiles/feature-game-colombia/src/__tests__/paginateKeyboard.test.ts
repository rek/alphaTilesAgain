import {
  KEYS_PER_PAGE_BODY, TILES_PER_PAGE,
  paginateKeyboard, computeKeyIndex, visibleSlotsOnPage,
} from '../paginateKeyboard';

describe('paginateKeyboard', () => {
  it('exposes Java literals 33 and 35', () => {
    expect(KEYS_PER_PAGE_BODY).toBe(33);
    expect(TILES_PER_PAGE).toBe(35);
  });

  it('returns single screen when paginated=false', () => {
    expect(paginateKeyboard(20, false)).toEqual({
      paginated: false, totalScreens: 1, partial: 0,
    });
  });

  it('70 keys → 3 screens with partial 4', () => {
    const r = paginateKeyboard(70, true);
    expect(r.totalScreens).toBe(3);
    expect(r.partial).toBe(4);
  });

  it('66 keys (exactly 33*2) → 2 screens, partial 0', () => {
    const r = paginateKeyboard(66, true);
    expect(r.totalScreens).toBe(2);
    expect(r.partial).toBe(0);
  });

  it('computeKeyIndex uses 33 stride per page (Java parity quirk)', () => {
    expect(computeKeyIndex(1, 0)).toBe(0);
    expect(computeKeyIndex(1, 32)).toBe(32);
    expect(computeKeyIndex(2, 0)).toBe(33);
    expect(computeKeyIndex(3, 5)).toBe(71);
  });

  it('visibleSlotsOnPage: full page = 33 unless last page partial', () => {
    expect(visibleSlotsOnPage({ page: 1, totalScreens: 3, partial: 4 })).toBe(33);
    expect(visibleSlotsOnPage({ page: 2, totalScreens: 3, partial: 4 })).toBe(33);
    expect(visibleSlotsOnPage({ page: 3, totalScreens: 3, partial: 4 })).toBe(4);
    expect(visibleSlotsOnPage({ page: 2, totalScreens: 2, partial: 0 })).toBe(33);
  });
});
