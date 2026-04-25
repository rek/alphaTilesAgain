import { spanBetween } from '../spanBetween';

// 7×7 grid, row-major: idx = y*7 + x
function idx(x: number, y: number): number {
  return y * 7 + x;
}

describe('spanBetween', () => {
  it('horizontal right span', () => {
    const out = spanBetween({ first: idx(0, 0), second: idx(3, 0) });
    expect(out).toEqual([idx(0, 0), idx(1, 0), idx(2, 0), idx(3, 0)]);
  });

  it('horizontal left span (reversed)', () => {
    const out = spanBetween({ first: idx(4, 2), second: idx(1, 2) });
    expect(out).toEqual([idx(4, 2), idx(3, 2), idx(2, 2), idx(1, 2)]);
  });

  it('vertical down span', () => {
    const out = spanBetween({ first: idx(3, 1), second: idx(3, 5) });
    expect(out).toEqual([idx(3, 1), idx(3, 2), idx(3, 3), idx(3, 4), idx(3, 5)]);
  });

  it('45-degree diagonal down-right', () => {
    const out = spanBetween({ first: idx(0, 0), second: idx(3, 3) });
    expect(out).toEqual([idx(0, 0), idx(1, 1), idx(2, 2), idx(3, 3)]);
  });

  it('45-degree diagonal up-left', () => {
    const out = spanBetween({ first: idx(5, 5), second: idx(2, 2) });
    expect(out).toEqual([idx(5, 5), idx(4, 4), idx(3, 3), idx(2, 2)]);
  });

  it('returns null for non-axis spans (knight move)', () => {
    expect(spanBetween({ first: idx(0, 0), second: idx(2, 1) })).toBeNull();
  });

  it('returns null when first === second', () => {
    expect(spanBetween({ first: idx(3, 3), second: idx(3, 3) })).toBeNull();
  });
});
