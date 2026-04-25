/**
 * generate-lang-manifest.ts
 *
 * Scans languages/<APP_LANG>/ and emits
 * apps/alphaTiles/src/generated/langManifest.ts.
 *
 * The generated file:
 *  - Inlines aa_*.txt contents as raw string literals (no Metro transformer needed)
 *  - Emits static require() literals for fonts, images, audio
 *  - Uses keys from aa_*.txt index files (not filesystem scanning) for audio/image maps
 *  - Is rewritten from scratch every run
 *
 * See design.md SD2 for the full shape spec.
 *
 * Run: bun tools/generate-lang-manifest.ts
 * Or:  npx tsx tools/generate-lang-manifest.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { parseGametiles, parseSyllables, parseWordlist } from '../libs/shared/util-lang-pack-parser/src';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function die(msg: string): never {
  console.error(`\n[generate-lang-manifest] ERROR: ${msg}\n`);
  process.exit(1);
}

function listFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => fs.statSync(path.join(dir, f)).isFile());
}

/**
 * Escape a raw string for inclusion as a JS template-literal value.
 * We use JSON.stringify which produces a double-quoted string with all special
 * chars escaped -- then strip the outer quotes to get the inner content, or
 * just use JSON.stringify directly as the value (it's valid TS).
 */
function escapeStr(s: string): string {
  return JSON.stringify(s);
}

/**
 * Compute the relative path from the generated file's directory to the
 * languages/<lang>/ tree, suitable for use in require() calls.
 *
 * Generated file: libs/alphaTiles/data-language-assets/src/generated/langManifest.ts
 * Languages dir:  languages/<lang>/
 * -> ../../../../../languages/<lang>/
 */
function langRelPath(lang: string, ...parts: string[]): string {
  return ['../../../../../languages', lang, ...parts].join('/');
}

// ---------------------------------------------------------------------------
// Font resolution
// ---------------------------------------------------------------------------

type FontEntries = {
  primary: string | null;
  primaryBold: string | null;
  all: string[];
};

function resolveFonts(fontsDir: string): FontEntries {
  const files = listFiles(fontsDir).filter((f) => f.endsWith('.ttf') || f.endsWith('.otf'));
  if (files.length === 0) return { primary: null, primaryBold: null, all: [] };

  // Heuristic: bold font contains "_b" or "bold" in the stem (case-insensitive).
  // Primary = non-bold, or first file if ambiguous.
  const boldPattern = /(_b\.|bold)/i;
  const boldFiles = files.filter((f) => boldPattern.test(f));
  const regularFiles = files.filter((f) => !boldPattern.test(f));

  const primary = regularFiles[0] ?? files[0];
  const primaryBold = boldFiles[0] ?? null;

  return { primary, primaryBold, all: files };
}

// ---------------------------------------------------------------------------
// Code generation helpers
// ---------------------------------------------------------------------------

function requireLiteral(lang: string, ...pathParts: string[]): string {
  return `require('${langRelPath(lang, ...pathParts)}')`;
}

function requireAppAsset(...pathParts: string[]): string {
  return `require('../../assets/${pathParts.join('/')}')`;
}

// ---------------------------------------------------------------------------
// Main generation
// ---------------------------------------------------------------------------

