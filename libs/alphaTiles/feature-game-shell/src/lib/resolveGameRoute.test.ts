import { resolveGameRoute } from './resolveGameRoute';

const doors = [
  { index: 1, classKey: 'thailand' },
  { index: 2, classKey: 'china' },
  { index: 3, classKey: 'china' },
  { index: 4, classKey: 'atlantis' },
];
const classKeys = ['thailand', 'china'] as const;

describe('resolveGameRoute', () => {
  it('routed door is authoritative over the URL class', () => {
    expect(
      resolveGameRoute({ urlClassKey: 'china', hasDoorParam: true, routedDoor: doors[0], doors, classKeys }),
    ).toEqual({ kind: 'play', classKey: 'thailand', doorIndex: 1 });
  });

  it('unknown doorIndex still mounts the URL class (shell bounces to menu)', () => {
    expect(
      resolveGameRoute({ urlClassKey: 'china', hasDoorParam: true, routedDoor: undefined, doors, classKeys }),
    ).toEqual({ kind: 'play', classKey: 'china', doorIndex: undefined });
  });

  it('no door param → first door of the URL class', () => {
    expect(
      resolveGameRoute({ urlClassKey: 'china', hasDoorParam: false, routedDoor: doors[0], doors, classKeys }),
    ).toEqual({ kind: 'play', classKey: 'china', doorIndex: 2 });
  });

  it('no door param and no door of that class → menu', () => {
    expect(
      resolveGameRoute({ urlClassKey: 'peru', hasDoorParam: false, routedDoor: doors[0], doors, classKeys }),
    ).toEqual({ kind: 'menu' });
  });

  it('class missing from the registry → unavailable', () => {
    expect(
      resolveGameRoute({ urlClassKey: 'x', hasDoorParam: true, routedDoor: doors[3], doors, classKeys }),
    ).toEqual({ kind: 'unavailable', classKey: 'atlantis' });
  });
});
