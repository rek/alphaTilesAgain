import { findNextUncompletedGame } from './findNextUncompletedGame';
import type { ProgressEntry } from '@alphaTiles/data-progress';

function row(
  i: number,
  country: string,
  classKey: string,
  extras: Partial<{ challengeLevel: number; syllOrTile: 'T' | 'S'; stagesIncluded: string }> = {},
) {
  return {
    door: i,
    country,
    classKey,
    challengeLevel: extras.challengeLevel ?? 1,
    syllOrTile: (extras.syllOrTile ?? 'T') as 'T' | 'S',
    stagesIncluded: extras.stagesIncluded ?? '-',
  };
}

function mastered(): ProgressEntry {
  return { points: 0, trackerCount: 12, checked12Trackers: true, lastPlayed: 0 };
}

const GAMES = [
  row(1, 'Thailand', 'thailand'),
  row(2, 'Taiwan', 'taiwan'),
  row(3, 'UnitedStates', 'united-states'),
  row(4, 'Georgia', 'georgia', { syllOrTile: 'S' }),
];

describe('findNextUncompletedGame', () => {
  it('returns the next unmastered game in door order', () => {
    const next = findNextUncompletedGame(GAMES, 1, {}, 'p1');
    expect(next?.gameNumber).toBe(2);
    expect(next?.classKey).toBe('taiwan');
  });

  it('skips mastered games', () => {
    const next = findNextUncompletedGame(
      GAMES,
      1,
      { Taiwan1p11: mastered() },
      'p1',
    );
    expect(next?.gameNumber).toBe(3);
    expect(next?.classKey).toBe('united-states');
  });

  it('wraps around to door 1 from the last door', () => {
    const next = findNextUncompletedGame(GAMES, 4, {}, 'p1');
    expect(next?.gameNumber).toBe(1);
    expect(next?.classKey).toBe('thailand');
  });

  it('returns null when every game is mastered', () => {
    const all: Record<string, ProgressEntry> = {
      Thailand1p11: mastered(),
      Taiwan1p11: mastered(),
      UnitedStates1p11: mastered(),
      Georgia1p1S1: mastered(),
    };
    expect(findNextUncompletedGame(GAMES, 2, all, 'p1')).toBeNull();
  });

  // Regression for the route-drift bug class:
  // If findNextUncompletedGame returned `country.toLowerCase()` instead of the
  // pre-derived `classKey`, the multi-word UnitedStates row would resolve to
  // `unitedstates` and miss the `united-states.tsx` route, falling through to
  // the [classKey] catch-all "Game not yet implemented" placeholder.
  it('preserves multi-word kebab-case classKey from the row', () => {
    const next = findNextUncompletedGame(GAMES, 2, {}, 'p1');
    expect(next?.country).toBe('UnitedStates');
    expect(next?.classKey).toBe('united-states');
    expect(next?.classKey).not.toBe('unitedstates');
  });

  // Multi-stage rows: stage flows into the storage key
  // (buildGameUniqueId pattern: country + cl + playerId + syll + stage).
  // A row with stagesIncluded='2' must read progress at `<country>1p12`,
  // not `<country>1p11`, or stage-2 mastery is invisible to the selector.
  describe('stage handling', () => {
    const STAGED_GAMES = [
      row(1, 'Thailand', 'thailand', { stagesIncluded: '2' }),
      row(2, 'Taiwan', 'taiwan'),
    ];

    it("uses stagesIncluded='2' when building the progress lookup key", () => {
      // Door 1 mastered at stage 2, NOT stage 1 — selector must respect it.
      const next = findNextUncompletedGame(
        STAGED_GAMES,
        2,
        { Thailand1p12: mastered() },
        'p1',
      );
      expect(next?.gameNumber).toBe(2); // wrapped past door 1, since it's done
      expect(next?.classKey).toBe('taiwan');
    });

    it("does NOT consume stage-1 mastery for a stagesIncluded='2' row", () => {
      // Stage-1 entry shouldn't fool a stage-2 selector — it should still
      // see door 1 as not-yet-mastered.
      const next = findNextUncompletedGame(
        STAGED_GAMES,
        2,
        { Thailand1p11: mastered() },
        'p1',
      );
      expect(next?.gameNumber).toBe(1);
      expect(next?.stage).toBe(2);
    });
  });
});
