/**
 * What the shell does when a correct answer checks the 12th tracker.
 *
 * Java Start.java:131-136 reads `settingsList.find("After 12 checked trackers")`
 * (blank → 3); GameActivity.java:316-412 acts on it:
 *   1 → nothing happens; keep playing (options row stays clickable).
 *   2 → return to Earth (menu) after correctSoundDuration.
 *   3 → celebration screen, then the next game without 12 checked trackers.
 * Any other number matches none of Java's branches, i.e. keep playing.
 * Non-numeric values crash Java (Integer.valueOf); we fall back to the default 3.
 */
export function resolveMasteryAction({
  settings,
}: {
  settings: { findInt: (label: string, defaultValue: number) => number };
}) {
  const mode = settings.findInt('After 12 checked trackers', 3);
  if (mode === 2) return 'return-to-menu' as const;
  if (mode === 3) return 'celebrate-then-next-game' as const;
  return 'keep-playing' as const;
}
