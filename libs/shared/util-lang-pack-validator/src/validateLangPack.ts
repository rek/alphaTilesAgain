/**
 * Top-level validator composer.
 *
 * Calls `parsePack` on the raw files, then runs every check in fixed order.
 * Parse errors are fatal — they terminate the run and return a single-issue report.
 * All other check functions accumulate issues and never throw.
 *
 * Java reference: Validator.java#validateGoogleSheet — overall structure.
 * Design reference: design.md §D1.
 */

import type { FileInventory } from './FileInventory';
import type { ValidationReport } from './ValidationReport';
import type { Issue } from './Issue';
import { buildReport } from './ValidationReport';
import { ISSUE_CODES } from './issueCodes';

import { parsePack, LangPackParseError } from '@shared/util-lang-pack-parser';
import type { ParsedPack } from '@shared/util-lang-pack-parser';
import type { ScriptType } from '@shared/util-phoneme';

import { checkFilePresence } from './checks/checkFilePresence';
import { checkWordlistCharacters } from './checks/checkWordlistCharacters';
import { checkKeyboardCoherence } from './checks/checkKeyboardCoherence';
import { checkTileWordCrossRef } from './checks/checkTileWordCrossRef';
import { checkTileStructure } from './checks/checkTileStructure';
import { checkStageCoherence } from './checks/checkStageCoherence';
import { checkAudioReferences } from './checks/checkAudioReferences';
import { checkImageReferences } from './checks/checkImageReferences';
import { checkColorReferences } from './checks/checkColorReferences';
import { checkGameStructure } from './checks/checkGameStructure';
import { checkDuplicates } from './checks/checkDuplicates';
import { checkLangInfoRequired } from './checks/checkLangInfoRequired';
import { checkSettingsTypes } from './checks/checkSettingsTypes';
import { checkSyllablesCoherence } from './checks/checkSyllablesCoherence';

export interface ValidateInput {
  rawFiles: Record<string, string>;
  fileInventory: FileInventory;
}

/** Resolve ScriptType from parsed langInfo — falls back to 'Roman' if absent or invalid. */
function resolveScriptType(parsed: ParsedPack): ScriptType {
  const validScriptTypes = new Set<ScriptType>([
    'Roman', 'Arabic', 'Devanagari', 'Khmer', 'Lao', 'Thai',
  ]);
  const v = parsed.langInfo.find('Script type') as ScriptType | undefined;
  if (!v) return 'Roman';
  return validScriptTypes.has(v) ? v : 'Roman';
}

/** Resolve placeholderCharacter from langInfo — defaults to '◌'. */
function resolvePlaceholderCharacter(parsed: ParsedPack): string {
  return parsed.langInfo.find('Placeholder character') ?? '◌';
}

/**
 * Sort issues for stable output: error < warning < info; then by category, file, line.
 */
const SEVERITY_ORDER: Record<string, number> = { error: 0, warning: 1, info: 2 };

function sortIssues(issues: Issue[]): Issue[] {
  return [...issues].sort((a, b) => {
    const sev = SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
    if (sev !== 0) return sev;
    const cat = a.category.localeCompare(b.category);
    if (cat !== 0) return cat;
    const file = (a.file ?? '').localeCompare(b.file ?? '');
    if (file !== 0) return file;
    return (a.line ?? 0) - (b.line ?? 0);
  });
}

/**
 * Validate a language pack.
 *
 * @param input.rawFiles  - Record mapping filename (e.g. 'aa_gametiles') to raw text content
 * @param input.fileInventory - Listing of files present on disk under `languages/<code>/`
 * @returns ValidationReport with issues, counts, and ok flag
 */
export function validateLangPack(input: ValidateInput): ValidationReport {
  const issues: Issue[] = [];

  // Parse the raw files — any parse error is fatal
  let parsed: ParsedPack;
  try {
    parsed = parsePack(input.rawFiles);
  } catch (e) {
    if (e instanceof LangPackParseError) {
      issues.push({
        severity: 'error',
        code: ISSUE_CODES.PARSE_FAILURE,
        category: 'parse-failure',
        file: e.file,
        line: e.line,
        column: e.column,
        message: e.message,
      });
      return buildReport(issues);
    }
    throw e;
  }

  const scriptType = resolveScriptType(parsed);
  const placeholderCharacter = resolvePlaceholderCharacter(parsed);

  // Run checks in fixed order per design.md §D1
  issues.push(...checkFilePresence(input.rawFiles, input.fileInventory));
  issues.push(...checkWordlistCharacters(parsed));
  issues.push(...checkKeyboardCoherence(parsed));

  // checkTileWordCrossRef returns auxiliary data needed by checkGameStructure
  const crossRefResult = checkTileWordCrossRef(parsed, placeholderCharacter);
  issues.push(...crossRefResult.issues);

  issues.push(...checkTileStructure(parsed));
  issues.push(...checkStageCoherence(parsed, scriptType, placeholderCharacter));
  issues.push(...checkAudioReferences(parsed, input.fileInventory));
  issues.push(...checkImageReferences(parsed, input.fileInventory));
  issues.push(...checkColorReferences(parsed));
  issues.push(...checkGameStructure(parsed, input.fileInventory, {
    threeCount: crossRefResult.threeCount,
    fourCount: crossRefResult.fourCount,
  }));
  issues.push(...checkDuplicates(parsed));
  issues.push(...checkLangInfoRequired(parsed));
  issues.push(...checkSettingsTypes(parsed));

  // Syllables check — checkSyllablesCoherence handles the threshold internally;
  // emits SYLLABLES_SKIPPED info when fewer than 6 words use '.' markers
  issues.push(...checkSyllablesCoherence(parsed, input.fileInventory));

  return buildReport(sortIssues(issues));
}
