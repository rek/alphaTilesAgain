/**
 * Precompute for the Chile Wordle game.
 *
 * Port of Chile.java chilePreProcess():
 * - Reads settings: minWordLength, maxWordLength, keyboardWidth.
 * - Parses each word into phonemic tiles; filters by tile count bounds.
 * - Builds keyboard: union of tile strings from valid words, max 50 tiles.
 *   Words using tiles beyond the 50-tile cap are removed.
 * - Sorts keyboard tiles by their index in the tile list.
 *
 * Chile.java: line 302–370.
 */
import { parseWordIntoTiles } from '@shared/util-phoneme';
import type { LangAssets } from '@alphaTiles/data-language-assets';
import type { ScriptType } from '@shared/util-phoneme';

export type ChileData = {
  /** Each word as an array of tile strings (e.g. ["ba","na","na"]). */
  words: string[][];
  /** Sorted keyboard tile strings. */
  keys: string[];
  /** Number of keyboard columns (default 7). */
  keyboardWidth: number;
};

const MAX_KEYBOARD_SIZE = 50;
const DEFAULT_KEYBOARD_WIDTH = 7;
const DEFAULT_MIN_WORD_LENGTH = 3;
const DEFAULT_MAX_WORD_LENGTH = 100;

export function chilePreProcess(assets: LangAssets): ChileData {
  const settings = assets.settings;
  const keyboardWidth = settings.findInt('Chile keyboard width', DEFAULT_KEYBOARD_WIDTH);
  const minWordLength = settings.findInt('Chile minimum word length', DEFAULT_MIN_WORD_LENGTH);
  const maxWordLength = settings.findInt('Chile maximum word length', DEFAULT_MAX_WORD_LENGTH);

  const tileRows = assets.tiles.rows;
  const placeholderCharacter = assets.langInfo.find('Placeholder character') ?? '◌';
  const scriptType = (assets.langInfo.find('Script type') ?? 'Roman') as ScriptType;

  // Parse words into tile arrays; filter by length
  const splitWords: string[][] = [];
  for (const word of assets.words.rows) {
    const parsed = parseWordIntoTiles({
      wordInLOP: word.wordInLOP,
      mixedDefs: word.mixedDefs,
      tiles: tileRows,
      scriptType,
      placeholderCharacter,
    });
    if (parsed === null) continue;
    const tileBases = parsed.map((t) => t.base);
    if (tileBases.length < minWordLength || tileBases.length > maxWordLength) continue;
    splitWords.push(tileBases);
  }

  // Build keyboard: union of tile strings up to MAX_KEYBOARD_SIZE.
  // Words that need a tile beyond the cap are removed.
  // Java: Chile.java line 334–349 (iterates splitWords, removes if tile not in keyboard and at cap).
  const keyboard = new Set<string>();
  let i = 0;
  while (i < splitWords.length) {
    const word = splitWords[i];
    let canUseWord = true;
    for (const tile of word) {
      if (keyboard.size < MAX_KEYBOARD_SIZE) {
        keyboard.add(tile);
      } else if (!keyboard.has(tile)) {
        splitWords.splice(i, 1);
        canUseWord = false;
        break;
      }
    }
    if (canUseWord) i++;
  }

  // Sort keyboard by tile list order (Chile.java line 351–367)
  const kbArray = Array.from(keyboard);
  const indexedKeys: Array<{ text: string; idx: number }> = kbArray.map((key) => {
    const idx = tileRows.findIndex((t) => t.base === key);
    return { text: key, idx: idx >= 0 ? idx : Infinity };
  });
  indexedKeys.sort((a, b) => a.idx - b.idx);
  const keys = indexedKeys.map((k) => k.text);

  return { words: splitWords, keys, keyboardWidth };
}
