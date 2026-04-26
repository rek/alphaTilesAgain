import { registerPrecompute } from '@shared/util-precompute';
import type { LangAssets } from '@alphaTiles/data-language-assets';
import { buildSudanData } from './sudanPreProcess';

// Side-effect module: registers the 'sudan' precompute at module load.
// Stage 7 covers all tiles; container can re-paginate if needed for stage drift.
registerPrecompute('sudan', (assets: LangAssets) => buildSudanData(assets, 7));
