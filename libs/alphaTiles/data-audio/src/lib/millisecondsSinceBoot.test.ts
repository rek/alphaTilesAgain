import { millisecondsSinceBoot } from './millisecondsSinceBoot';

describe('millisecondsSinceBoot', () => {
  it('returns rounded performance.now()', () => {
    const spy = jest.spyOn(performance, 'now').mockReturnValue(1234.6);
    expect(millisecondsSinceBoot()).toBe(1235);
    spy.mockRestore();
  });

  it('is not an epoch timestamp', () => {
    expect(millisecondsSinceBoot()).toBeLessThan(Date.now() / 1000);
  });
});
