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
  /**
   * Multiplier applied to keyboard tile font size so the longest tile string fits.
   * Port of `Util.getMinFontSize(String[])` (Util.java:29-43).
   *
   * Java algorithm:
   *   size = 1000; min = 0.5
   *   for s in strings: width = paint.getTextBounds(s).width(); min = min(1000/width, min)
   *
   * Real pixel widths require a font renderer; we approximate width with the
   * tile string's codepoint count (Array.from length) times a per-glyph width
   * factor. The 0.5 cap matches Java; values < 0.5 shrink longer strings.
   */
  fontScale: number;
};

const MAX_KEYBOARD_SIZE = 50;
const DEFAULT_KEYBOARD_WIDTH = 7;
const DEFAULT_MIN_WORD_LENGTH = 3;
const DEFAULT_MAX_WORD_LENGTH = 100;
/**
 * Approximation of Android `Paint.getTextBounds` width per glyph at textSize=1000.
 * A typical sans-serif glyph renders ~600px wide at textSize=1000 (em ≈ 0.6 em-square).
 * Tuned so 1-codepoint strings yield 1000/600 ≈ 1.67 → capped to 0.5.
 */
const GLYPH_WIDTH_AT_1000 = 600;
const FONT_SCALE_CAP = 0.5;

/**
 * Port of `Util.getMinFontSize(String[])` (Util.java:29-43).
 * Returns `min(1000 / width(s), 0.5)` over all `s` in `keys`.
 * Width approximated by codepoint count (handles surrogate pairs).
 */
export function getMinFontSize(keys: string[]): number {
  let min = FONT_SCALE_CAP;
  for (const s of keys) {
    const codepointCount = Array.from(s).length;
    if (codepointCount === 0) continue;
    const width = codepointCount * GLYPH_WIDTH_AT_1000;
    const widthScale = 1000 / width;
    if (widthScale < min) min = widthScale;
  }
  return min;
}

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

  const fontScale = getMinFontSize(keys);

  return { words: splitWords, keys, keyboardWidth, fontScale };
}
