/**
 * Finds the next game in the game list that has not been mastered
 * (checked12Trackers === false) by the given player.
 *
 * Ports GameActivity.java:356-411 — the while-loop inside the Timer callback
 * that iterates through gameList to find the next uncompleted game.
 *
 * Returns the found entry (gameNumber is 1-based) or null if all games are done.
 */

import type { ProgressEntry } from '@alphaTiles/data-progress';

type GameRow = {
  door: number;
  country: string;
  challengeLevel: number;
  syllOrTile: 'T' | 'S';
  stagesIncluded: string;
};

type NextGameResult = {
  gameNumber: number; // 1-based
  country: string;
  challengeLevel: number;
  syllableGame: string;
  stage: number;
};

export function findNextUncompletedGame(
  gameList: GameRow[],
  fromGameNumber: number, // current 1-based game number
  progress: Record<string, ProgressEntry>,
  playerId: string,
): NextGameResult | null {
  const total = gameList.length;
  let current = fromGameNumber;

  for (let repeat = 0; repeat < total; repeat++) {
    // Advance to next (wrap around)
    current = current < total ? current + 1 : 1;
    const game = gameList[current - 1];
    const stagesIncluded = game.stagesIncluded;
    // Match Java: stage '-' → 1; else parseInt
    const stage = stagesIncluded === '-' ? 1 : parseInt(stagesIncluded, 10) || 1;
    const syllableGame = game.syllOrTile === 'S' ? 'S' : '';

    // Build the unique ID the same way buildGameUniqueId does — but avoid importing
    // data-progress here to keep dep count small. Reconstruct the key pattern.
    // Pattern: country + challengeLevel + playerId + syllableGame + stage
    const key = `${game.country}${game.challengeLevel}${playerId}${syllableGame}${stage}`;
    const entry = progress[key];
    const checked12 = entry?.checked12Trackers ?? false;

    if (!checked12) {
      return {
        gameNumber: current,
        country: game.country,
        challengeLevel: game.challengeLevel,
        syllableGame,
        stage,
      };
    }
  }

  // All games completed
  return null;
}
