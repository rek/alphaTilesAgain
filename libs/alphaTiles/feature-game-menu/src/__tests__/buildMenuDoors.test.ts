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

describe('buildMenuDoors', () => {
  it('drops disabled doors; later doors keep their own row index', () => {
    const result = buildMenuDoors({
      doors: [door(1), door(2, { classKey: 'taiwan', enabled: false }), door(3)],
      trackerCounts: {},
      playerId: null,
    });
    expect(result.map((d) => d.index)).toEqual([1, 3]);
  });

  it('empty catalogue → no doors', () => {
    expect(buildMenuDoors({ doors: [], trackerCounts: {}, playerId: 'p1' })).toEqual([]);
  });

  it("reads the player's tracker count by Door.progressKey", () => {
    const [d] = buildMenuDoors({
      doors: [door(1)],
      trackerCounts: { 'class1:p1': 12, 'class1:p2': 3 },
      playerId: 'p1',
    });
    expect(d.trackerCount).toBe(12);
    expect(d.visual).toBe('mastery');
  });

  it('no player → zero trackers, not started', () => {
    const [d] = buildMenuDoors({ doors: [door(1)], trackerCounts: { 'class1:': 5 }, playerId: null });
    expect(d).toMatchObject({ trackerCount: 0, visual: 'not-started', textColorHex: undefined });
  });

  it('no-tracker doors are in-process with black text', () => {
    const [d] = buildMenuDoors({
      doors: [door(1, { tracksProgress: false })],
      trackerCounts: {},
      playerId: 'p1',
    });
    expect(d.visual).toBe('in-process');
    expect(d.textColorHex).toBe('#000000');
  });
});
