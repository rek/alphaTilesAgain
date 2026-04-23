export function isGameMastered(
  trackerCount: number,
  checked12Trackers: boolean,
  after12CheckedTrackers: 1 | 2 | 3,
): boolean {
  if (checked12Trackers) return true;
  return trackerCount >= 12 && (after12CheckedTrackers === 2 || after12CheckedTrackers === 3);
}
