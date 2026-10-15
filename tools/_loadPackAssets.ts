/**
 * Test helper: load a REAL languages/<code> pack through the production
 * binder (`loadLangPack`) with fake Metro handles (1, 2, … per file, sorted)
 * and real file listings — what the app binds at boot, minus the bundler.
 *
 * `strokes: 'real'` parses strokes/*.json; `'stub'` binds every character to a
 * one-stroke placeholder (enough for code that only needs the key set).
 */
import * as fs from 'fs';
import * as path from 'path';
import { loadLangPack } from '../libs/alphaTiles/data-language-pack/src/loadLangPack';
import type { LangAssets } from '../libs/alphaTiles/data-language-pack/src/LangAssets';
import { readRawFiles } from './_readRawFiles';

export function loadPackAssets(code: string, { strokes = 'real' }: { strokes?: 'real' | 'stub' } = {}): LangAssets {
  const dir = path.join(__dirname, '../languages', code);

  const stems = (sub: string): Record<string, number> => {
    const d = path.join(dir, sub);
    const out: Record<string, number> = {};
    if (!fs.existsSync(d)) return out;
    let n = 1;
    for (const f of fs.readdirSync(d).sort()) {
      if (!fs.statSync(path.join(d, f)).isFile()) continue;
      out[f.replace(/\.[^.]+$/, '')] = n++;
    }
    return out;
  };

  const strokeDir = path.join(dir, 'strokes');
  const strokeData: Record<string, unknown> = {};
  if (fs.existsSync(strokeDir)) {
    for (const f of fs.readdirSync(strokeDir).filter((x) => x.endsWith('.json'))) {
      strokeData[f.replace(/\.json$/, '')] =
        strokes === 'real'
          ? JSON.parse(fs.readFileSync(path.join(strokeDir, f), 'utf8'))
          : { strokes: ['M0 0'], medians: [] };
    }
  }

  return loadLangPack({
    code,
    rawFiles: readRawFiles(dir),
    fonts: { primary: 1, primaryBold: null },
    images: {
      icon: 1,
      splash: 1,
      avatars: Object.values(stems('images/avatars')),
      avataricons: Object.values(stems('images/avataricons')),
      tiles: {},
      words: stems('images/words'),
    },
    audio: {
      tiles: stems('audio/tiles'),
      words: stems('audio/words'),
      syllables: stems('audio/syllables'),
      instructions: stems('audio/instructions'),
    },
    strokes: strokeData as LangAssets['strokes'],
  });
}
