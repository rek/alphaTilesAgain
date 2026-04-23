import { camelToSnake } from './camelToSnake';

/**
 * Convert all top-level camelCase prop keys to snake_case.
 *
 * V2 adapters MUST call this before transmitting props off-device (design.md D7).
 * The no-op default adapter skips this (it transmits nothing).
 *
 * Only top-level keys are transformed — nested objects are not traversed.
 * The `_sampled` key passes through unchanged (already prefixed with `_`).
 *
 * Example:
 *   transformPropsToSnake({ gameDoor: 41, challengeLevel: 2 })
 *   // → { game_door: 41, challenge_level: 2 }
 */
export function transformPropsToSnake(
  props: Record<string, unknown>,
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(props).map(([key, value]) => [camelToSnake(key), value]),
  );
}
