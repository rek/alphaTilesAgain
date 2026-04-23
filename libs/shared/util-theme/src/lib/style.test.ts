import { style } from './style';

describe('style helpers', () => {
  it('marginStart returns correct shape', () => {
    expect(style.marginStart(4)).toEqual({ marginStart: 16 });
  });

  it('marginEnd returns correct shape', () => {
    expect(style.marginEnd(2)).toEqual({ marginEnd: 8 });
  });

  it('paddingStart returns correct shape', () => {
    expect(style.paddingStart(1)).toEqual({ paddingStart: 4 });
  });

  it('paddingEnd returns correct shape', () => {
    expect(style.paddingEnd(8)).toEqual({ paddingEnd: 32 });
  });

  it('marginStart(0) returns 0', () => {
    expect(style.marginStart(0)).toEqual({ marginStart: 0 });
  });

  it('marginEnd(16) returns 64', () => {
    expect(style.marginEnd(16)).toEqual({ marginEnd: 64 });
  });
});
