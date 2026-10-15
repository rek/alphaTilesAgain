import { useDoors } from './useDoors';
import { doorForParams } from './internal/doorForParams';

/**
 * The Door a game route points at (see `doorForParams`: `doorIndex` wins over
 * the legacy `gameNumber`; unknown or hidden door → undefined, which the shell
 * turns into a redirect to the menu).
 */
export function useDoor(params: { doorIndex?: unknown; gameNumber?: unknown; [param: string]: unknown }) {
  return doorForParams(useDoors(), params);
}
