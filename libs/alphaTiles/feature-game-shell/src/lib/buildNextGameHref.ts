import type { NextGameResult } from './findNextUncompletedGame';

/**
 * Discriminated return of the post-mastery navigation target. Pure shape
 * (no expo-router import) so the route-construction can be unit-tested
 * without mocking the router. The container hands the result straight to
 * `router.push`; expo-router's typed Href accepts either arm.
 *
 * Pinned shape — a future regression like the original `'/game'` typo or
 * `country.toLowerCase()` slug would change one of these fields and the
 * test in buildNextGameHref.test.ts would fail before reaching production.
 */
export type NextGameHref =
  | {
      pathname: '/games/[classKey]';
      params: {
        classKey: string;
        doorIndex: string;
        challengeLevel: string;
      };
    }
  | '/menu';

export function buildNextGameHref(next: NextGameResult | null): NextGameHref {
  if (next === null) return '/menu';
  return {
    pathname: '/games/[classKey]',
    params: {
      classKey: next.classKey,
      doorIndex: String(next.gameNumber),
      challengeLevel: String(next.challengeLevel),
    },
  };
}
