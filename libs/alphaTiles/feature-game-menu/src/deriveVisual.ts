type Door = { noRightWrong: boolean; trackerCount: number };
type DoorVisual = 'not-started' | 'in-process' | 'mastery';

export function deriveVisual(door: Door): DoorVisual {
  if (door.noRightWrong) return 'in-process';
  if (door.trackerCount >= 12) return 'mastery';
  if (door.trackerCount > 0) return 'in-process';
  return 'not-started';
}
