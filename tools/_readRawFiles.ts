/**
 * Read all aa_*.txt files from a language pack directory.
 * Returns a Record mapping basename-without-extension to raw text content.
 *
 * e.g. { 'aa_gametiles': '<raw content>', 'aa_wordlist': '<raw content>', ... }
 */

import * as fs from 'fs';
import * as path from 'path';

export function readRawFiles(langDir: string): Record<string, string> {
  const rawFiles: Record<string, string> = {};

  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(langDir, { withFileTypes: true });
  } catch {
    throw new Error(`Cannot read language pack directory: ${langDir}`);
  }

  for (const entry of entries) {
    if (!entry.isFile()) continue;
    if (!entry.name.startsWith('aa_') || !entry.name.endsWith('.txt')) continue;

    const key = entry.name.replace(/\.txt$/, ''); // 'aa_gametiles.txt' → 'aa_gametiles'
    const fullPath = path.join(langDir, entry.name);
    rawFiles[key] = fs.readFileSync(fullPath, 'utf8');
  }

  return rawFiles;
}
