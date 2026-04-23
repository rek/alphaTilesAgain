/**
 * rsync-lang-packs.ts
 *
 * Copies a language pack from $PUBLIC_LANG_ASSETS/<packDir>/res/ into
 * languages/<APP_LANG>/, normalizing the Android layout into the flat shape
 * described in docs/ARCHITECTURE.md S5.
 *
 * Audio classification uses aa_gametiles.txt / aa_wordlist.txt /
 * aa_syllables.txt via _lang-pack-mini-parser.ts -- not filename heuristics.
 *
 * Run: bun tools/rsync-lang-packs.ts
 * Or:  npx tsx tools/rsync-lang-packs.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  gameTileAudioNames,
  gameTileKeys,
  syllableAudioNames,
  wordListKeys,
} from './_lang-pack-mini-parser';

// ---------------------------------------------------------------------------
// Code -> pack directory mapping
// To add a new language pack, add an entry here and a profile in eas.json.
// ---------------------------------------------------------------------------
const PACK_MAP: Record<string, string> = {
  eng: 'engEnglish4',
  tpx: 'tpxTeocuitlapa',
  template: 'templateTemplate',
  yue: 'yueCantonese', // placeholder -- pack may not exist yet
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function die(msg: string): never {
  console.error(`\n[rsync-lang-packs] ERROR: ${msg}\n`);
  process.exit(1);
}

function ensureDir(dir: string): void {
  fs.mkdirSync(dir, { recursive: true });
}

function copyFile(src: string, dest: string): void {
  ensureDir(path.dirname(dest));
  fs.copyFileSync(src, dest);
}

/** Copy file, normalizing CRLF -> LF (for .txt files). */
function copyTextFile(src: string, dest: string): void {
  ensureDir(path.dirname(dest));
  const raw = fs.readFileSync(src, 'utf8');
  const normalized = raw.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  fs.writeFileSync(dest, normalized, 'utf8');
}

function listFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => {
    const stat = fs.statSync(path.join(dir, f));
    return stat.isFile();
  });
}

/** Remove a directory tree recursively, then recreate it. */
function clearDir(dir: string): void {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
  fs.mkdirSync(dir, { recursive: true });
}

// ---------------------------------------------------------------------------
// Audio classification
// ---------------------------------------------------------------------------

export type AudioClassification = {
  tiles: Set<string>;       // audio base names that are tile audio
  words: Set<string>;       // audio base names that are word audio (LWC keys)
  syllables: Set<string>;   // audio base names that are syllable audio
};

/**
 * Build audio classification sets from the three index files.
 * A file stem can appear in multiple categories (e.g. a tile audio that happens
 * to share a name with a word); the manifest will include it in all matching buckets.
 */
export function buildAudioClassification(rawDir: string): AudioClassification {
  const gametilesPath = path.join(rawDir, 'aa_gametiles.txt');
  const wordlistPath = path.join(rawDir, 'aa_wordlist.txt');
  const syllablesPath = path.join(rawDir, 'aa_syllables.txt');

  return {
    tiles: gameTileAudioNames(gametilesPath),
    words: wordListKeys(wordlistPath),
    syllables: syllableAudioNames(syllablesPath),
  };
}

/**
 * Given an mp3 base name (no extension), return which categories it belongs to.
 * Instruction audio (zzz_* prefix) always goes to instructions regardless of index.
 */
export function classifyAudio(
  stem: string,
  classification: AudioClassification,
): Array<'tiles' | 'words' | 'syllables' | 'instructions'> {
  if (stem.startsWith('zzz_')) return ['instructions'];

  const cats: Array<'tiles' | 'words' | 'syllables'> = [];
  if (classification.tiles.has(stem)) cats.push('tiles');
  if (classification.words.has(stem)) cats.push('words');
  if (classification.syllables.has(stem)) cats.push('syllables');
  return cats;
}

// ---------------------------------------------------------------------------
// Image classification
// ---------------------------------------------------------------------------

export type ImageClassification = {
  tileKeys: Set<string>;
  wordKeys: Set<string>;
};

