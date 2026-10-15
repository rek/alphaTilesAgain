/**
 * Door progress through its interface, against the REAL yue pack's Doors and
 * the real progress store (in-memory AsyncStorage).
 */
import * as fs from 'fs';
import * as path from 'path';
import { parseColors, parseGames, parseSettings } from '@shared/util-lang-pack-parser';
import { doorsOf } from '@alphaTiles/data-doors';
import type { Door, DoorPack } from '@alphaTiles/data-doors';
import { useProgressStore } from '@alphaTiles/data-progress';
import { effectiveSettingsOf } from '@alphaTiles/data-settings';
import { doorProgressOf } from './doorProgressOf';
import { nextUnmasteredDoor } from './nextUnmasteredDoor';
import { recordCorrectAnswer } from './recordCorrectAnswer';

const YUE = path.resolve(__dirname, '../../../../languages/yue');

function stems(dir: string) {
  return fs.existsSync(dir) ? fs.readdirSync(dir).map((f) => f.replace(/\.[^.]+$/, '')) : [];
}

function loadYue(): DoorPack {
  const read = (f: string) => fs.readFileSync(path.join(YUE, f), 'utf8');
  return {
    games: parseGames(read('aa_games.txt')),
    colors: parseColors(read('aa_colors.txt')),
    settings: parseSettings(read('aa_settings.txt')),
    strokes: Object.fromEntries(
      stems(path.join(YUE, 'strokes')).map((ch) => [ch, { character: ch, strokes: [], medians: [] }]),
    ),
    audio: { instructions: Object.fromEntries(stems(path.join(YUE, 'audio/instructions')).map((k, i) => [k, i + 1])) },
  };
}

const pack = loadYue();
const doors = doorsOf(pack);
const yueMode = effectiveSettingsOf({ settings: pack.settings }).afterTwelveCheckedTrackers;
const tracked = doors.find((d) => d.classKey === 'thailand') as Door;
const noRightWrong = doors.find((d) => d.classKey === 'malaysia') as Door;

const progressOf = (door: Door, playerId: string | null = 'p1') =>
  doorProgressOf({ door, playerId, progress: useProgressStore.getState().progress });

/** Records `n` correct answers; returns each answer's mastery action. */
function answer(door: Door, n: number, mode = yueMode, playerId = 'p1') {
  return Array.from({ length: n }, () =>
    recordCorrectAnswer({ door, playerId, afterTwelveCheckedTrackers: mode }),
  );
}

beforeEach(() => useProgressStore.setState({ progress: {} }));

describe('doorProgressOf', () => {
  it('untouched door: not started, nothing checked', () => {
    expect(progressOf(tracked)).toMatchObject({
      points: 0,
      trackerCount: 0,
      mastered: false,
      visual: 'not-started',
      trackers: Array(12).fill(false),
    });
  });

  it('11 correct: in process, 11 trackers checked', () => {
    answer(tracked, 11);
    const p = progressOf(tracked);
    expect(p).toMatchObject({ points: 11, trackerCount: 11, mastered: false, visual: 'in-process' });
    expect(p.trackers.filter(Boolean)).toHaveLength(11);
  });

  it('12th correct masters the door; bar stays full past 12 (Java t < trackerCount)', () => {
    answer(tracked, 12);
    expect(progressOf(tracked)).toMatchObject({ mastered: true, visual: 'mastery', trackers: Array(12).fill(true) });
    answer(tracked, 1);
    expect(progressOf(tracked)).toMatchObject({ trackerCount: 13, mastered: true, trackers: Array(12).fill(true) });
  });

  it('mastery does not depend on "After 12 checked trackers" (mode 1 masters too)', () => {
    answer(tracked, 12, 1);
    expect(progressOf(tracked).mastered).toBe(true);
  });

  it('no-right/wrong door: points only, never mastered, always in process', () => {
    answer(noRightWrong, 20);
    expect(progressOf(noRightWrong)).toMatchObject({
      points: 20,
      trackerCount: 0,
      mastered: false,
      visual: 'in-process',
    });
  });

  it('keyed by Door.progressKey: players do not leak ("p1" vs "p10")', () => {
    answer(tracked, 12, yueMode, 'p10');
    expect(progressOf(tracked, 'p1')).toMatchObject({ trackerCount: 0, mastered: false });
    expect(progressOf(tracked, 'p10').mastered).toBe(true);
  });

  it('no player → empty progress', () => {
    answer(tracked, 12);
    expect(progressOf(tracked, null)).toMatchObject({ trackerCount: 0, visual: 'not-started' });
  });
});

