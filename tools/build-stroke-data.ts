/**
 * build-stroke-data.ts
 *
 * Prebuild step that emits per-character stroke JSON for Chinese-script packs.
 *
 * Source: hanzi-writer-data (npm distribution of Make Me a Hanzi).
 * Strategy: fetch per-character JSON from jsdelivr CDN; cache locally under
 * tools/data/stroke-cache/<char>.json so subsequent builds are offline.
 * Spec D3 originally proposed vendoring graphics.txt directly (~30MB); per-char
 * fetch + cache is functionally equivalent and avoids the bulk vendor.
 *
 * Gates on aa_langinfo.txt 'Script type' === 'Chinese'. Non-Chinese packs:
 * exit 0 silently and emit no strokes/ directory.
 *
 * Run: APP_LANG=yue npx tsx tools/build-stroke-data.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { parseGametiles, parseLangInfo } from '../libs/shared/util-lang-pack-parser/src';

const REPO_ROOT = path.resolve(__dirname, '..');
const APP_LANG = process.env['APP_LANG'];
if (!APP_LANG) die('APP_LANG env var required (e.g. APP_LANG=yue)');

const LANG_DIR = path.join(REPO_ROOT, 'languages', APP_LANG);
const LANGINFO_PATH = path.join(LANG_DIR, 'aa_langinfo.txt');
const GAMETILES_PATH = path.join(LANG_DIR, 'aa_gametiles.txt');
const STROKES_OUT_DIR = path.join(LANG_DIR, 'strokes');
const CACHE_DIR = path.join(REPO_ROOT, 'tools', 'data', 'stroke-cache');
const CDN_BASE = 'https://cdn.jsdelivr.net/npm/hanzi-writer-data@2.0';

main().catch((e) => {
  console.error('[build-stroke-data] fatal:', e);
  process.exit(1);
});

async function main(): Promise<void> {
  if (!fs.existsSync(LANGINFO_PATH)) {
    die(`aa_langinfo.txt missing at ${LANGINFO_PATH} — run rsync-lang-packs first`);
  }

  const langInfo = parseLangInfo(fs.readFileSync(LANGINFO_PATH, 'utf-8'));
  const scriptType = langInfo.find('Script type') ?? '';

  if (scriptType.trim().toLowerCase() !== 'chinese') {
    console.log(
      `[build-stroke-data] script type "${scriptType}" — non-Chinese, skipping (no strokes/ dir emitted)`,
    );
    if (fs.existsSync(STROKES_OUT_DIR)) {
      fs.rmSync(STROKES_OUT_DIR, { recursive: true, force: true });
    }
    return;
  }

  if (!fs.existsSync(GAMETILES_PATH)) die(`aa_gametiles.txt missing at ${GAMETILES_PATH}`);

  const tiles = parseGametiles(fs.readFileSync(GAMETILES_PATH, 'utf-8'));
  const distinctChars = collectDistinctChars(tiles.rows.map((r) => r.base));

  ensureDir(CACHE_DIR);
  ensureDir(STROKES_OUT_DIR);

  const covered: string[] = [];
  const missing: string[] = [];

  for (const ch of distinctChars) {
    const cachePath = path.join(CACHE_DIR, `${ch}.json`);
    const outPath = path.join(STROKES_OUT_DIR, `${ch}.json`);

    let json: string | null = null;
    if (fs.existsSync(cachePath)) {
      json = fs.readFileSync(cachePath, 'utf-8');
    } else {
      json = await fetchCharJson(ch);
      if (json !== null) {
        fs.writeFileSync(cachePath, json, 'utf-8');
      }
    }

    if (json === null) {
      missing.push(ch);
      continue;
    }

    const wrapped = wrapWithCharacter(ch, json);
    if (wrapped === null) {
      missing.push(ch);
      continue;
    }

    fs.writeFileSync(outPath, wrapped, 'utf-8');
    covered.push(ch);
  }

  pruneStaleStrokeFiles(STROKES_OUT_DIR, new Set(covered));

  console.log(
    `[build-stroke-data] ${APP_LANG}: covered=${covered.length}, missing=${missing.length}, total=${distinctChars.length}`,
  );
  if (missing.length > 0) {
    console.warn(`[build-stroke-data] missing-from-MMH: ${missing.join(' ')}`);
  }
}

function collectDistinctChars(tileBases: string[]): string[] {
  const set = new Set<string>();
  for (const base of tileBases) {
    for (const ch of [...base.trim()]) {
      if (isHan(ch)) set.add(ch);
    }
  }
  return [...set].sort();
}

function isHan(ch: string): boolean {
  const cp = ch.codePointAt(0);
  if (cp === undefined) return false;
  return (
    (cp >= 0x4e00 && cp <= 0x9fff) ||
    (cp >= 0x3400 && cp <= 0x4dbf) ||
    (cp >= 0x20000 && cp <= 0x2a6df)
  );
}

async function fetchCharJson(ch: string): Promise<string | null> {
  const url = `${CDN_BASE}/${encodeURIComponent(ch)}.json`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.text();
  } catch (e) {
    console.warn(`[build-stroke-data] fetch failed for "${ch}": ${(e as Error).message}`);
    return null;
  }
}

/**
 * MMH JSON has shape `{ strokes: string[], medians: number[][][] }`. The
 * `StrokeData` type adds `character: string`. Inject it here so consumers
 * can roundtrip without a separate filename<->character mapping.
 */
function wrapWithCharacter(ch: string, mmhJson: string): string | null {
  let parsed: { strokes?: string[]; medians?: number[][][] };
  try {
    parsed = JSON.parse(mmhJson);
  } catch {
    return null;
  }
  if (!Array.isArray(parsed.strokes) || !Array.isArray(parsed.medians)) return null;
  if (parsed.strokes.length !== parsed.medians.length) return null;
  const out = { character: ch, strokes: parsed.strokes, medians: parsed.medians };
  return JSON.stringify(out);
}

function pruneStaleStrokeFiles(dir: string, keep: Set<string>): void {
  if (!fs.existsSync(dir)) return;
  for (const name of fs.readdirSync(dir)) {
    if (!name.endsWith('.json')) continue;
    const ch = name.replace(/\.json$/, '');
    if (!keep.has(ch)) fs.rmSync(path.join(dir, name));
  }
}

function ensureDir(dir: string): void {
  fs.mkdirSync(dir, { recursive: true });
}

function die(msg: string): never {
  console.error(`[build-stroke-data] ${msg}`);
  process.exit(1);
}
