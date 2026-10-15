/**
 * Design D5: the self-test is ungraded and unrecorded — it must never reach
 * the progress stores (points, trackers, round cursors) or analytics.
 *
 * Static guard over the lib's own sources (the RN container can't load under
 * node): no import of a write-capable module in any form (static / dynamic /
 * require, either quote style), and from feature-game-thailand — whose root
 * also exports the progress-writing ThailandContainer — only the pure
 * question/view builders. Fails if the sources vanish, so it can't pass
 * vacuously.
 */
import * as fs from 'fs';
import * as path from 'path';

const SRC = path.resolve(__dirname, '..');
const FORBIDDEN = [
  '@alphaTiles/data-progress',
  '@alphaTiles/data-door-progress',
  '@shared/util-analytics',
  '@alphaTiles/feature-game-shell',
];
/** Pure (no store access) exports of feature-game-thailand the self-test may use. */
const THAILAND_ALLOWED = new Set([
  'thailandQuestion',
  'thailandRoundView',
  'ThailandChoiceFeedback',
  'ThailandRef',
  'ThailandRound',
  'ThailandType',
  'ThailandScreen',
]);

function sourceFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return e.name === '__tests__' ? [] : sourceFiles(p);
    return /\.tsx?$/.test(e.name) ? [p] : [];
  });
}

const files = sourceFiles(SRC).map((f) => ({ f, src: fs.readFileSync(f, 'utf8') }));

/** Every module specifier in `src`: import/export … from, import(), require(). */
function specifiers(src: string): string[] {
  const re = /(?:from\s*|import\s*\(\s*|require\s*\(\s*|import\s+)(['"`])([^'"`]+)\1/g;
  return [...src.matchAll(re)].map((m) => m[2]);
}

describe('self-test writes nothing', () => {
  it('scans the real sources', () => {
    expect(files.map(({ f }) => path.basename(f))).toEqual(
      expect.arrayContaining(['SelfTestContainer.tsx', 'buildSelfTest.ts']),
    );
  });

  it.each(FORBIDDEN)('no source file imports %s (or a subpath)', (mod) => {
    const offenders = files
      .filter(({ src }) => specifiers(src).some((s) => s === mod || s.startsWith(`${mod}/`)))
      .map(({ f }) => path.basename(f));
    expect(offenders).toEqual([]);
  });

  it('uses only pure builders from feature-game-thailand', () => {
    const used = files.flatMap(({ src }) =>
      [...src.matchAll(/import\s+(?:type\s+)?\{([^}]*)\}\s*from\s*['"]@alphaTiles\/feature-game-thailand['"]/g)].flatMap(
        (m) => m[1].split(',').map((n) => n.replace(/^\s*type\s+/, '').split(/\s+as\s+/)[0].trim()).filter(Boolean),
      ),
    );
    expect(used.length).toBeGreaterThan(0);
    expect(used.filter((n) => !THAILAND_ALLOWED.has(n))).toEqual([]);
    // No namespace / default import that could reach ThailandContainer.
    const wide = files.filter(({ src }) =>
      /import\s+(?:\*\s+as\s+\w+|\w+)\s+from\s*['"]@alphaTiles\/feature-game-thailand['"]/.test(src),
    );
    expect(wide).toEqual([]);
  });
});
