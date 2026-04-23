/**
 * Convert a single camelCase identifier to snake_case.
 *
 * Examples:
 *   camelToSnake('gameDoor')   → 'game_door'
 *   camelToSnake('syllOrTile') → 'syll_or_tile'
 *   camelToSnake('appLang')    → 'app_lang'
 *   camelToSnake('game_door')  → 'game_door'  (already snake — passes through)
 */
export function camelToSnake(key: string): string {
  return key.replace(/([A-Z])/g, (char) => `_${char.toLowerCase()}`);
}
