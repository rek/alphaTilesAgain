/**
 * Port of China.java:130–156 chooseWords.
 * Selects 1 three-tile word and 3 four-tile words without replacement.
 * Returns { error } when pools are too small instead of silently skipping (Java log).
 */
import type { LangAssets } from '@alphaTiles/data-language-assets';

type Word = LangAssets['words']['rows'][number];

export function chooseWords({
  threeTileWords,
  fourTileWords,
  rng = Math.random,
}: {
  threeTileWords: Word[];
  fourTileWords: Word[];
  rng?: () => number;
}):
  | { threeTileWord: Word; fourTileWords: [Word, Word, Word] }
  | { error: 'insufficient-content' } {
  if (threeTileWords.length === 0 || fourTileWords.length < 3) {
    return { error: 'insufficient-content' };
  }

  const threeTileWord = threeTileWords[Math.floor(rng() * threeTileWords.length)];

  const pool = [...fourTileWords];
  const four: Word[] = [];
  for (let i = 0; i < 3; i++) {
    const idx = Math.floor(rng() * pool.length);
    four.push(pool.splice(idx, 1)[0]);
  }

  return { threeTileWord, fourTileWords: four as [Word, Word, Word] };
}
