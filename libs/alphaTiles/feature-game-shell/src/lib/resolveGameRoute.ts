import type { Door } from '@alphaTiles/data-doors';

type RouteDoor = Pick<Door, 'index' | 'classKey'>;

/**
 * What `/games/<classKey>?doorIndex=…` renders.
 *
 * - Door param present: the routed Door is authoritative; an unknown index
 *   still mounts the URL's class so the shell can bounce to /menu.
 * - No door param (static web page, bare deep link): the first Door of the
 *   URL's class, its index injected as `doorIndex`; none in this pack → menu.
 * - Class not in the registry → unavailable screen.
 */
export function resolveGameRoute<K extends string>({
  urlClassKey,
  hasDoorParam,
  routedDoor,
  doors,
  classKeys,
}: {
  urlClassKey: string;
  hasDoorParam: boolean;
  routedDoor: RouteDoor | undefined;
  doors: readonly RouteDoor[];
  classKeys: readonly K[];
}):
  | { kind: 'play'; classKey: K; doorIndex: number | undefined }
  | { kind: 'unavailable'; classKey: string }
  | { kind: 'menu' } {
  const door = hasDoorParam ? routedDoor : doors.find((d) => d.classKey === urlClassKey);
  if (!hasDoorParam && door === undefined) return { kind: 'menu' };

  const classKey = door?.classKey ?? urlClassKey;
  const known = classKeys.find((k) => k === classKey);
  if (known === undefined) return { kind: 'unavailable', classKey };

  return { kind: 'play', classKey: known, doorIndex: door?.index };
}
