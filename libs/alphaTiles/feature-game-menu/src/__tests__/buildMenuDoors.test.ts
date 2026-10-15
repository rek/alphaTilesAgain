import * as fs from 'fs';
import * as path from 'path';
import { parseColors, parseGames, parseSettings } from '@shared/util-lang-pack-parser';
import { doorsOf } from '@alphaTiles/data-doors';
import type { Door } from '@alphaTiles/data-doors';
import { buildMenuDoors } from '../buildMenuDoors';
import { doorHref } from '../doorHref';

function door(index: number, overrides: Partial<Door> = {}): Door {
  const classKey = overrides.classKey ?? `class${index}`;
  return {
    index,
    classKey,
    country: classKey,
    challengeLevel: 1,
    displayLevel: 1,
    tier: 2,
    variant: 'T',
    stage: 1,
    colorHex: '#FF0000',
    name: undefined,
    instructionAudio: undefined,
    tracksProgress: true,
    enabled: true,
    progressKey: (playerId) => `${classKey}:${playerId}`,
    ...overrides,
  };
}

const notStarted = () => ({ trackerCount: 0, visual: 'not-started' as const });

describe('buildMenuDoors', () => {
  it('drops disabled doors; later doors keep their own row index', () => {
    const result = buildMenuDoors({
      doors: [door(1), door(2, { classKey: 'taiwan', enabled: false }), door(3)],
      progressOf: notStarted,
    });
    expect(result.map((d) => d.index)).toEqual([1, 3]);
  });

  it('empty catalogue → no doors', () => {
    expect(buildMenuDoors({ doors: [], progressOf: notStarted })).toEqual([]);
  });

  it("carries each door's progress (tracker count + visual)", () => {
    const result = buildMenuDoors({
      doors: [door(1), door(2)],
      progressOf: (d) =>
        d.index === 1 ? { trackerCount: 12, visual: 'mastery' } : { trackerCount: 3, visual: 'in-process' },
    });
    expect(result.map((d) => [d.index, d.trackerCount, d.visual])).toEqual([
      [1, 12, 'mastery'],
      [2, 3, 'in-process'],
    ]);
    expect(result[0].textColorHex).toBeUndefined();
  });

  it('no-tracker doors get black text', () => {
    const [d] = buildMenuDoors({
      doors: [door(1, { tracksProgress: false })],
      progressOf: () => ({ trackerCount: 0, visual: 'in-process' }),
    });
    expect(d.textColorHex).toBe('#000000');
  });

  it('groups by tier ascending; same tier keeps file order; index unchanged', () => {
    const result = buildMenuDoors({
      doors: [door(1, { tier: 4 }), door(2, { tier: 2 }), door(3, { tier: 0 }), door(4, { tier: 2 })],
      progressOf: notStarted,
    });
    expect(result.map((d) => [d.index, d.tier])).toEqual([
      [3, 0],
      [2, 2],
      [4, 2],
      [1, 4],
    ]);
  });

  it('press after reordering: grid-first door 7 routes doorIndex "7", not its position', () => {
    const doors = [1, 2, 3, 4, 5, 6].map((i) => door(i, { tier: 3 })).concat(door(7, { tier: 0 }));
    const [first] = buildMenuDoors({ doors, progressOf: notStarted });
    expect(first.index).toBe(7);
    expect(doorHref(first).params).toEqual({ classKey: 'class7', doorIndex: '7', challengeLevel: '1' });
  });
});

describe('buildMenuDoors — real yue pack (tier order ≠ file order)', () => {
  const YUE = path.resolve(__dirname, '../../../../../languages/yue');
  const read = (f: string) => fs.readFileSync(path.join(YUE, f), 'utf8');
  const doors = doorsOf({
    games: parseGames(read('aa_games.txt')),
    colors: parseColors(read('aa_colors.txt')),
    settings: parseSettings(read('aa_settings.txt')),
    strokes: { 一: { character: '一', strokes: [], medians: [] } },
    audio: { instructions: {} },
  });
  const menu = buildMenuDoors({ doors, progressOf: notStarted });

  it('opens with the tier-0 browsers, ends with tier-4 construction', () => {
    expect(menu.slice(0, 3).map((d) => d.classKey)).toEqual(['malaysia', 'sudan', 'iraq']);
    expect(menu[menu.length - 1].classKey).toBe('italy');
    expect(menu.map((d) => d.tier)).toEqual([...menu.map((d) => d.tier)].sort((a, b) => a - b));
  });

  it('every pressed door resolves (rows[doorIndex - 1]) to the game it shows', () => {
    menu.forEach((shown, position) => {
      const { doorIndex, classKey, challengeLevel } = doorHref(shown).params;
      const routed = doors[parseInt(doorIndex, 10) - 1];
      expect(routed.classKey).toBe(classKey);
      expect(String(routed.challengeLevel)).toBe(challengeLevel);
      expect(routed.variant).toBe(shown.variant);
      if (position === 0) expect(doorIndex).toBe('26'); // Malaysia: grid-first, row 26
    });
  });
});
