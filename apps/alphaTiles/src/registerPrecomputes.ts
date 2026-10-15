// Registers every game class's precompute (from the game-class registry) before
// LangAssetsProvider mounts. Imported first in app/_layout.tsx so runPrecomputes
// finds a fully-populated registry. Add a precompute on the class's entry in
// src/gameClasses.ts — not here.
import { registerGameClassPrecomputes } from '@alphaTiles/feature-game-shell';
import { gameClasses } from './gameClasses';

registerGameClassPrecomputes(gameClasses);
