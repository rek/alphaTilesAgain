import * as fs from 'fs';
import * as path from 'path';
import { parseGames } from '../libs/shared/util-lang-pack-parser/src';

/**
 * Verify every classKey in this pack's aa_games.txt has a corresponding
 * `apps/alphaTiles/app/games/<classKey>.tsx` route file. Throws on mismatch
 * so the caller (prebuild script) can fail the build before the manifest
 * is shipped.
 *
 * Excludes the dynamic `[classKey].tsx` catch-all — its "not yet implemented"
 * screen is exactly the silent-drift failure mode this guard prevents.
 *
 * No-ops if `aa_games.txt` is missing (pack hasn't been rsync'd yet).
 */
export function assertRoutesForGames(repoRoot: string, langDir: string): void {
  const gamesPath = path.join(langDir, 'aa_games.txt');
  if (!fs.existsSync(gamesPath)) return;

  const games = parseGames(fs.readFileSync(gamesPath, 'utf8'));
  const requiredKeys = new Set(games.rows.map((r) => r.classKey));

  const routesDir = path.join(repoRoot, 'apps', 'alphaTiles', 'app', 'games');
  const routeFiles = fs.existsSync(routesDir)
    ? fs
        .readdirSync(routesDir)
        .filter((f) => fs.statSync(path.join(routesDir, f)).isFile())
        .filter((f) => f.endsWith('.tsx'))
        .map((f) => f.replace(/\.tsx$/, ''))
        .filter((stem) => !stem.startsWith('['))
    : [];
  const presentKeys = new Set(routeFiles);

  const missing = [...requiredKeys].filter((k) => !presentKeys.has(k));
  if (missing.length > 0) {
    throw new Error(
      `aa_games.txt references classKey(s) with no matching route file:\n` +
        missing.map((k) => `  - apps/alphaTiles/app/games/${k}.tsx (missing)`).join('\n') +
        `\n\nAdd the route file(s) or fix the Country column in aa_games.txt.`,
    );
  }
}