describe('recordCorrectAnswer → mastery action', () => {
  it('yue ("After 12 checked trackers" = 1): keep playing at the 12th tracker', () => {
    expect(yueMode).toBe(1);
    const actions = answer(tracked, 12);
    expect(actions.slice(0, 11).every((a) => a === null)).toBe(true);
    expect(actions[11]).toBe('keep-playing');
  });

  it.each([
    [2, 'return-to-menu'],
    [3, 'celebrate-then-next-door'],
    [4, 'keep-playing'],
  ])('mode %p → %s, again every 12 more', (mode, action) => {
    const actions = answer(tracked, 24, mode);
    expect(actions[11]).toBe(action);
    expect(actions[23]).toBe(action);
    expect(actions.filter((a) => a !== null)).toHaveLength(2);
  });

  it('pack mode via effective settings: blank → 3', () => {
    const mode = effectiveSettingsOf({ settings: parseSettings('Setting\tValue\n') }).afterTwelveCheckedTrackers;
    expect(answer(tracked, 12, mode)[11]).toBe('celebrate-then-next-door');
  });

  it('no-right/wrong door never triggers mastery', () => {
    expect(answer(noRightWrong, 24, 3).every((a) => a === null)).toBe(true);
  });

  it('points argument adds that many points, still one tracker', () => {
    recordCorrectAnswer({ door: tracked, playerId: 'p1', points: 4, afterTwelveCheckedTrackers: 3 });
    expect(progressOf(tracked)).toMatchObject({ points: 4, trackerCount: 1 });
  });
});

describe('nextUnmasteredDoor (yue)', () => {
  const next = (from: Door, order = doors, playerId = 'p1') =>
    nextUnmasteredDoor({ order, from, playerId, progress: useProgressStore.getState().progress })?.index;

  it('next door in file order, skipping mastered ones', () => {
    expect(next(doors[0])).toBe(2);
    answer(doors[1], 12);
    expect(next(doors[0])).toBe(3);
  });

  it('wraps from the last door to door 1', () => {
    expect(next(doors[doors.length - 1])).toBe(1);
  });

  it('no-right/wrong doors are never mastered, so stay candidates', () => {
    const before = doors[doors.indexOf(noRightWrong) - 1];
    answer(noRightWrong, 24);
    expect(next(before)).toBe(noRightWrong.index);
  });

  it('never enters a hidden door (Taiwan with "Enable stroke order game" FALSE)', () => {
    const hidden = doorsOf({ ...pack, settings: parseSettings('Setting\tValue\nEnable stroke order game\tFALSE') });
    expect(hidden.slice(5, 8).map((d) => d.enabled)).toEqual([false, false, false]);
    expect(next(hidden[4], hidden)).toBe(9);
  });

  it('follows the given play order (ladder), matching doors by index', () => {
    const reversed = [...doors].reverse();
    expect(next(doors[4], reversed)).toBe(4);
  });

  it('null when every enabled door in the order is mastered', () => {
    const trackedDoors = doors.filter((d) => d.tracksProgress);
    trackedDoors.forEach((d) => answer(d, 12));
    expect(next(trackedDoors[0], trackedDoors)).toBeUndefined();
  });

  it('only counts the given player', () => {
    answer(doors[1], 12, yueMode, 'p2');
    expect(next(doors[0])).toBe(2);
  });
});
