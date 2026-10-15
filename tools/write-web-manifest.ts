/**
 * Rewrite an exported web manifest for APP_LANG (see localizeWebManifest).
 * Usage (alphaTiles:web-export, after `expo export`):
 *   APP_LANG=yue npx tsx tools/write-web-manifest.ts apps/alphaTiles/dist/web/manifest.json
 */
import * as fs from 'fs';
import * as path from 'path';
import { localizeWebManifest } from './localizeWebManifest';

const lang = process.env['APP_LANG'];
const target = process.argv[2];
if (!lang || !target) {
  console.error('usage: APP_LANG=<lang> tsx tools/write-web-manifest.ts <manifest.json>');
  process.exit(1);
}

const packDir = path.join(__dirname, '..', 'languages', lang);
const read = (f: string) =>
  fs.existsSync(path.join(packDir, f)) ? fs.readFileSync(path.join(packDir, f), 'utf8') : '';

const manifest = JSON.parse(fs.readFileSync(target, 'utf8')) as Record<string, unknown>;
const localized = localizeWebManifest(manifest, { langInfo: read('aa_langinfo.txt'), share: read('aa_share.txt') });
fs.writeFileSync(target, JSON.stringify(localized, null, 2) + '\n');
console.log(`web manifest for ${lang}: ${String(localized['name'])} (${String(localized['lang'] ?? '-')})`);
