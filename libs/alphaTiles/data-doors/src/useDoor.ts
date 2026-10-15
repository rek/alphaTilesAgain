import { useDoors } from './useDoors';

function first(value: unknown) {
  const v = Array.isArray(value) ? value[0] : value;
  return typeof v === 'string' ? v : undefined;
}

/**
 * The Door a game route points at. `doorIndex` is the only authoritative route
 * param (GAME_PATTERNS "doorIndex is the only authoritative pointer");
 * `gameNumber` is the legacy alias. Missing param → door 1 (legacy default).
 * Returns undefined when the index names no row.
 */
export function useDoor(params: { doorIndex?: unknown; gameNumber?: unknown; [param: string]: unknown }) {
  const doors = useDoors();
  const index = parseInt(first(params.gameNumber) ?? first(params.doorIndex) ?? '1', 10);
  return doors[index - 1];
}