function generateManifest(lang: string, langDir: string, outPath: string): void {
  const rawDir = langDir; // txt files are at the root of langDir after rsync

  // --- Inline aa_*.txt files ---
  const TXT_NAMES = [
    'aa_colors', 'aa_games', 'aa_gametiles', 'aa_keyboard', 'aa_langinfo',
    'aa_names', 'aa_resources', 'aa_settings', 'aa_share', 'aa_syllables', 'aa_wordlist',
  ];
  const rawFileEntries: string[] = [];
  for (const name of TXT_NAMES) {
    const filePath = path.join(rawDir, `${name}.txt`);
    const content = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '';
    rawFileEntries.push(`    ${escapeStr(name)}: ${escapeStr(content)},`);
  }

  // --- Fonts ---
  const fontsDir = path.join(langDir, 'fonts');
  const fonts = resolveFonts(fontsDir);
  const fontLines: string[] = [];
  if (fonts.primary) {
    fontLines.push(`    primary: ${requireLiteral(lang, 'fonts', fonts.primary)},`);
  } else {
    fontLines.push(`    primary: null,`);
  }
  if (fonts.primaryBold) {
    fontLines.push(`    primaryBold: ${requireLiteral(lang, 'fonts', fonts.primaryBold)},`);
  } else {
    fontLines.push(`    primaryBold: null,`);
  }
  if (fonts.all.length > 2 || (fonts.all.length > 0 && !fonts.primary)) {
    // Extra fonts -- emit them as named entries
    for (const f of fonts.all) {
      const key = path.basename(f, path.extname(f));
      fontLines.push(`    ${escapeStr(key)}: ${requireLiteral(lang, 'fonts', f)},`);
    }
  }

  // --- Images: avatars ---
  const avatarsDir = path.join(langDir, 'images', 'avatars');
  const avatarFiles = listFiles(avatarsDir)
    .filter((f) => f.startsWith('zz_avatar') && !f.startsWith('zz_avataricon'))
    .sort();
  const avatarLines = avatarFiles.map(
    (f) => `      ${requireLiteral(lang, 'images', 'avatars', f)},`,
  );

  // --- Images: avataricons ---
  const avatariconsDir = path.join(langDir, 'images', 'avataricons');
  const avatariconsFiles = listFiles(avatariconsDir)
    .filter((f) => f.startsWith('zz_avataricon'))
    .sort();
  const avatariconsLines = avatariconsFiles.map(
    (f) => `      ${requireLiteral(lang, 'images', 'avataricons', f)},`,
  );

  // --- Images: tiles (keyed by tile key from aa_gametiles.txt) ---
  const tilesImgDir = path.join(langDir, 'images', 'tiles');
  const tileImgFiles = new Set(listFiles(tilesImgDir));
  const gametilesFile = path.join(rawDir, 'aa_gametiles.txt');
  const gametilesRows = fs.existsSync(gametilesFile)
    ? parseGametiles(fs.readFileSync(gametilesFile, 'utf8')).rows
    : [];
  const tileKeys = new Set(gametilesRows.map((r) => r.base).filter(Boolean));
  const tileImgLines: string[] = [];
  for (const key of [...tileKeys].sort()) {
    // Try common extensions
    for (const ext of ['.png', '.jpg', '.webp']) {
      const fname = `${key}${ext}`;
      if (tileImgFiles.has(fname)) {
        tileImgLines.push(
          `      ${escapeStr(key)}: ${requireLiteral(lang, 'images', 'tiles', fname)},`,
        );
        break;
      }
    }
  }

  // --- Images: words (keyed by word LWC key from aa_wordlist.txt) ---
  const wordsImgDir = path.join(langDir, 'images', 'words');
  const wordImgFiles = new Set(listFiles(wordsImgDir));
  const wordlistFile = path.join(rawDir, 'aa_wordlist.txt');
  const wordlistRows = fs.existsSync(wordlistFile)
    ? parseWordlist(fs.readFileSync(wordlistFile, 'utf8')).rows
    : [];
  const wordKeys = new Set(wordlistRows.map((r) => r.wordInLWC).filter(Boolean));
  const wordImgLines: string[] = [];
  const wordImg2Lines: string[] = [];
  for (const key of [...wordKeys].sort()) {
    for (const ext of ['.png', '.jpg', '.webp']) {
      const fname = `${key}${ext}`;
      if (wordImgFiles.has(fname)) {
        wordImgLines.push(
          `      ${escapeStr(key)}: ${requireLiteral(lang, 'images', 'words', fname)},`,
        );
        break;
      }
    }
    // Distractor variant
    for (const ext of ['.png', '.jpg', '.webp']) {
      const fname2 = `${key}2${ext}`;
      if (wordImgFiles.has(fname2)) {
        wordImg2Lines.push(
          `      ${escapeStr(key)}: ${requireLiteral(lang, 'images', 'words', fname2)},`,
        );
        break;
      }
    }
  }

  // --- Images: icon / splash ---
  const packIcon = fs.existsSync(path.join(langDir, 'images', 'icon.png'));
  const packSplash = fs.existsSync(path.join(langDir, 'images', 'splash.png'));
  const iconRequire = packIcon
    ? requireLiteral(lang, 'images', 'icon.png')
    : requireAppAsset('images', 'icon.png');
  const splashRequire = packSplash
    ? requireLiteral(lang, 'images', 'splash.png')
    : requireAppAsset('images', 'splash-icon.png');

  // --- Audio: tiles ---
  const audioTilesDir = path.join(langDir, 'audio', 'tiles');
  const audioTileFiles = new Set(listFiles(audioTilesDir));
  const TILE_AUDIO_INVALID = new Set(['none', 'x', 'zz_no_audio_needed']);
  const tileAudioNames = new Set<string>();
  for (const row of gametilesRows) {
    for (const name of [row.audioName, row.audioNameB, row.audioNameC]) {
      if (name && !TILE_AUDIO_INVALID.has(name.toLowerCase())) tileAudioNames.add(name);
    }
  }
  const audioTileLines: string[] = [];
  for (const audioName of [...tileAudioNames].sort()) {
    const fname = `${audioName}.mp3`;
    if (audioTileFiles.has(fname)) {
      audioTileLines.push(
        `      ${escapeStr(audioName)}: ${requireLiteral(lang, 'audio', 'tiles', fname)},`,
      );
    }
  }

  // --- Audio: words ---
  const audioWordsDir = path.join(langDir, 'audio', 'words');
  const audioWordFiles = new Set(listFiles(audioWordsDir));
  const audioWordLines: string[] = [];
  for (const key of [...wordKeys].sort()) {
    const fname = `${key}.mp3`;
    if (audioWordFiles.has(fname)) {
      audioWordLines.push(
        `      ${escapeStr(key)}: ${requireLiteral(lang, 'audio', 'words', fname)},`,
      );
    }
  }

  // --- Audio: syllables ---
  const audioSyllDir = path.join(langDir, 'audio', 'syllables');
  const audioSyllFiles = new Set(listFiles(audioSyllDir));
  const syllablesFile = path.join(rawDir, 'aa_syllables.txt');
  const syllEntries = fs.existsSync(syllablesFile)
    ? parseSyllables(fs.readFileSync(syllablesFile, 'utf8')).rows
    : [];
  const audioSyllLines: string[] = [];
  for (const entry of syllEntries) {
    if (!entry.audioName) continue;
    const fname = `${entry.audioName}.mp3`;
    if (audioSyllFiles.has(fname)) {
      audioSyllLines.push(
        `      ${escapeStr(entry.audioName)}: ${requireLiteral(lang, 'audio', 'syllables', fname)},`,
      );
    }
  }

  // --- Audio: instructions ---
  const audioInstrDir = path.join(langDir, 'audio', 'instructions');
  const instrFiles = listFiles(audioInstrDir).filter((f) => f.endsWith('.mp3')).sort();
  const audioInstrLines = instrFiles.map((f) => {
    const key = path.basename(f, '.mp3');
    return `      ${escapeStr(key)}: ${requireLiteral(lang, 'audio', 'instructions', f)},`;
  });

  // ---------------------------------------------------------------------------
  // Emit
  // ---------------------------------------------------------------------------

  const lines: string[] = [
    `/**`,
    ` * langManifest.ts -- AUTO-GENERATED. DO NOT EDIT.`,
    ` * Generated by tools/generate-lang-manifest.ts for APP_LANG=${lang}.`,
    ` * Regenerated on every prebuild; see apps/alphaTiles/project.json.`,
    ` */`,
    ``,
    `export const langManifest = {`,
    `  code: ${escapeStr(lang)},`,
    `  rawFiles: {`,
    ...rawFileEntries,
    `  },`,
    `  fonts: {`,
    ...fontLines,
    `  },`,
    `  images: {`,
    `    avatars: [`,
    ...avatarLines,
    `    ],`,
    `    avataricons: [`,
    ...avatariconsLines,
    `    ],`,
    `    tiles: {`,
    ...tileImgLines,
    `    },`,
    `    words: {`,
    ...wordImgLines,
    `    },`,
    `    words2: {`,
    ...wordImg2Lines,
    `    },`,
    `    icon: ${iconRequire},`,
    `    splash: ${splashRequire},`,
    `  },`,
    `  audio: {`,
    `    tiles: {`,
    ...audioTileLines,
    `    },`,
    `    words: {`,
    ...audioWordLines,
    `    },`,
    `    syllables: {`,
    ...audioSyllLines,
    `    },`,
    `    instructions: {`,
    ...audioInstrLines,
    `    },`,
    `  },`,
    `} as const;`,
    ``,
    `export type LangManifest = typeof langManifest;`,
    ``,
  ];

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, lines.join('\n'), 'utf8');

  console.log(`[generate-lang-manifest] Wrote ${outPath}`);
  console.log(
    `  rawFiles: ${TXT_NAMES.length}, fonts: ${fonts.all.length}, ` +
      `audio.tiles: ${audioTileLines.length}, audio.words: ${audioWordLines.length}, ` +
      `audio.syllables: ${audioSyllLines.length}, audio.instructions: ${audioInstrLines.length}, ` +
      `images.words: ${wordImgLines.length}, images.tiles: ${tileImgLines.length}`,
  );
}

// ---------------------------------------------------------------------------
// CLI entry point
// ---------------------------------------------------------------------------

function main(): void {
  const lang = process.env.APP_LANG;
  if (!lang) {
    die(
      'APP_LANG env var is not set.\n' +
        'See docs/GETTING_STARTED.md for setup instructions.',
    );
  }

  const repoRoot = path.resolve(__dirname, '..');
  const langDir = path.join(repoRoot, 'languages', lang);

  if (!fs.existsSync(langDir)) {
    die(
      `languages/${lang}/ not found. Run rsync-lang-packs first:\n` +
        `  APP_LANG=${lang} ./nx rsync-lang-pack alphaTiles`,
    );
  }

  const outPath = path.join(
    repoRoot,
    'libs', 'alphaTiles', 'data-language-assets', 'src', 'generated', 'langManifest.ts',
  );

  generateManifest(lang, langDir, outPath);
}

if (require.main === module || process.argv[1]?.includes('generate-lang-manifest')) {
  main();
}
