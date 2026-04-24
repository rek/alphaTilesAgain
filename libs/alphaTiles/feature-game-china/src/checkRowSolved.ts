/**
 * Port of China.java:278–335 checkLineForSolve.
 * Returns true when the row's tiles combine to match the target word's standardized sequence.
 *
 * Row-3 constraint (China.java:300–304):
 * The three-tile word row is only solved when the blank is at column 0 or column 3 of that row.
 * Blank at columns 1 or 2 (absolute indices 13 or 14) → not solved.
 */
import {
  combineTilesToMakeWord,
  standardizeWordSequence,
} from '@shared/util-phoneme';
import type { TileEntry, ParsedTile } from '@shared/util-phoneme';
import type { ScriptType } from '@shared/util-phoneme';

type Word = {
  wordInLOP: string;
  mixedDefs: string;
  stageOfFirstAppearance: string;
};

function toMinimalParsedTile(entry: TileEntry): ParsedTile {
  return {
    base: entry.base,
    typeOfThisTileInstance: entry.type,
    stageOfFirstAppearanceForThisTileType: entry.stageOfFirstAppearance,
    audioForThisTileType: entry.audioName,
    tileType: entry.type,
    tileTypeB: entry.tileTypeB,
    tileTypeC: entry.tileTypeC,
  };
}

export function checkRowSolved({
  board,
  row,
  targetWord,
  blankIndex,
  tileMap,
  placeholderCharacter,
  scriptType,
}: {
  board: string[];
  row: number;
  targetWord: Word;
  blankIndex: number;
  tileMap: Map<string, TileEntry>;
  placeholderCharacter: string;
  scriptType: string;
}): boolean {
  // Row 3 constraint: blank mid-row means not solved (China.java:300–304).
  // Absolute indices 13 and 14 are columns 1 and 2 of the bottom row.
  if (row === 3 && (blankIndex === 13 || blankIndex === 14)) return false;

  const start = row * 4;
  const parsedTiles: ParsedTile[] = [];

  for (let col = 0; col < 4; col++) {
    const cellText = board[start + col];
    if (cellText === '') continue;
    const entry = tileMap.get(cellText);
    if (entry) parsedTiles.push(toMinimalParsedTile(entry));
  }

  const gridWord = combineTilesToMakeWord(parsedTiles, targetWord.wordInLOP, -1, scriptType);

  const tileEntries = [...tileMap.values()];
  const standardized = standardizeWordSequence(
    {
      wordInLOP: targetWord.wordInLOP,
      mixedDefs: targetWord.mixedDefs,
      tiles: tileEntries,
      scriptType: scriptType as ScriptType,
      placeholderCharacter,
    },
    scriptType,
  );

  return gridWord === standardized;
}
