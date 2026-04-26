// Registers all precompute functions before LangAssetsProvider mounts.
// Imported at the top of _layout.tsx so runPrecomputes finds a fully-populated registry.
//
// Only build/preprocess functions are imported here — not Containers or Screens —
// so this module doesn't pull game UI into the main bundle.
//
// When adding a new game that uses registerPrecompute, add an entry here.
import { registerPrecompute } from '@shared/util-precompute';
import { buildRomaniaData } from '@alphaTiles/feature-game-romania';
import { buildChinaData } from '@alphaTiles/feature-game-china';
import { chilePreProcess } from '@alphaTiles/feature-game-chile';
import { buildUnitedStatesData } from '@alphaTiles/feature-game-united-states';
import { brazilPreProcess } from '@alphaTiles/feature-game-brazil';
import { buildMexicoData } from '@alphaTiles/feature-game-mexico';
import { georgiaPreProcess } from '@alphaTiles/feature-game-georgia';
import { malaysiaPreProcess } from '@alphaTiles/feature-game-malaysia';
import { buildSudanData } from '@alphaTiles/feature-game-sudan';

registerPrecompute('romania', buildRomaniaData);
registerPrecompute('china', buildChinaData);
registerPrecompute('chile', chilePreProcess);
registerPrecompute('united-states', buildUnitedStatesData);
registerPrecompute('brazil', brazilPreProcess);
registerPrecompute('mexico', buildMexicoData);
registerPrecompute('georgia', georgiaPreProcess);
registerPrecompute('malaysia', malaysiaPreProcess);
registerPrecompute('sudan', (assets) => buildSudanData(assets, 7));
