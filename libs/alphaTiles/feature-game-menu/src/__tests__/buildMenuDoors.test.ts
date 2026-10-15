import { buildMenuDoors } from '../buildMenuDoors';
import type { Door } from '@alphaTiles/data-doors';

function door(index: number, overrides: Partial<Door> = {}): Door {
  const classKey = overrides.classKey ?? `class${index}`;
  return {
    index,
    classKey,
    country: classKey,
    challengeLevel: 1,
    displayLevel: 1,
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
});
