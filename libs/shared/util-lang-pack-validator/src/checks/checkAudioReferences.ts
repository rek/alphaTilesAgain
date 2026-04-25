/**
 * Audio reference checks.
 *
 * Java reference: Validator.java#checkAudioPresence + validateResourceSubfolders.
 *
 * Checks:
 * - Every tile audioName has a file in audio/tiles/ (or is zz_no_audio_needed / X)
 * - Every word LWC has a file in audio/words/
 * - Every syllable audioName has a file in audio/syllables/ (when syllables checked)
 * - Every game InstructionAudio has a file in audio/instructions/ (checked in game-structure)
 * - Orphan mp3s (files not referenced anywhere) → warning
 * - Zero-byte audio files → error (requires sizes in FileInventory)
 * - Oversize audio files (>1MB tiles/words/syllables, >300KB instructions) → warning
 * - Typo hints via Levenshtein for missing audio
 */

import type { Issue } from '../Issue';
import type { ParsedPack } from '@shared/util-lang-pack-parser';
import type { FileInventory } from '../FileInventory';
import { ISSUE_CODES } from '../issueCodes';
import { wordDistance } from '../levenshtein';

const CATEGORY = 'audio-reference';

const SKIP_AUDIO_VALUES = new Set(['X', 'naWhileMPOnly', 'zz_no_audio_needed', '']);
const MAX_LEVENSHTEIN_RATIO = 0.4; // Java: error / file.name.length < 0.4

const TILE_AUDIO_MAX_BYTES = 50_000;
const WORD_AUDIO_MAX_BYTES = 50_000;

function findTypoSuggestion(
  missing: string,
  candidates: string[],
): string | null {
  if (missing.length === 0) return null;
  let minError = MAX_LEVENSHTEIN_RATIO;
  let closest: string | null = null;
  for (const candidate of candidates) {
    const dist = wordDistance(candidate, missing);
    const ratio = dist / missing.length;
    if (ratio < minError) {
      minError = ratio;
      closest = candidate;
    }
  }
  return closest;
}

