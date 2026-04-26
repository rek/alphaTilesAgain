export { MalaysiaContainer } from './MalaysiaContainer';
export { MalaysiaScreen } from './MalaysiaScreen';
export type { MalaysiaScreenProps, MalaysiaRow } from './MalaysiaScreen';
export type { MalaysiaData } from './malaysiaPreProcess';
// Side-effect import: registers the 'malaysia' precompute at module load time.
import './malaysiaPreProcess';
