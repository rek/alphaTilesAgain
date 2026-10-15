import type { Door } from './doorsOf';

/**
 * Doors in difficulty-ladder order: by curriculum `tier` ascending, file order
 * (`index`) within a tier. A new array; every door keeps its own `index`
 * (difficulty-ladder design D2 — the menu grid and the next-door search sort,
 * the route `doorIndex` never changes).
 */
export function ladderOrder<D extends Pick<Door, 'tier' | 'index'>>(doors: readonly D[]) {
  return [...doors].sort((a, b) => a.tier - b.tier || a.index - b.index);
}
