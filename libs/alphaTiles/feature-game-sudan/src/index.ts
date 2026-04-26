export { SudanContainer } from './SudanContainer';
export type { SudanData, SudanTile, SudanSyllable } from './sudanPreProcess';
export { TILE_PAGE_SIZE, SYLLABLE_PAGE_SIZE, buildSudanData } from './sudanPreProcess';
export { tileColor } from './tileColor';
export { syllableColor } from './syllableColor';
// Side-effect import: registers the 'sudan' precompute at module load time.
import './registerSudanPreProcess';
