// Registers every game class's precompute (from the game-class registry) before
// LangAssetsProvider mounts. Imported at the top of _layout.tsx so runPrecomputes
// finds a fully-populated registry. Add a precompute on the class's entry in
// src/gameClasses.ts — not here.
import { registerPrecompute } from '@shared/util-precompute';
import { gameClasses } from '../src/gameClasses';

for (const [classKey, gameClass] of Object.entries(gameClasses)) {
  if (gameClass.precompute) registerPrecompute(classKey, gameClass.precompute);
}
