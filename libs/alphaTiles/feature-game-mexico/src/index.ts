export { MexicoContainer } from './MexicoContainer';
export type { MexicoData } from './buildMexicoData';
// Side-effect import: registers the 'mexico' precompute at module load time
import './buildMexicoData';
