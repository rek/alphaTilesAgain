export { RomaniaContainer } from './RomaniaContainer';
export type { RomaniaData } from './buildRomaniaData';
// Side-effect import: registers the 'romania' precompute at module load time
import './buildRomaniaData';
