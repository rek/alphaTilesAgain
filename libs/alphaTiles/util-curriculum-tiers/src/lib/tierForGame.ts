import { TIER_BY_CLASS_KEY } from './TIER_BY_CLASS_KEY';

/** Mid-ladder default for a class with no entry, so a new class never crashes or hides. */
const DEFAULT_TIER = 3;

/** Curriculum tier (0–6) of a game class; unmapped `classKey` → 3. */
export function tierForGame(classKey: string) {
  return TIER_BY_CLASS_KEY[classKey] ?? DEFAULT_TIER;
}
