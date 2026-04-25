import { DIRECTIONS, MAX_DIRECTIONS_BY_CL } from './directions';
import type { ChallengeLevel } from './directions';

// Pure roll of a direction index given a challenge level + RNG.
// Mirrors Java: `wordD = rand.nextInt((maxDirections - min) + 1) + min` (min=0).
// Returns the full [keypadCode, dx, dy] tuple.
export function rollDirection({
  level,
  rng,
}: {
  level: ChallengeLevel;
  rng: () => number;
}): readonly [number, number, number] {
  const max = MAX_DIRECTIONS_BY_CL[level];
  const i = Math.floor(rng() * (max + 1));
  return DIRECTIONS[i];
}
