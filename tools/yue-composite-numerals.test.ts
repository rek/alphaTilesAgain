/**
 * yue composite numerals — pack contract (real languages/yue pack).
 *
 * 二十 / 三十 / 五十 / 一百萬 / 二百零三 ship as word rows with Arabic-digit
 * images and NO word recording: pack speech plays them as a syllable chain
 * (see yue-speech.test.ts). This file pins the pack side: rows, images, and the
 * validator treating the missing recordings as warnings, not errors.
 *
 * Run: npx jest -c tools/jest.config.ts tools/yue-composite-numerals.test.ts
 */
import * as fs from 'fs';
import * as path from 'path';
import { validateLangPack } from '../libs/shared/util-lang-pack-validator/src/validateLangPack';
import { readRawFiles } from './_readRawFiles';
import { buildFileInventory } from './_buildFileInventory';

const LANG_DIR = path.join(__dirname, '../languages/yue');
const COMPOSITES: Record<string, string> = {
  zz_20: '二十',
  zz_30: '三十',
  zz_50: '五十',
  zz_1000000: '一百萬',
  zz_203: '二百零三',
};
const LWCS = Object.keys(COMPOSITES).sort();

describe('yue composite numerals (real pack)', () => {
  const report = validateLangPack({
    rawFiles: readRawFiles(LANG_DIR),
    fileInventory: buildFileInventory(LANG_DIR),
  });

  it('wordlist has each composite exactly once, LWC → LOP', () => {
    const rows = fs
      .readFileSync(path.join(LANG_DIR, 'aa_wordlist.txt'), 'utf8')
      .split(/\r?\n/)
      .slice(1)
      .map((l) => l.split('\t'));
    for (const [lwc, lop] of Object.entries(COMPOSITES)) {
      expect(rows.filter((r) => r[0] === lwc).map((r) => r[1])).toEqual([lop]);
    }
  });

  it('no composite is a tile row (they decompose into the single numerals)', () => {
    const bases = fs
      .readFileSync(path.join(LANG_DIR, 'aa_gametiles.txt'), 'utf8')
      .split(/\r?\n/)
      .slice(1)
      .map((l) => l.split('\t')[0]);
    for (const lop of Object.values(COMPOSITES)) {
      expect(bases).not.toContain(lop);
      for (const ch of lop) expect(bases).toContain(ch);
    }
  });

  it.each(LWCS)('%s has a non-empty Arabic-digit image', (lwc) => {
    const png = path.join(LANG_DIR, 'images/words', `${lwc}.png`);
    expect(fs.statSync(png).size).toBeGreaterThan(0);
  });

  it('validator: 0 errors', () => {
    expect(report.issues.filter((i) => i.severity === 'error')).toEqual([]);
  });

  it('validator: missing word audio only for the composites, as decomposable warnings', () => {
    const missing = report.issues.filter((i) => i.code === 'MISSING_WORD_AUDIO');
    expect(missing.map((i) => i.context?.['word']).sort()).toEqual(LWCS);
    for (const i of missing) {
      expect(i.severity).toBe('warning');
      expect(i.context?.['decomposable']).toBe(true);
    }
  });

  it('validator: no image issue for any composite', () => {
    const imageIssues = report.issues.filter(
      (i) =>
        (i.code === 'MISSING_WORD_IMAGE' || i.code === 'ORPHAN_IMAGE_FILE') &&
        LWCS.some((lwc) => i.message.includes(lwc)),
    );
    expect(imageIssues).toEqual([]);
  });
});
