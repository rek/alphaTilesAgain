import { registerPrecompute } from '@shared/util-precompute';
import type { GameClass } from './GameRouteContainer';

/**
 * Register every game class's precompute under its classKey. Call once at
 * module load, before LangAssetsProvider mounts (loadLangPack runs them).
 */
export function registerGameClassPrecomputes(gameClasses: Record<string, GameClass>): void {
  for (const [classKey, gameClass] of Object.entries(gameClasses)) {
    if (gameClass.precompute) registerPrecompute(classKey, gameClass.precompute);
  }
}
