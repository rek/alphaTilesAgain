import { shouldGateRoute } from '../shouldGateRoute';

describe('shouldGateRoute', () => {
  it('never gates once audio is unlocked', () => {
    expect(shouldGateRoute({ isAudioUnlocked: true, pathname: '/menu' })).toBe(false);
    expect(shouldGateRoute({ isAudioUnlocked: true, pathname: '/' })).toBe(false);
  });

  it('leaves the index route to LoadingContainer (its own tap step)', () => {
    expect(shouldGateRoute({ isAudioUnlocked: false, pathname: '/' })).toBe(false);
    expect(shouldGateRoute({ isAudioUnlocked: false, pathname: '' })).toBe(false);
  });

  it('gates deep links / reloads on any other route while locked', () => {
    expect(shouldGateRoute({ isAudioUnlocked: false, pathname: '/menu' })).toBe(true);
    expect(shouldGateRoute({ isAudioUnlocked: false, pathname: '/games/thailand' })).toBe(true);
    expect(shouldGateRoute({ isAudioUnlocked: false, pathname: '/choose-player' })).toBe(true);
  });
});
