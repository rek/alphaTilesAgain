/**
 * build-numeral-images.ts
 *
 * One-off generator that renders the 12 Cantonese numeral reference images for
 * the yue pack — Arabic digits on a plain background. See
 * openspec/changes/yue-numerals-game/design.md § D5 for rationale.
 *
 * Output: languages/yue/images/words/zz_<digit>.png
 *
 * Run: npx tsx tools/build-numeral-images.ts
 */

import { createCanvas } from 'canvas';
import * as fs from 'fs';
import * as path from 'path';

const REPO_ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(REPO_ROOT, 'languages', 'yue', 'images', 'words');

const SIZE = 512;
const BG = '#FFFFFF';
const FG = '#1565C0';

// (lwc, label) pairs. Lwc matches aa_wordlist.txt rows.
const NUMERALS: ReadonlyArray<readonly [string, string]> = [
  ['zz_0', '0'],
  ['zz_1', '1'],
  ['zz_2', '2'],
  ['zz_3', '3'],
  ['zz_4', '4'],
  ['zz_5', '5'],
  ['zz_6', '6'],
  ['zz_7', '7'],
  ['zz_8', '8'],
  ['zz_9', '9'],
  ['zz_10', '10'],
  ['zz_100', '100'],
  ['zz_1000', '1000'],
  ['zz_10000', '10000'],
  // Composites (yue-composite-numerals smoke-test batch)
  ['zz_20', '20'],
  ['zz_30', '30'],
  ['zz_50', '50'],
  ['zz_203', '203'],
  ['zz_1000000', '1000000'],
];

function fontPxForLabel(label: string): number {
  // Wider labels need a smaller font so they fit with margin.
  if (label.length <= 1) return 360;
  if (label.length <= 2) return 280;
  if (label.length <= 3) return 220;
  if (label.length <= 4) return 170;
  if (label.length <= 5) return 140;
  if (label.length <= 6) return 115;
  return 100;
}

function renderOne(lwc: string, label: string): void {
  const canvas = createCanvas(SIZE, SIZE);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, SIZE, SIZE);

  const fontPx = fontPxForLabel(label);
  ctx.fillStyle = FG;
  ctx.font = `bold ${fontPx}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.fillText(label, SIZE / 2, SIZE / 2);

  const outPath = path.join(OUT_DIR, `${lwc}.png`);
  fs.writeFileSync(outPath, canvas.toBuffer('image/png'));
  console.log(`wrote ${path.relative(REPO_ROOT, outPath)}`);
}

function main(): void {
  if (!fs.existsSync(OUT_DIR)) {
    console.error(`output dir missing: ${OUT_DIR}`);
    process.exit(1);
  }
  for (const [lwc, label] of NUMERALS) {
    renderOne(lwc, label);
  }
  console.log(`done — ${NUMERALS.length} images written`);
}

main();
