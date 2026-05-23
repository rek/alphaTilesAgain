/**
 * generate-cantonese-doors.ts
 *
 * Reads languages/yue/aa_games.txt and emits
 * apps/home/src/app/cantoneseDoors.generated.ts.
 *
 * The Cantonese game guide on the landing page (apps/home) hand-authors
 * a description per (country, challengeLevel, syllOrTile). This file
 * supplies the ground-truth list of doors so the guide can't drift if
 * yue's aa_games.txt is edited (door added, reordered, level bumped).
 *
 * Run: bun tools/generate-cantonese-doors.ts
 * Or:  npx tsx tools/generate-cantonese-doors.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { parseGames } from '../libs/shared/util-lang-pack-parser/src';

const SRC = path.join(__dirname, '../languages/yue/aa_games.txt');
const OUT = path.join(__dirname, '../apps/home/src/app/cantoneseDoors.generated.ts');

function die(msg: string): never {
  console.error(`\n[generate-cantonese-doors] ERROR: ${msg}\n`);
  process.exit(1);
}

if (!fs.existsSync(SRC)) die(`missing source: ${SRC}`);

const { rows } = parseGames(fs.readFileSync(SRC, 'utf8'));

const entries = rows
  .map((row, i) => {
    const index = i + 1;
    return `  { index: ${index}, classKey: ${JSON.stringify(row.classKey)}, challengeLevel: ${row.challengeLevel}, syllOrTile: ${JSON.stringify(row.syllOrTile)} },`;
  })
  .join('\n');

const body = `// AUTO-GENERATED — DO NOT EDIT.
// Source: languages/yue/aa_games.txt
// Regenerate: bun tools/generate-cantonese-doors.ts

export type YueGameRow = {
  index: number;
  classKey: string;
  challengeLevel: number;
  syllOrTile: 'T' | 'S';
};

export const YUE_GAME_ROWS: readonly YueGameRow[] = [
${entries}
];

/**
 * Stable key for joining hand-authored content to a game row.
 * Uses the parser-derived classKey (kebab-case) so a future Country rename
 * upstream doesn't silently invalidate every content entry.
 */
export function doorContentKey(row: { classKey: string; challengeLevel: number; syllOrTile: 'T' | 'S' }): string {
  return \`\${row.classKey}-\${row.challengeLevel}-\${row.syllOrTile}\`;
}
`;

fs.writeFileSync(OUT, body);
console.log(`[generate-cantonese-doors] wrote ${rows.length} rows to ${path.relative(process.cwd(), OUT)}`);
