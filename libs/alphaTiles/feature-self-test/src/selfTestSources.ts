import type { Door } from '@alphaTiles/data-doors';

/**
 * Doors whose questions feed the self-test (design D1): the enabled Thailand
 * doors, in the order given. Empty → the pack has no self-test (the menu hides
 * its entry).
 */
export function selfTestSources<D extends Pick<Door, 'enabled' | 'classKey'>>(doors: D[]) {
  return doors.filter((door) => door.enabled && door.classKey === 'thailand');
}
