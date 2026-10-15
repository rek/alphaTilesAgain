function first(value: unknown) {
  const v = Array.isArray(value) ? value[0] : value;
  return typeof v === 'string' ? v : undefined;
}

/**
 * The Door named by game-route params. `doorIndex` is authoritative (GAME_PATTERNS
 * "doorIndex is the only authoritative pointer"); `gameNumber` is a legacy alias
 * read only when `doorIndex` is absent. Neither → door 1 (legacy default).
 * Undefined when the index names no row, or names a hidden (`enabled: false`)
 * door — a deep link must not open a game the pack turned off.
 */
export function doorForParams<D extends { enabled: boolean }>(
  doors: readonly D[],
  params: { doorIndex?: unknown; gameNumber?: unknown },
): D | undefined {
  const index = parseInt(first(params.doorIndex) ?? first(params.gameNumber) ?? '1', 10);
  const door = doors[index - 1];
  return door?.enabled ? door : undefined;
}
