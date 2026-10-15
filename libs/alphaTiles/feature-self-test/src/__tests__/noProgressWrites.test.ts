/**
 * Design D5: the self-test is ungraded and unrecorded — it must never reach
 * the progress stores (points, trackers, round cursors) or analytics.
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

function sourceFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return e.name === '__tests__' ? [] : sourceFiles(p);
    return /\.tsx?$/.test(e.name) ? [p] : [];
  });
}

describe('self-test writes nothing', () => {
  it.each(FORBIDDEN)('no source file imports %s', (mod) => {
    const offenders = sourceFiles(SRC).filter((f) =>
      fs.readFileSync(f, 'utf8').includes(`'${mod}'`),
    );
    expect(offenders).toEqual([]);
  });
});
