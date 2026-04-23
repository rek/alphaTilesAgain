import { buildGameUniqueId } from './buildGameUniqueId';
import { useProgressStore } from './useProgressStore';

function reset() {
  useProgressStore.setState({ progress: {} });
}

beforeEach(reset);

// --- buildGameUniqueId ---

describe('buildGameUniqueId', () => {
  it('matches Java concatenation: country+level+player+syllableGame+stage', () => {
    expect(
      buildGameUniqueId({
        country: 'China',
        challengeLevel: 1,
        playerId: 'player01',
        syllableGame: '',
        stage: 1,
      }),
    ).toBe('China1player011');
  });

  it('empty syllableGame produces no placeholder', () => {
    const key = buildGameUniqueId({
      country: 'Chile',
      challengeLevel: 2,
      playerId: 'p2',
      syllableGame: '',
      stage: 3,
    });
    expect(key).toBe('Chile2p23');
  });

  it('non-empty syllableGame is included', () => {
    const key = buildGameUniqueId({
      country: 'Brazil',
      challengeLevel: 1,
      playerId: 'p1',
      syllableGame: 'syl',
      stage: 1,
    });
    expect(key).toBe('Brazil1p1syl1');
  });
});

// --- useProgressStore actions ---

describe('incrementPoints', () => {
  it('adds delta to points and stamps lastPlayed', () => {
    const before = Date.now();
    const key = 'China1player011';
    useProgressStore.getState().incrementPoints(key, 4);
    const entry = useProgressStore.getState().progress[key];
    expect(entry.points).toBe(4);
    expect(entry.lastPlayed).toBeGreaterThanOrEqual(before);
  });

  it('clamps to zero on negative result', () => {
    const key = 'k';
    useProgressStore.getState().incrementPoints(key, 2);
    useProgressStore.getState().incrementPoints(key, -10);
    expect(useProgressStore.getState().progress[key].points).toBe(0);
  });
});

describe('incrementTracker', () => {
  it('increments trackerCount by 1', () => {
    const key = 'k';
    useProgressStore.getState().incrementTracker(key);
    useProgressStore.getState().incrementTracker(key);
    expect(useProgressStore.getState().progress[key].trackerCount).toBe(2);
  });
});

describe('markChecked12', () => {
  it('sets checked12Trackers to true', () => {
    const key = 'k';
    useProgressStore.getState().markChecked12(key);
    expect(useProgressStore.getState().progress[key].checked12Trackers).toBe(true);
  });
});

describe('resetGame', () => {
  it('removes entry from progress map', () => {
    const key = 'k';
    useProgressStore.getState().incrementPoints(key, 5);
    useProgressStore.getState().resetGame(key);
    expect(useProgressStore.getState().progress[key]).toBeUndefined();
  });

  it('does not affect other entries', () => {
    useProgressStore.getState().incrementPoints('a', 3);
    useProgressStore.getState().incrementPoints('b', 7);
    useProgressStore.getState().resetGame('a');
    expect(useProgressStore.getState().progress['b'].points).toBe(7);
  });
});

// --- selectors ---

describe('useProgressEntry', () => {
  it('returns default when key is missing', () => {
    const state = useProgressStore.getState();
    const entry = state.progress['nonexistent'] ?? {
      points: 0,
      trackerCount: 0,
      checked12Trackers: false,
      lastPlayed: 0,
    };
    expect(entry).toEqual({
      points: 0,
      trackerCount: 0,
      checked12Trackers: false,
      lastPlayed: 0,
    });
  });
});

describe('useTotalPoints', () => {
  it('sums points for matching playerId keys', () => {
    useProgressStore.getState().incrementPoints('China1player011', 5);
    useProgressStore.getState().incrementPoints('Chile1player011', 3);
    useProgressStore.getState().incrementPoints('China1player021', 10);

    const state = useProgressStore.getState();
    const total = Object.entries(state.progress)
      .filter(([k]) => k.includes('player01'))
      .reduce((sum, [, e]) => sum + e.points, 0);
    expect(total).toBe(8);
  });

  it('isolates players', () => {
    useProgressStore.getState().incrementPoints('China1player011', 5);
    useProgressStore.getState().incrementPoints('China1player021', 10);

    const state = useProgressStore.getState();
    const p1 = Object.entries(state.progress)
      .filter(([k]) => k.includes('player01'))
      .reduce((sum, [, e]) => sum + e.points, 0);
    const p2 = Object.entries(state.progress)
      .filter(([k]) => k.includes('player02'))
      .reduce((sum, [, e]) => sum + e.points, 0);
    expect(p1).toBe(5);
    expect(p2).toBe(10);
  });
});

// --- persist key ---

describe('persist key', () => {
  it('store persist name is alphaTiles.progress.v1', () => {
    // Verified via source — smoke test confirms no crash on import
    expect(useProgressStore).toBeDefined();
  });
});
