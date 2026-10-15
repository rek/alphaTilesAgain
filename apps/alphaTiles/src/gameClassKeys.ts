/**
 * Every game class this app can play — the kebab `classKey` of an
 * `aa_games.txt` Country (e.g. `UnitedStates` → `united-states`).
 *
 * Plain data (no RN imports) so build tools can check a pack against it:
 * `tools/assertGameClassesForGames.ts` fails prebuild when a pack names a class
 * missing here. `gameClasses.ts` is typed `Record<GameClassKey, …>`, so adding a
 * key without its registry entry (or vice versa) is a compile error.
 */
export const gameClassKeys = [
  'brazil',
  'chile',
  'china',
  'colombia',
  'ecuador',
  'georgia',
  'iraq',
  'italy',
  'japan',
  'malaysia',
  'mexico',
  'myanmar',
  'peru',
  'romania',
  'sudan',
  'taiwan',
  'thailand',
  'united-states',
] as const;

export type GameClassKey = (typeof gameClassKeys)[number];
