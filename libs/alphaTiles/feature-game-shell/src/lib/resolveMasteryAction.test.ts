import { resolveMasteryAction } from './resolveMasteryAction';

/** Minimal stand-in for parseSettings().findInt keyed by the human label. */
function settingsWith(entries: Record<string, string>) {
  return {
    findInt: (label: string, defaultValue: number) => {
      const raw = entries[label];
      if (raw === undefined || raw === '') return defaultValue;
      const n = parseInt(raw, 10);
      return isNaN(n) ? defaultValue : n;
    },
  };
}

describe('resolveMasteryAction', () => {
  it.each([
    ['1', 'keep-playing'],
    ['2', 'return-to-menu'],
    ['3', 'celebrate-then-next-game'],
    ['4', 'keep-playing'],
    ['', 'celebrate-then-next-game'],
    ['abc', 'celebrate-then-next-game'],
  ])('"After 12 checked trackers" = %p → %s (Java GameActivity semantics)', (value, expected) => {
    expect(
      resolveMasteryAction({ settings: settingsWith({ 'After 12 checked trackers': value }) }),
    ).toBe(expected);
  });

  it('missing setting defaults to 3 (Java Start.java:135)', () => {
    expect(resolveMasteryAction({ settings: settingsWith({}) })).toBe('celebrate-then-next-game');
  });

  it('ignores the old camelCase key that never matched a pack (H2)', () => {
    expect(
      resolveMasteryAction({ settings: settingsWith({ after12checkedTrackers: '1' }) }),
    ).toBe('celebrate-then-next-game');
  });
});
