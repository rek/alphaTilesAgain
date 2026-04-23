/**
 * validate-lang-pack.ts — full validator CLI
 *
 * Replaces the structural-only placeholder. Uses the real validator from
 * `@alphaTiles/util-lang-pack-validator`.
 *
 * Usage:
 *   bun tools/validate-lang-pack.ts                  # uses APP_LANG env var
 *   bun tools/validate-lang-pack.ts --fixture eng,tpx,template
 *   bun tools/validate-lang-pack.ts --json report.json
 *   bun tools/validate-lang-pack.ts --only-errors
 *
 * Design: openspec/changes/lang-pack-validator/design.md §D6
 */

import * as fs from 'fs';
import * as path from 'path';
import { validateLangPack as runValidator } from '../libs/shared/util-lang-pack-validator/src/validateLangPack';
import { formatReportHuman } from '../libs/shared/util-lang-pack-validator/src/formatReportHuman';
import { formatReportJson } from '../libs/shared/util-lang-pack-validator/src/formatReportJson';
import { readRawFiles } from './_readRawFiles';
import { buildFileInventory } from './_buildFileInventory';

// ---------------------------------------------------------------------------
// Backward-compat shim — preserves the old export for existing tests
// ---------------------------------------------------------------------------

export type ValidationError = {
  code: string;
  message: string;
};

export type ValidationResult = {
  ok: boolean;
  errors: ValidationError[];
};

const REQUIRED_TXT_FILES = [
  'aa_colors.txt', 'aa_games.txt', 'aa_gametiles.txt', 'aa_keyboard.txt',
  'aa_langinfo.txt', 'aa_names.txt', 'aa_resources.txt', 'aa_settings.txt',
  'aa_share.txt', 'aa_syllables.txt', 'aa_wordlist.txt',
];

function listFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => {
    const stat = fs.statSync(path.join(dir, f));
    return stat.isFile();
  });
}

/**
 * Structural-only validation for backward compatibility with existing tests.
 * For semantic validation use `runValidator` (the real validator).
 */
export function validateLangPack(langDir: string): ValidationResult {
  const errors: ValidationError[] = [];

  if (!fs.existsSync(langDir) || !fs.statSync(langDir).isDirectory()) {
    errors.push({ code: 'PACK_DIR_MISSING', message: `Pack directory not found: ${langDir}` });
    return { ok: false, errors };
  }

  for (const fname of REQUIRED_TXT_FILES) {
    if (!fs.existsSync(path.join(langDir, fname))) {
      errors.push({ code: 'REQUIRED_TXT_MISSING', message: `Required file missing: ${fname}` });
    }
  }

  const fonts = listFiles(path.join(langDir, 'fonts')).filter(
    (f) => f.endsWith('.ttf') || f.endsWith('.otf'),
  );
  if (fonts.length === 0) {
    errors.push({ code: 'NO_FONT', message: 'fonts/ must contain at least one .ttf or .otf file' });
  }

  const avatars = listFiles(path.join(langDir, 'images', 'avatars')).filter(
    (f) => f.startsWith('zz_avatar') && !f.startsWith('zz_avataricon'),
  );
  if (avatars.length !== 12) {
    errors.push({
      code: 'AVATAR_COUNT_WRONG',
      message: `images/avatars/ must have exactly 12 zz_avatar*.png files (found ${avatars.length})`,
    });
  }

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
// CLI argument parsing
// ---------------------------------------------------------------------------

interface CliArgs {
  fixture: string[] | null;
  json: string | null;
  onlyErrors: boolean;
}

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = { fixture: null, json: null, onlyErrors: false };
  let i = 2; // skip 'bun' and script path
  while (i < argv.length) {
    const arg = argv[i];
    if (arg === '--fixture' && argv[i + 1]) {
      args.fixture = argv[i + 1].split(',').map((c) => c.trim()).filter(Boolean);
      i += 2;
    } else if (arg === '--json' && argv[i + 1]) {
      args.json = argv[i + 1];
      i += 2;
    } else if (arg === '--only-errors') {
      args.onlyErrors = true;
      i++;
    } else {
      i++;
    }
  }
  return args;
}

// ---------------------------------------------------------------------------
// CLI entry point
// ---------------------------------------------------------------------------

function die(msg: string): never {
  console.error(`\n[validate-lang-pack] ERROR: ${msg}\n`);
  process.exit(1);
}

async function main(): Promise<void> {
  const cliArgs = parseArgs(process.argv);

  // Resolve which pack codes to validate
  const codes: string[] = cliArgs.fixture
    ?? (process.env.APP_LANG ? [process.env.APP_LANG] : null)
    ?? die('APP_LANG env var is not set and --fixture was not specified.\nSee docs/GETTING_STARTED.md for setup instructions.');

  const repoRoot = path.resolve(__dirname, '..');
  let totalErrors = 0;
  const jsonReports: ReturnType<typeof formatReportJson>[] = [];

  for (const code of codes) {
    const langDir = path.join(repoRoot, 'languages', code);

    if (!fs.existsSync(langDir)) {
      console.error(`[validate-lang-pack] ERROR: languages/${code}/ does not exist`);
      totalErrors++;
      continue;
    }

    let rawFiles: Record<string, string>;
    let fileInventory: ReturnType<typeof buildFileInventory>;

    try {
      rawFiles = readRawFiles(langDir);
      fileInventory = buildFileInventory(langDir);
    } catch (e) {
      console.error(`[validate-lang-pack] ERROR reading ${code}: ${(e as Error).message}`);
      totalErrors++;
      continue;
    }

    const report = runValidator({ rawFiles, fileInventory });
    totalErrors += report.counts.error;

    if (cliArgs.json) {
      jsonReports.push(formatReportJson(code, report));
    } else {
      let output = formatReportHuman(code, report);
      if (cliArgs.onlyErrors) {
        // Filter to only show error lines in human output
        const lines = output.split('\n');
        const filtered = lines.filter(
          (l) => l.startsWith('===') || l.startsWith('--- ERROR') || l.startsWith('  ') || l.startsWith('Totals'),
        );
        output = filtered.join('\n');
      }
      process.stdout.write(output);
    }
  }

  if (cliArgs.json) {
    const combined = jsonReports.length === 1
      ? jsonReports[0]
      : JSON.stringify(JSON.parse(`[${jsonReports.join(',')}]`), null, 2);
    fs.writeFileSync(cliArgs.json, combined, 'utf8');
    console.log(`[validate-lang-pack] JSON report written to: ${cliArgs.json}`);
  }

  process.exit(totalErrors > 0 ? 1 : 0);
}

if (require.main === module || process.argv[1]?.includes('validate-lang-pack')) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
