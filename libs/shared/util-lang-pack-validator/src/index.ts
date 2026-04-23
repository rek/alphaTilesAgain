// Core types
export type { Issue, IssueSeverity } from './Issue';
export type { ValidationReport, ValidationCounts } from './ValidationReport';
export type { FileInventory } from './FileInventory';
export { ISSUE_CODES } from './issueCodes';
export type { IssueCode } from './issueCodes';
export { buildReport } from './ValidationReport';

// Main validator
export { validateLangPack } from './validateLangPack';
export type { ValidateInput } from './validateLangPack';

// Formatters
export { formatReportHuman } from './formatReportHuman';
export { formatReportJson } from './formatReportJson';
export type { JsonReport } from './formatReportJson';

// Phoneme utility (re-exported for convenience)
export { parseWordIntoTiles, parseWordIntoTilesPreliminary, buildTileHashMap, getMultitypeTiles } from '@shared/util-phoneme';
export type { TileEntry, ParsedTile, ScriptType } from '@shared/util-phoneme';

// Individual checks (exposed for testing and advanced consumers)
export { checkFilePresence } from './checks/checkFilePresence';
export { checkWordlistCharacters } from './checks/checkWordlistCharacters';
export { checkKeyboardCoherence } from './checks/checkKeyboardCoherence';
export { checkTileWordCrossRef } from './checks/checkTileWordCrossRef';
export type { CrossRefResult } from './checks/checkTileWordCrossRef';
export { checkTileStructure } from './checks/checkTileStructure';
export { checkStageCoherence } from './checks/checkStageCoherence';
export { checkAudioReferences } from './checks/checkAudioReferences';
export { checkImageReferences } from './checks/checkImageReferences';
export { checkColorReferences } from './checks/checkColorReferences';
export { checkGameStructure } from './checks/checkGameStructure';
export { checkDuplicates } from './checks/checkDuplicates';
export { checkLangInfoRequired } from './checks/checkLangInfoRequired';
export { checkSettingsTypes } from './checks/checkSettingsTypes';
export { checkSyllablesCoherence, shouldCheckSyllables } from './checks/checkSyllablesCoherence';
