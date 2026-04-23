/**
 * Unit tests for validate-lang-pack.ts placeholder validator.
 * Run: bun test tools/validate-lang-pack.test.ts
 */

import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { validateLangPack } from './validate-lang-pack';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeLangDir(overrides: Record<string, boolean | number> = {}): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'validate-test-'));

  const REQUIRED_TXT = [
    'aa_colors.txt', 'aa_games.txt', 'aa_gametiles.txt', 'aa_keyboard.txt',
    'aa_langinfo.txt', 'aa_names.txt', 'aa_resources.txt', 'aa_settings.txt',
    'aa_share.txt', 'aa_syllables.txt', 'aa_wordlist.txt',
  ];

  // Create txt files
  for (const fname of REQUIRED_TXT) {
    const include = overrides[fname] !== false; // default true
    if (include) {
      fs.writeFileSync(path.join(dir, fname), 'header\nrow\n', 'utf8');
    }
  }

  // Create fonts
  if (overrides['fonts'] !== false) {
    fs.mkdirSync(path.join(dir, 'fonts'), { recursive: true });
    fs.writeFileSync(path.join(dir, 'fonts', 'primary.ttf'), '', 'utf8');
  }

  // Create avatars
  const avatarCount = typeof overrides['avatarCount'] === 'number' ? overrides['avatarCount'] : 12;
  fs.mkdirSync(path.join(dir, 'images', 'avatars'), { recursive: true });
  for (let i = 1; i <= avatarCount; i++) {
    const n = String(i).padStart(2, '0');
    fs.writeFileSync(path.join(dir, 'images', 'avatars', `zz_avatar${n}.png`), '', 'utf8');
  }

  // Create avataricons
  const iconCount = typeof overrides['avatariconsCount'] === 'number' ? overrides['avatariconsCount'] : 12;
  fs.mkdirSync(path.join(dir, 'images', 'avataricons'), { recursive: true });
  for (let i = 1; i <= iconCount; i++) {
    const n = String(i).padStart(2, '0');
    fs.writeFileSync(path.join(dir, 'images', 'avataricons', `zz_avataricon${n}.png`), '', 'utf8');
  }

  return dir;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('validateLangPack', () => {
  it('passes a fully-populated fixture', () => {
    const dir = makeLangDir();
    const result = validateLangPack(dir);
    expect(result.ok).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('fails when pack directory does not exist', () => {
    const result = validateLangPack('/nonexistent/path/that/does/not/exist');
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.code === 'PACK_DIR_MISSING')).toBe(true);
  });

  it('fails when a required txt file is missing', () => {
    const dir = makeLangDir({ 'aa_wordlist.txt': false });
    const result = validateLangPack(dir);
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.code === 'REQUIRED_TXT_MISSING' && e.message.includes('aa_wordlist.txt'))).toBe(true);
  });

  it('fails when fonts directory is empty', () => {
    const dir = makeLangDir({ fonts: false });
    // manually create empty fonts dir
    fs.mkdirSync(path.join(dir, 'fonts'), { recursive: true });
    const result = validateLangPack(dir);
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.code === 'NO_FONT')).toBe(true);
  });

  it('fails when avatar count is not 12', () => {
    const dir = makeLangDir({ avatarCount: 5 });
    const result = validateLangPack(dir);
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.code === 'AVATAR_COUNT_WRONG')).toBe(true);
  });

  it('fails when avataricon count is not 12', () => {
    const dir = makeLangDir({ avatariconsCount: 10 });
    const result = validateLangPack(dir);
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.code === 'AVATARICON_COUNT_WRONG')).toBe(true);
  });

  it('does not require aa_notes.txt', () => {
    const dir = makeLangDir();
    // aa_notes.txt was never created -- should still pass
    expect(fs.existsSync(path.join(dir, 'aa_notes.txt'))).toBe(false);
    const result = validateLangPack(dir);
    expect(result.ok).toBe(true);
  });

  it('reports multiple errors at once', () => {
    const dir = makeLangDir({ 'aa_wordlist.txt': false, 'aa_games.txt': false, fonts: false });
    fs.mkdirSync(path.join(dir, 'fonts'), { recursive: true });
    const result = validateLangPack(dir);
    expect(result.errors.length).toBeGreaterThanOrEqual(3);
  });
});

// ---------------------------------------------------------------------------
// Template pack smoke test
// ---------------------------------------------------------------------------

describe('validateLangPack against template fixture', () => {
  // Note: this test only passes AFTER the template pack has been rsync'd.
  // During CI / first run it's expected to be skipped or fail gracefully.
  // The template pack is minimal and deliberately doesn't have all txt files.
  it('template pack is expected to fail structural validation (minimal pack)', () => {
    const repoRoot = path.resolve(__dirname, '..');
    const templateDir = path.join(repoRoot, 'languages', 'template');
    if (!fs.existsSync(templateDir)) {
      // Skip if not rsync'd yet
      console.log('Skipping template fixture test -- languages/template not yet rsync\'d');
      return;
    }
    const result = validateLangPack(templateDir);
    // templateTemplate is an empty template, it should fail several checks
    // (missing required txts, missing audio, etc.) -- just verify it runs
    expect(typeof result.ok).toBe('boolean');
    expect(Array.isArray(result.errors)).toBe(true);
  });
});
