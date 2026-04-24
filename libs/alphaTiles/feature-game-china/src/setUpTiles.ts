/**
 * Port of China.java:171–221 setUpTiles.
 * Builds a 16-cell board from the four words, then slide-shuffles `moves` times.
 * Returns null when tile count != 15 (caller should retry with new chooseWords).
 *
 * parseWordIntoTiles is injected so this module has no direct util-phoneme import.
 */
import { isSlideable } from './isSlideable';
import { swapTiles } from './swapTiles';
import type { LangAssets } from '@alphaTiles/data-language-assets';

type Word = LangAssets['words']['rows'][number];

function fisherYates(arr: string[], rng: () => number): string[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function setUpTiles({
  threeTileWord,
  fourTileWords,
  parseTiles,
  moves,
  rng = Math.random,
}: {
  threeTileWord: Word;
  fourTileWords: [Word, Word, Word];
  parseTiles: (word: Word) => string[] | null;
  moves: number;
  rng?: () => number;
}): { boardText: string[]; blankIndex: number } | null {
  const allTileBases: string[] = [];

  for (const word of fourTileWords) {
    const parsed = parseTiles(word);
    if (parsed === null) return null;
    allTileBases.push(...parsed);
  }
  const threeParsed = parseTiles(threeTileWord);
  if (threeParsed === null) return null;
  allTileBases.push(...threeParsed);

  if (allTileBases.length !== 15) return null;

  const shuffled = fisherYates(allTileBases, rng);
  let board: string[] = [...shuffled, ''];
  let blankIdx = 15;

  let movesLeft = moves;
  // sentinel: 16 is out-of-range so any tile is valid on first pick
  let lastTile = 16;

  while (movesLeft > 0) {
    const tileX = Math.floor(rng() * 16);
    if (isSlideable(tileX, blankIdx) && tileX !== lastTile) {
      const result = swapTiles(board, tileX, blankIdx);
      board = result.board;
      blankIdx = result.blankIndex;
      lastTile = tileX;
      movesLeft--;
    }
  }

  return { boardText: board, blankIndex: blankIdx };
}
