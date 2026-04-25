/**
 * Resolves manifest audio require() numbers into domain-keyed maps.
 *
 * Input keys in the manifest are the raw audioName strings from aa_*.txt.
 * Output keys are the domain identifiers used by the engine:
 *   - tiles:        tile.base
 *   - words:        word.wordInLWC
 *   - syllables:    syllable.syllable
 *   - instructions: game.instructionAudio
 *
 * See design.md §D3. Sentinel 'zz_no_audio_needed' is silently skipped (Java parity).
 * The token 'naWhileMPOnly' in InstructionAudio is also silently skipped (design.md §4.1.5).
 */

import type { LangAssets } from '../LangAssets';
import { LangAssetsBindError } from '../LangAssetsBindError';

/** The Java sentinel for tiles that intentionally have no audio. */
const NO_AUDIO_SENTINEL = 'zz_no_audio_needed';

/**
 * Reserved tokens for instruction audio entries that have no audio file.
 * Java source: naWhileMPOnly and X are both valid no-audio sentinels in aa_games.txt.
 */
const NO_INSTRUCTION_AUDIO_SENTINELS = new Set(['naWhileMPOnly', 'X']);

type ManifestAudio = {
  tiles: Record<string, number>;
  words: Record<string, number>;
  syllables: Record<string, number>;
  instructions: Record<string, number>;
};

type ParsedPack = {
  tiles: { rows: Array<{ base: string; audioName: string }> };
  words: { rows: Array<{ wordInLWC: string }> };
  syllables: { rows: Array<{ syllable: string; audioName: string }> };
  games: { rows: Array<{ instructionAudio: string }> };
};

export function resolveAudio(
  manifestAudio: ManifestAudio,
  parsed: ParsedPack,
): LangAssets['audio'] {
  const tiles: Record<string, number> = {};
  for (const tile of parsed.tiles.rows) {
    if (tile.audioName === NO_AUDIO_SENTINEL) continue;
    const h = manifestAudio.tiles[tile.audioName];
    if (h === undefined) {
      throw new LangAssetsBindError({
        category: 'tile-audio',
        key: tile.audioName,
      });
    }
    tiles[tile.base] = h;
  }

  const words: Record<string, number> = {};
  for (const word of parsed.words.rows) {
    const h = manifestAudio.words[word.wordInLWC];
    if (h === undefined) {
      throw new LangAssetsBindError({
        category: 'word-audio',
        key: word.wordInLWC,
      });
    }
    words[word.wordInLWC] = h;
  }

  const syllables: Record<string, number> = {};
  for (const syll of parsed.syllables.rows) {
    const h = manifestAudio.syllables[syll.audioName];
    if (h === undefined) {
      throw new LangAssetsBindError({
        category: 'syllable-audio',
        key: syll.audioName,
      });
    }
    syllables[syll.syllable] = h;
  }

  const instructions: Record<string, number> = {};
  // Deduplicate: multiple games can share an instruction audio key
  const seen = new Set<string>();
  for (const game of parsed.games.rows) {
    const key = game.instructionAudio;
    if (NO_INSTRUCTION_AUDIO_SENTINELS.has(key)) continue;
    if (seen.has(key)) continue;
    seen.add(key);
    const h = manifestAudio.instructions[key];
    if (h === undefined) {
      throw new LangAssetsBindError({
        category: 'instruction-audio',
        key,
      });
    }
    instructions[key] = h;
  }

  return { tiles, words, syllables, instructions };
}
