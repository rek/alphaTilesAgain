export { GeorgiaContainer } from './GeorgiaContainer';
export type { GeorgiaData } from './georgiaPreProcess';
// Side-effect import: registers the 'georgia' precompute at module load.
import './georgiaPreProcess';
