export { UnitedStatesContainer } from './UnitedStatesContainer';
export type { UnitedStatesData } from './buildUnitedStatesData';
// Side-effect import: registers the 'united-states' precompute at module load time
import './buildUnitedStatesData';
