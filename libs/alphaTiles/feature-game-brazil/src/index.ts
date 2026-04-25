export { BrazilContainer } from './BrazilContainer';
export type { BrazilData } from './brazilPreProcess';
// Side-effect import: registers the 'brazil' precompute at module load time
import './brazilPreProcess';