export function buildImageClassification(rawDir: string): ImageClassification {
  const gametilesPath = path.join(rawDir, 'aa_gametiles.txt');
  const wordlistPath = path.join(rawDir, 'aa_wordlist.txt');
  return {
    tileKeys: gameTileKeys(gametilesPath),
    wordKeys: wordListKeys(wordlistPath),
  };
}

/**
 * Classify a drawable image by its stem.
 * zz_avatar* -> avatars, zz_avataricon* -> avataricons handled in caller.
 * Otherwise match against word keys (possibly with "2" suffix) then tile keys.
 */
export function classifyDrawable(
  stem: string,
  classification: ImageClassification,
): 'avatars' | 'avataricons' | 'words' | 'tiles' | 'other' {
  if (stem.startsWith('zz_avatar') && !stem.startsWith('zz_avataricon')) return 'avatars';
  if (stem.startsWith('zz_avataricon')) return 'avataricons';

  // Word images: "act" or "act2"
  const wordStem = stem.endsWith('2') ? stem.slice(0, -1) : stem;
  if (classification.wordKeys.has(stem) || classification.wordKeys.has(wordStem)) return 'words';

  if (classification.tileKeys.has(stem)) return 'tiles';
  return 'other';
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main(): void {
  // 1. Read env vars
  const lang = process.env.APP_LANG;
  const publicLangAssets = process.env.PUBLIC_LANG_ASSETS;

  if (!lang) {
    die(
      'APP_LANG env var is not set.\n' +
        'Set it to a supported language code (eng, tpx, template, yue).\n' +
        'See docs/GETTING_STARTED.md for setup instructions.',
    );
  }

  if (!publicLangAssets) {
    die(
      'PUBLIC_LANG_ASSETS env var is not set.\n' +
        'It must point at your local clone of the PublicLanguageAssets repo.\n' +
        'See docs/GETTING_STARTED.md for setup instructions.',
    );
  }

  // 2. Resolve pack directory
  const packDir = PACK_MAP[lang];
  if (!packDir) {
    const supported = Object.keys(PACK_MAP).join(', ');
    die(`Unknown APP_LANG "${lang}". Supported codes: ${supported}`);
  }

  const srcRes = path.join(publicLangAssets, packDir, 'res');
  if (!fs.existsSync(srcRes)) {
    const available = fs.existsSync(publicLangAssets)
      ? fs.readdirSync(publicLangAssets).join(', ')
      : '(directory not found)';
    die(
      `Pack not found at: ${srcRes}\n` +
        `Available packs under ${publicLangAssets}: ${available}`,
    );
  }

  const srcRaw = path.join(srcRes, 'raw');
  const srcFont = path.join(srcRes, 'font');
  const srcDrawableXxxhdpi = path.join(srcRes, 'drawable-xxxhdpi');
  const srcDrawable = path.join(srcRes, 'drawable');

  // 3. Clear + recreate target
  const repoRoot = path.resolve(__dirname, '..');
  const destLang = path.join(repoRoot, 'languages', lang);
  clearDir(destLang);
  console.log(`[rsync-lang-packs] ${packDir}/res/ -> languages/${lang}/`);

  // 4. aa_*.txt files (CRLF->LF, skip aa_notes.txt -- validator-only)
  const REQUIRED_TXT = [
    'aa_colors.txt', 'aa_games.txt', 'aa_gametiles.txt', 'aa_keyboard.txt',
    'aa_langinfo.txt', 'aa_names.txt', 'aa_resources.txt', 'aa_settings.txt',
    'aa_share.txt', 'aa_syllables.txt', 'aa_wordlist.txt',
  ];
  for (const fname of REQUIRED_TXT) {
    const src = path.join(srcRaw, fname);
    if (fs.existsSync(src)) {
      copyTextFile(src, path.join(destLang, fname));
    }
    // Missing required files flagged by validate-lang-pack, not here
  }

  // 5. Build audio + image classification from raw index files (using src, not dest)
  const audioClass = buildAudioClassification(srcRaw);
  const imageClass = buildImageClassification(srcRaw);

  // 6. Fonts
  const fontFiles = listFiles(srcFont);
  for (const fname of fontFiles) {
    if (fname.endsWith('.ttf') || fname.endsWith('.otf')) {
      copyFile(path.join(srcFont, fname), path.join(destLang, 'fonts', fname));
    }
  }

  // 7. Avatars + avataricons from drawable-xxxhdpi
  const xxxhdpiFiles = listFiles(srcDrawableXxxhdpi);
  for (const fname of xxxhdpiFiles) {
    const stem = path.basename(fname, path.extname(fname));
    if (stem.startsWith('zz_avataricon')) {
      copyFile(
        path.join(srcDrawableXxxhdpi, fname),
        path.join(destLang, 'images', 'avataricons', fname),
      );
    } else if (stem.startsWith('zz_avatar')) {
      copyFile(
        path.join(srcDrawableXxxhdpi, fname),
        path.join(destLang, 'images', 'avatars', fname),
      );
    }
  }

  // 8. Word + tile images from drawable/
  const drawableFiles = listFiles(srcDrawable);
  for (const fname of drawableFiles) {
    if (!fname.endsWith('.png') && !fname.endsWith('.jpg') && !fname.endsWith('.webp')) continue;
    const stem = path.basename(fname, path.extname(fname));
    const category = classifyDrawable(stem, imageClass);
    if (category === 'words' || category === 'tiles' || category === 'other') {
      copyFile(
        path.join(srcDrawable, fname),
        path.join(destLang, 'images', category, fname),
      );
    }
  }

  // 9. Audio from raw/ (mp3 only)
  const rawFiles = listFiles(srcRaw);
  let unclassifiedCount = 0;
  for (const fname of rawFiles) {
    if (!fname.endsWith('.mp3')) continue;
    const stem = path.basename(fname, '.mp3');
    const cats = classifyAudio(stem, audioClass);
    if (cats.length === 0) {
      unclassifiedCount++;
      continue; // orphan -- validator will flag it
    }
    for (const cat of cats) {
      copyFile(
        path.join(srcRaw, fname),
        path.join(destLang, 'audio', cat, fname),
      );
    }
  }
  if (unclassifiedCount > 0) {
    console.warn(
      `[rsync-lang-packs] ${unclassifiedCount} unclassified mp3(s) skipped (orphans -- full validator will flag them)`,
    );
  }

  // 10. Icon / splash overrides from pack root (if present)
  // Some packs place icon.png / splash.png at the pack root or in drawable
  for (const imageName of ['icon.png', 'splash.png']) {
    const candidates = [
      path.join(srcRes, '..', imageName),
      path.join(srcDrawable, imageName),
    ];
    for (const candidate of candidates) {
      if (fs.existsSync(candidate)) {
        copyFile(candidate, path.join(destLang, 'images', imageName));
        break;
      }
    }
  }

  // 11. Summary
  const audioTileCount = listFiles(path.join(destLang, 'audio', 'tiles')).length;
  const audioWordCount = listFiles(path.join(destLang, 'audio', 'words')).length;
  const audioSyllCount = listFiles(path.join(destLang, 'audio', 'syllables')).length;
  const audioInstrCount = listFiles(path.join(destLang, 'audio', 'instructions')).length;
  const wordImgCount = listFiles(path.join(destLang, 'images', 'words')).length;
  const tileImgCount = listFiles(path.join(destLang, 'images', 'tiles')).length;
  const fontCount = listFiles(path.join(destLang, 'fonts')).length;

  console.log(
    `[rsync-lang-packs] done:\n` +
      `  txt files: ${REQUIRED_TXT.filter((f) => fs.existsSync(path.join(destLang, f))).length}\n` +
      `  fonts: ${fontCount}\n` +
      `  audio/tiles: ${audioTileCount}, audio/words: ${audioWordCount}, ` +
      `audio/syllables: ${audioSyllCount}, audio/instructions: ${audioInstrCount}\n` +
      `  images/words: ${wordImgCount}, images/tiles: ${tileImgCount}`,
  );
}

// Guard: only run when invoked directly (not when imported for tests)
if (require.main === module || process.argv[1]?.includes('rsync-lang-packs')) {
  main();
}
