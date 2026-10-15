/**
 * Curriculum tier (0–6) of each game class, keyed by `classKey`. Issue #13's
 * ladder: 0 passive exposure → 1 symbol scan → 2 cross-modal match →
 * 3 whole-word recognition → 4 construction → 5 decoding/analysis →
 * 6 spatial puzzle. Engine-owned: every pack gets the same ladder.
 *
 * New game class ⇒ add one entry here (GAME_PATTERNS "Difficulty ladder");
 * tools/curriculumTiers.test.ts fails when a registered class has none.
 */
export const TIER_BY_CLASS_KEY: Readonly<Record<string, number>> = {
  sudan: 0,
  iraq: 0,
  malaysia: 0,
  romania: 1,
  thailand: 2,
  georgia: 2,
  peru: 3,
  ecuador: 3,
  mexico: 3,
  brazil: 4,
  colombia: 4,
  'united-states': 4,
  italy: 4,
  // Not in #13's table (added after it): stroke-order tracing = producing a
  // character, i.e. construction. design.md D1.
  taiwan: 4,
  chile: 5,
  japan: 5,
  myanmar: 6,
  china: 6,
};

