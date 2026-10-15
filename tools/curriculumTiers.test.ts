/**
 * Every registered game class has an explicit curriculum tier. tierForGame's
 * default (3) would otherwise hide a missing entry — and "add a game" means a
 * classKey, a registry entry AND a tier.
 */
import { gameClassKeys } from '../apps/alphaTiles/src/gameClassKeys';
import { TIER_BY_CLASS_KEY } from '../libs/alphaTiles/util-curriculum-tiers/src/lib/TIER_BY_CLASS_KEY';

describe('curriculum tiers vs game-class registry', () => {
  it.each([...gameClassKeys])('%s has an explicit tier', (key) => {
    expect(TIER_BY_CLASS_KEY[key]).toEqual(expect.any(Number));
  });

  it('no tier for a class that is not registered (stale entry)', () => {
    const registered = new Set<string>(gameClassKeys);
    expect(Object.keys(TIER_BY_CLASS_KEY).filter((k) => !registered.has(k))).toEqual([]);
  });
});
