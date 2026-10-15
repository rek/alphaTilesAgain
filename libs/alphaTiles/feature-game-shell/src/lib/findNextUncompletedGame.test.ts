import { findNextUncompletedGame } from './findNextUncompletedGame';
import type { Door } from '@alphaTiles/data-doors';
import type { ProgressEntry } from '@alphaTiles/data-progress';

// Progress-key format is the Door catalogue's concern (tested in data-doors);
// a stub key proves the search reads Door.progressKey, not its own copy.
function door(index: number, country: string, classKey: string, enabled = true): Door {
  return {
    index,
    classKey,
    country,
    challengeLevel: 1,
    displayLevel: 1,
    variant: 'T',
    stage: 1,
    colorHex: '#000000',
    name: undefined,
    instructionAudio: undefined,
    tracksProgress: true,
    enabled,
    progressKey: (playerId) => `${classKey}:${playerId}`,
  };
}

function mastered(): ProgressEntry {
  return { points: 0, trackerCount: 12, checked12Trackers: true, lastPlayed: 0 };
}

const DOORS = [
  door(1, 'Thailand', 'thailand'),
  door(2, 'Taiwan', 'taiwan'),
  door(3, 'UnitedStates', 'united-states'),
  door(4, 'Georgia', 'georgia'),
];

describe('findNextUncompletedGame', () => {
  it('returns the next unmastered door in file order', () => {
    expect(findNextUncompletedGame(DOORS, 1, {}, 'p1')?.index).toBe(2);
  });

  it('skips mastered doors (by Door.progressKey)', () => {
    const next = findNextUncompletedGame(DOORS, 1, { 'taiwan:p1': mastered() }, 'p1');
    expect(next?.index).toBe(3);
    expect(next?.classKey).toBe('united-states');
  });

  it('only counts the given player', () => {
    expect(findNextUncompletedGame(DOORS, 1, { 'taiwan:p2': mastered() }, 'p1')?.index).toBe(2);
  });

  it('wraps around to door 1 from the last door', () => {
    expect(findNextUncompletedGame(DOORS, 4, {}, 'p1')?.index).toBe(1);
  });

  it('returns null when every door is mastered', () => {
    const all = Object.fromEntries(DOORS.map((d) => [d.progressKey('p1'), mastered()]));
    expect(findNextUncompletedGame(DOORS, 2, all, 'p1')).toBeNull();
  });

  it('never enters a hidden door (Taiwan disabled)', () => {
    const doors = [
      door(1, 'Thailand', 'thailand'),
      door(2, 'Taiwan', 'taiwan', false),
      door(3, 'Taiwan', 'taiwan', false),
      door(4, 'Georgia', 'georgia'),
    ];
    expect(findNextUncompletedGame(doors, 1, {}, 'p1')?.index).toBe(4);
    expect(findNextUncompletedGame(doors, 4, { 'thailand:p1': mastered() }, 'p1')?.index).toBe(4);
  });

  it('returns null when only hidden doors are left', () => {
    const doors = [door(1, 'Thailand', 'thailand'), door(2, 'Taiwan', 'taiwan', false)];
    expect(findNextUncompletedGame(doors, 2, { 'thailand:p1': mastered() }, 'p1')).toBeNull();
  });
});
