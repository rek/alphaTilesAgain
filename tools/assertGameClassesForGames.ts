import * as fs from 'fs';
import * as path from 'path';
import { parseGames } from '../libs/shared/util-lang-pack-parser/src';
import { gameClassKeys } from '../apps/alphaTiles/src/gameClassKeys';

/**
 * Verify every classKey in this pack's aa_games.txt has a game-class registry
 * entry (`apps/alphaTiles/src/gameClassKeys.ts` → `gameClasses.ts`). Throws on
 * mismatch so the prebuild script fails before shipping a door the game route
 * can only render as "unavailable".
 *
 * No-ops if `aa_games.txt` is missing (pack hasn't been rsync'd yet).
 */
export function assertGameClassesForGames(
  langDir: string,
  known: readonly string[] = gameClassKeys,
): void {
  const gamesPath = path.join(langDir, 'aa_games.txt');
  if (!fs.existsSync(gamesPath)) return;

  const games = parseGames(fs.readFileSync(gamesPath, 'utf8'));
  const required = new Set(games.rows.map((r) => r.classKey));
  const missing = [...required].filter((k) => !known.includes(k));
  if (missing.length > 0) {
    throw new Error(
      `aa_games.txt references game class(es) with no registry entry:\n` +
        missing.map((k) => `  - ${k} (missing)`).join('\n') +
        `\n\nAdd the class to apps/alphaTiles/src/gameClassKeys.ts + gameClasses.ts, ` +
        `or fix the Country column in aa_games.txt.`,
    );
  }
}
