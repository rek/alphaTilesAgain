import { registerPrecompute } from '@shared/util-precompute';
import { chilePreProcess } from './chilePreProcess';

registerPrecompute('chile', chilePreProcess);
