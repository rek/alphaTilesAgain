import { buildNextGameHref } from './buildNextGameHref';
import type { NextGameResult } from './findNextUncompletedGame';

const result: NextGameResult = {
  gameNumber: 3,
  country: 'UnitedStates',
  classKey: 'united-states',
  challengeLevel: 1,
  syllableGame: '',
  stage: 1,
};

describe('buildNextGameHref', () => {
  it('returns /menu when no more games remain', () => {
    expect(buildNextGameHref(null)).toBe('/menu');
  });

  it('targets /games/[classKey] with kebab classKey + stringified params', () => {
    expect(buildNextGameHref(result)).toEqual({
      pathname: '/games/[classKey]',
      params: {
        classKey: 'united-states',
        doorIndex: '3',
        challengeLevel: '1',
      },
    });
  });

  // Regression for the original 404 — the bug was `pathname: '/game'` (no `s`,
  // no `[classKey]`). Pin the exact pathname literal so a future typo here
  // breaks the test, not after-12-trackers in production.
  it('uses pathname `/games/[classKey]` (NOT `/game`)', () => {
    const href = buildNextGameHref(result);
    expect(typeof href).toBe('object');
    if (typeof href === 'object') {
      expect(href.pathname).toBe('/games/[classKey]');
    }
  });

  // Regression for the multi-word country drift: country.toLowerCase()
  // produced 'unitedstates'; the parser now derives 'united-states' and
  // buildNextGameHref must pass it through verbatim.
  it('passes the row-derived kebab classKey through verbatim', () => {
    const href = buildNextGameHref(result);
    if (typeof href === 'object') {
      expect(href.params.classKey).toBe('united-states');
      expect(href.params.classKey).not.toBe('unitedstates');
    }
  });
});
