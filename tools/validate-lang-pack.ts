/**
 * validate-lang-pack.ts -- PLACEHOLDER
 *
 * Checks structural presence of required files in languages/<APP_LANG>/.
 * Does NOT perform semantic validation (content correctness, column counts,
 * cross-file consistency, orphan detection, etc.).
 *
 * This placeholder will be replaced by a call to the real validator once the
 * `lang-pack-validator` change lands. See openspec/changes/lang-pack-validator/.
 *
 * Run: bun tools/validate-lang-pack.ts
 * Or:  npx tsx tools/validate-lang-pack.ts
 */

import * as fs from 'fs';
import * as path from 'path';

// ---------------------------------------------------------------------------
// Validation logic (exported for unit tests)
// ---------------------------------------------------------------------------

export type ValidationError = {
  code: string;
  message: string;
};

export type ValidationResult = {
  ok: boolean;
  errors: ValidationError[];
};

/** Required aa_*.txt files (aa_notes.txt is optional -- validator-only). */
const REQUIRED_TXT_FILES = [
  'aa_colors.txt',
  'aa_games.txt',
  'aa_gametiles.txt',
  'aa_keyboard.txt',
  'aa_langinfo.txt',
  'aa_names.txt',
  'aa_resources.txt',
  'aa_settings.txt',
  'aa_share.txt',
  'aa_syllables.txt',
  'aa_wordlist.txt',
];

function listFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => {
    const stat = fs.statSync(path.join(dir, f));
    return stat.isFile();
  });
}

export function validateLangPack(langDir: string): ValidationResult {
  const errors: ValidationError[] = [];

  // 1. Pack directory must exist
  if (!fs.existsSync(langDir) || !fs.statSync(langDir).isDirectory()) {
    errors.push({
      code: 'PACK_DIR_MISSING',
      message: `Pack directory not found: ${langDir}`,
    });
    // Can't check anything else without the directory
    return { ok: false, errors };
  }

  // 2. Required txt files
  for (const fname of REQUIRED_TXT_FILES) {
    const full = path.join(langDir, fname);
    if (!fs.existsSync(full)) {
      errors.push({
        code: 'REQUIRED_TXT_MISSING',
        message: `Required file missing: ${fname}`,
      });
    }
  }

  // 3. At least one font
  const fonts = listFiles(path.join(langDir, 'fonts')).filter(
    (f) => f.endsWith('.ttf') || f.endsWith('.otf'),
  );
  if (fonts.length === 0) {
    errors.push({
      code: 'NO_FONT',
      message: 'fonts/ must contain at least one .ttf or .otf file',
    });
  }

  // 4. Exactly 12 avatars
  const avatars = listFiles(path.join(langDir, 'images', 'avatars')).filter(
    (f) => f.startsWith('zz_avatar') && !f.startsWith('zz_avataricon'),
  );
  if (avatars.length !== 12) {
    errors.push({
      code: 'AVATAR_COUNT_WRONG',
      message: `images/avatars/ must have exactly 12 zz_avatar*.png files (found ${avatars.length})`,
    });
  }

  // 5. Exactly 12 avataricons
  const avataricons = listFiles(path.join(langDir, 'images', 'avataricons')).filter(
    (f) => f.startsWith('zz_avataricon'),
  );
  if (avataricons.length !== 12) {
    errors.push({
      code: 'AVATARICON_COUNT_WRONG',
      message: `images/avataricons/ must have exactly 12 zz_avataricon*.png files (found ${avataricons.length})`,
    });
  }

  return { ok: errors.length === 0, errors };
}

// ---------------------------------------------------------------------------
// CLI entry point
// ---------------------------------------------------------------------------

function die(msg: string): never {
  console.error(`\n[validate-lang-pack] ERROR: ${msg}\n`);
  process.exit(1);
}

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

  console.log(`[validate-lang-pack] Checking languages/${lang}/ ...`);

  const result = validateLangPack(langDir);

  if (result.ok) {
    console.log(`[validate-lang-pack] OK -- structural checks passed for "${lang}"`);
    process.exit(0);
  }

  console.error(`[validate-lang-pack] FAILED -- ${result.errors.length} error(s):`);
  for (const err of result.errors) {
    console.error(`  [${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (require.main === module || process.argv[1]?.includes('validate-lang-pack')) {
  main();
}
