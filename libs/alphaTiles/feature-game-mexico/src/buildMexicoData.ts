/**
 * Precompute that filters the pack's word list to words with both image and audio.
 * Registered at module load so it runs during loadLangPack (boot time).
 *
 * Port of Mexico.java:chooseMemoryWords — valid word qualification moved to boot time.
 * Mexico needs words that have both a .png (images.words) and an .mp3 (audio.words).
 */
import { registerPrecompute } from '@shared/util-precompute';
import type { LangAssets } from '@alphaTiles/data-language-assets';

export type MexicoData = {
  /** Words that have both an image and audio — valid for matching pairs. */
  validMatchingWords: LangAssets['words']['rows'];
};

export function buildMexicoData(assets: LangAssets): MexicoData {
  const validMatchingWords = assets.words.rows.filter(
    (word) =>
      word.wordInLWC in assets.images.words &&
      word.wordInLWC in assets.audio.words,
  );

  if (validMatchingWords.length === 0) {
    console.warn('[feature-game-mexico] no words with both image and audio found');
  }

  return { validMatchingWords };
}

registerPrecompute('mexico', buildMexicoData);
