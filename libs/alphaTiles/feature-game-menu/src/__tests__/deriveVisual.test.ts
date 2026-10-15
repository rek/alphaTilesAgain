import { deriveVisual } from '../deriveVisual';

describe('deriveVisual', () => {
  it('tracksProgress=false, trackerCount=0 → in-process', () => {
    expect(deriveVisual({ tracksProgress: false, trackerCount: 0 })).toBe('in-process');
  });

  it('tracksProgress=true, trackerCount=0 → not-started', () => {
    expect(deriveVisual({ tracksProgress: true, trackerCount: 0 })).toBe('not-started');
  });

  it('tracksProgress=true, trackerCount=5 → in-process', () => {
    expect(deriveVisual({ tracksProgress: true, trackerCount: 5 })).toBe('in-process');
  });

  it('tracksProgress=true, trackerCount=12 → mastery', () => {
    expect(deriveVisual({ tracksProgress: true, trackerCount: 12 })).toBe('mastery');
  });

  it('tracksProgress=true, trackerCount=13 → mastery', () => {
    expect(deriveVisual({ tracksProgress: true, trackerCount: 13 })).toBe('mastery');
  });

  it('tracksProgress=false, trackerCount=12 → in-process (no-tracker overrides)', () => {
    expect(deriveVisual({ tracksProgress: false, trackerCount: 12 })).toBe('in-process');
  });
});
