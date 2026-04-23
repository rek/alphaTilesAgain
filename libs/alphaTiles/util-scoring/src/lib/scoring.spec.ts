import { addPoint } from './addPoint';
import { computeTrackerCount } from './computeTrackerCount';
import { displayChallengeLevel } from './displayChallengeLevel';
import { isGameMastered } from './isGameMastered';
import { NO_TRACKER_COUNTRIES, shouldIncrementTracker } from './noTrackerCountries';
import { pointsForStage } from './pointsForStage';

describe('shouldIncrementTracker', () => {
  it('returns false for each no-tracker country', () => {
    for (const country of NO_TRACKER_COUNTRIES) {
      expect(shouldIncrementTracker(country)).toBe(false);
    }
  });

  it('returns true for tracker-capable country', () => {
    expect(shouldIncrementTracker('China')).toBe(true);
  });
});

describe('addPoint', () => {
  it('accumulates', () => expect(addPoint(5, 3)).toBe(8));
  it('clamps at zero', () => expect(addPoint(2, -5)).toBe(0));
  it('allows negative delta that stays positive', () => expect(addPoint(10, -3)).toBe(7));
});

describe('computeTrackerCount', () => {
  it('increments on correct answer for tracker country', () => {
    expect(computeTrackerCount(4, true, 'China')).toBe(5);
  });

  it('unchanged on incorrect answer', () => {
    expect(computeTrackerCount(4, false, 'China')).toBe(4);
  });

  it.each(['Romania', 'Sudan', 'Malaysia', 'Iraq'])(
    'skips increment for %s',
    (country) => {
      expect(computeTrackerCount(3, true, country)).toBe(3);
    },
  );
});

describe('isGameMastered', () => {
  it('true at 12 trackers under mode 3', () => {
    expect(isGameMastered(12, false, 3)).toBe(true);
  });

  it('true at 12 trackers under mode 2', () => {
    expect(isGameMastered(12, false, 2)).toBe(true);
  });

  it('false at 12 trackers under mode 1', () => {
    expect(isGameMastered(12, false, 1)).toBe(false);
  });

  it('true when checked12Trackers is already true regardless of count or mode', () => {
    expect(isGameMastered(0, true, 1)).toBe(true);
    expect(isGameMastered(0, true, 3)).toBe(true);
  });

  it('false below 12 trackers', () => {
    expect(isGameMastered(11, false, 3)).toBe(false);
  });
});

describe('pointsForStage', () => {
  it('returns 1 for correct', () => expect(pointsForStage(3, true)).toBe(1));
  it('returns 0 for incorrect', () => expect(pointsForStage(3, false)).toBe(0));
});

describe('displayChallengeLevel', () => {
  it('Thailand divides by 100 (floor)', () => {
    expect(displayChallengeLevel('Thailand', 213)).toBe(2);
  });

  it('Brazil > 3 subtracts 3', () => {
    expect(displayChallengeLevel('Brazil', 5)).toBe(2);
  });

  it('Brazil === 7 is unchanged (special case)', () => {
    expect(displayChallengeLevel('Brazil', 7)).toBe(7);
  });

  it('Brazil <= 3 is unchanged', () => {
    expect(displayChallengeLevel('Brazil', 3)).toBe(3);
  });

  it('Georgia > 6 subtracts 6', () => {
    expect(displayChallengeLevel('Georgia', 9)).toBe(3);
  });

  it('Georgia <= 6 is unchanged', () => {
    expect(displayChallengeLevel('Georgia', 6)).toBe(6);
  });

  it('China unchanged', () => {
    expect(displayChallengeLevel('China', 1)).toBe(1);
  });
});
