import { deriveVisual } from '../deriveVisual';

describe('deriveVisual', () => {
  it('noRightWrong=true, trackerCount=0 → in-process', () => {
    expect(deriveVisual({ noRightWrong: true, trackerCount: 0 })).toBe('in-process');
  });

  it('noRightWrong=false, trackerCount=0 → not-started', () => {
    expect(deriveVisual({ noRightWrong: false, trackerCount: 0 })).toBe('not-started');
  });

  it('noRightWrong=false, trackerCount=5 → in-process', () => {
    expect(deriveVisual({ noRightWrong: false, trackerCount: 5 })).toBe('in-process');
  });

  it('noRightWrong=false, trackerCount=12 → mastery', () => {
    expect(deriveVisual({ noRightWrong: false, trackerCount: 12 })).toBe('mastery');
  });

  it('noRightWrong=false, trackerCount=13 → mastery', () => {
    expect(deriveVisual({ noRightWrong: false, trackerCount: 13 })).toBe('mastery');
  });

  it('noRightWrong=true, trackerCount=12 → in-process (noRightWrong overrides)', () => {
    expect(deriveVisual({ noRightWrong: true, trackerCount: 12 })).toBe('in-process');
  });
});
