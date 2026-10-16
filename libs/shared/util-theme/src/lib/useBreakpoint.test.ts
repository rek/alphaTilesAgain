import { TABLET_MIN_WIDTH, breakpointForWidth } from './breakpoints';
import { useBreakpoint } from './useBreakpoint';

const mockUseWindowDimensions = jest.fn();
jest.mock('react-native', () => ({
  useWindowDimensions: () => mockUseWindowDimensions(),
}));

function atWidth(width: number) {
  mockUseWindowDimensions.mockReturnValue({ width, height: 1000, scale: 1, fontScale: 1 });
  // useBreakpoint only delegates to useWindowDimensions, so it can be called
  // directly here without a renderer.
  return useBreakpoint();
}

describe('breakpoints', () => {
  it('TABLET_MIN_WIDTH is 768', () => {
    expect(TABLET_MIN_WIDTH).toBe(768);
  });

  it.each([
    [320, 'phone'],
    [767, 'phone'],
    [768, 'tablet'],
    [1024, 'tablet'],
    [1920, 'tablet'],
  ])('breakpointForWidth(%i) → %s', (width, expected) => {
    expect(breakpointForWidth(width)).toBe(expected);
  });
});

describe('useBreakpoint', () => {
  it('width < 768 → phone', () => {
    expect(atWidth(390)).toBe('phone');
  });

  it('width === 768 → tablet', () => {
    expect(atWidth(768)).toBe('tablet');
  });

  it('width > 768 → tablet', () => {
    expect(atWidth(1024)).toBe('tablet');
  });

  it('reflects the new width after rotation / resize', () => {
    expect(atWidth(600)).toBe('phone');
    expect(atWidth(960)).toBe('tablet');
  });
});
