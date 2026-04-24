export { ChinaContainer } from './ChinaContainer';
export type { ChinaData } from './buildChinaData';
// Side-effect import: registers the 'china' precompute at module load time
import './buildChinaData';