export function checkAudioReferences(
  parsed: ParsedPack,
  inventory: FileInventory,
): Issue[] {
  const issues: Issue[] = [];
  const { tiles, words, syllables, settings } = parsed;

  const hasTileAudio = settings.findBoolean('Has tile audio', false);
  const hasSyllableAudio = settings.findBoolean('Has syllable audio', false);

  // Track referenced audio to find orphans later
  const referencedTileAudio = new Set<string>();
  const referencedWordAudio = new Set<string>();
  const referencedSyllableAudio = new Set<string>();

  // Tile audio checks
  for (let i = 0; i < tiles.rows.length; i++) {
    const row = tiles.rows[i];
    const lineNumber = i + 2;

    for (const [audioField, audioValue] of [
      ['audioName', row.audioName],
      ['audioNameB', row.audioNameB],
      ['audioNameC', row.audioNameC],
    ] as const) {
      if (SKIP_AUDIO_VALUES.has(audioValue)) continue;
      referencedTileAudio.add(audioValue);
      if (!inventory.tileAudio.includes(audioValue)) {
        const suggestion = findTypoSuggestion(audioValue, inventory.tileAudio);
        issues.push({
          severity: 'error',
          code: ISSUE_CODES.MISSING_TILE_AUDIO,
          category: CATEGORY,
          file: 'aa_gametiles.txt',
          line: lineNumber,
          column: audioField,
          message: `Tile "${row.base}" references audio "${audioValue}" but no file audio/tiles/${audioValue}.mp3 was found${suggestion ? ` (did you mean "${suggestion}"?)` : ''}`,
          context: { audioName: audioValue, tile: row.base, suggestion },
        });
        if (suggestion) {
          issues.push({
            severity: 'info',
            code: ISSUE_CODES.AUDIO_TYPO_SUGGESTION,
            category: CATEGORY,
            file: 'aa_gametiles.txt',
            line: lineNumber,
            message: `Audio "${audioValue}" is missing but "${suggestion}" exists and is similar — did you make a typo?`,
            context: { missing: audioValue, suggestion },
          });
        }
      } else {
        // Size checks
        if (inventory.sizes) {
          const size = inventory.sizes[audioValue] ?? 0;
          if (size === 0) {
            issues.push({
              severity: 'error',
              code: ISSUE_CODES.ZERO_BYTE_AUDIO_FILE,
              category: CATEGORY,
              file: 'aa_gametiles.txt',
              line: lineNumber,
              message: `Audio file ${audioValue}.mp3 in audio/tiles/ is zero bytes`,
              context: { audioName: audioValue },
            });
          } else if (size > TILE_AUDIO_MAX_BYTES) {
            issues.push({
              severity: 'warning',
              code: ISSUE_CODES.OVERSIZE_AUDIO_FILE,
              category: CATEGORY,
              message: `Audio file ${audioValue}.mp3 in audio/tiles/ is ${size} bytes (max recommended ${TILE_AUDIO_MAX_BYTES})`,
              context: { audioName: audioValue, size, max: TILE_AUDIO_MAX_BYTES },
            });
          }
        }
      }
    }
  }

  // Word audio checks — every word LWC must have an audio file
  for (let i = 0; i < words.rows.length; i++) {
    const row = words.rows[i];
    const lineNumber = i + 2;
    const lwc = row.wordInLWC;
    referencedWordAudio.add(lwc);
    if (!inventory.wordAudio.includes(lwc)) {
      const suggestion = findTypoSuggestion(lwc, inventory.wordAudio);
      issues.push({
        severity: 'error',
        code: ISSUE_CODES.MISSING_WORD_AUDIO,
        category: CATEGORY,
        file: 'aa_wordlist.txt',
        line: lineNumber,
        column: 'wordInLWC',
        message: `Word "${lwc}" is missing audio file audio/words/${lwc}.mp3${suggestion ? ` (did you mean "${suggestion}"?)` : ''}`,
        context: { audioName: lwc, word: lwc, suggestion },
      });
    } else if (inventory.sizes) {
      const size = inventory.sizes[lwc] ?? 0;
      if (size === 0) {
        issues.push({
          severity: 'error',
          code: ISSUE_CODES.ZERO_BYTE_AUDIO_FILE,
          category: CATEGORY,
          file: 'aa_wordlist.txt',
          line: lineNumber,
          message: `Audio file ${lwc}.mp3 in audio/words/ is zero bytes`,
          context: { audioName: lwc },
        });
      } else if (size > WORD_AUDIO_MAX_BYTES) {
        issues.push({
          severity: 'warning',
          code: ISSUE_CODES.OVERSIZE_AUDIO_FILE,
          category: CATEGORY,
          message: `Audio file ${lwc}.mp3 in audio/words/ is ${size} bytes (max recommended ${WORD_AUDIO_MAX_BYTES})`,
          context: { audioName: lwc, size, max: WORD_AUDIO_MAX_BYTES },
        });
      }
    }
  }

  // Syllable audio (only when syllables are active — checked separately in checkSyllablesCoherence)
  if (hasSyllableAudio) {
    for (let i = 0; i < syllables.rows.length; i++) {
      const row = syllables.rows[i];
      const lineNumber = i + 2;
      if (SKIP_AUDIO_VALUES.has(row.audioName)) continue;
      referencedSyllableAudio.add(row.audioName);
      if (!inventory.syllableAudio.includes(row.audioName)) {
        issues.push({
          severity: 'error',
          code: ISSUE_CODES.MISSING_SYLLABLE_AUDIO,
          category: CATEGORY,
          file: 'aa_syllables.txt',
          line: lineNumber,
          column: 'audioName',
          message: `Syllable "${row.syllable}" references audio "${row.audioName}" but no file audio/syllables/${row.audioName}.mp3 was found`,
          context: { audioName: row.audioName, syllable: row.syllable },
        });
      }
    }
  }

  // Cross-check: syllable audio setting vs actual audio files
  const syllableAudioAttempted = inventory.syllableAudio.length > 0;
  if (syllableAudioAttempted && !hasSyllableAudio) {
    issues.push({
      severity: 'warning',
      code: ISSUE_CODES.MISSING_SYLLABLE_AUDIO,
      category: CATEGORY,
      message: 'Syllable audio files exist but "Has syllable audio" in settings is not TRUE',
      context: { hasSyllableAudioSetting: hasSyllableAudio, syllableAudioFiles: inventory.syllableAudio.length },
    });
  } else if (!syllableAudioAttempted && hasSyllableAudio) {
    issues.push({
      severity: 'warning',
      code: ISSUE_CODES.MISSING_SYLLABLE_AUDIO,
      category: CATEGORY,
      message: '"Has syllable audio" is TRUE in settings but no syllable audio files were found in audio/syllables/',
      context: { hasSyllableAudioSetting: hasSyllableAudio, syllableAudioFiles: 0 },
    });
  }

  // Tile audio setting vs actual files
  const tileAudioAttempted = inventory.tileAudio.length > 0;
  if (tileAudioAttempted && !hasTileAudio) {
    issues.push({
      severity: 'warning',
      code: ISSUE_CODES.MISSING_TILE_AUDIO,
      category: CATEGORY,
      message: 'Tile audio files exist but "Has tile audio" in settings is not TRUE',
      context: { hasTileAudioSetting: hasTileAudio, tileAudioFiles: inventory.tileAudio.length },
    });
  } else if (!tileAudioAttempted && hasTileAudio) {
    issues.push({
      severity: 'warning',
      code: ISSUE_CODES.MISSING_TILE_AUDIO,
      category: CATEGORY,
      message: '"Has tile audio" is TRUE in settings but no tile audio files were found in audio/tiles/',
      context: { hasTileAudioSetting: hasTileAudio, tileAudioFiles: 0 },
    });
  }

  // Orphan audio files — in inventory but not referenced
  for (const f of inventory.tileAudio) {
    if (!referencedTileAudio.has(f)) {
      issues.push({
        severity: 'warning',
        code: ISSUE_CODES.ORPHAN_AUDIO_FILE,
        category: CATEGORY,
        message: `audio/tiles/${f}.mp3 exists but is not referenced by any tile in aa_gametiles.txt`,
        context: { file: f, dir: 'audio/tiles' },
      });
    }
  }
  for (const f of inventory.wordAudio) {
    if (!referencedWordAudio.has(f)) {
      issues.push({
        severity: 'warning',
        code: ISSUE_CODES.ORPHAN_AUDIO_FILE,
        category: CATEGORY,
        message: `audio/words/${f}.mp3 exists but is not referenced by any word in aa_wordlist.txt`,
        context: { file: f, dir: 'audio/words' },
      });
    }
  }
  for (const f of inventory.syllableAudio) {
    if (!referencedSyllableAudio.has(f)) {
      issues.push({
        severity: 'warning',
        code: ISSUE_CODES.ORPHAN_AUDIO_FILE,
        category: CATEGORY,
        message: `audio/syllables/${f}.mp3 exists but is not referenced by any syllable`,
        context: { file: f, dir: 'audio/syllables' },
      });
    }
  }

  return issues;
}
