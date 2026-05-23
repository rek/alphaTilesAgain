import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { assertRoutesForGames } from './assertRoutesForGames';

const GAMES_HEADER =
  'Door\tCountry\tChallengeLevel\tColor\tInstructionAudio\tAudioDuration\tSyllOrTile\tStagesIncluded\n';
const row = (door: number, country: string) =>
  `${door}\t${country}\t1\t5\tzzz_x\t1999\tT\t-`;

function makeTmpRepo(countries: string[], routeStems: string[]): string {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'routes-test-'));
  const langDir = path.join(tmp, 'languages', 'fake');
  fs.mkdirSync(langDir, { recursive: true });
  fs.writeFileSync(
    path.join(langDir, 'aa_games.txt'),
    GAMES_HEADER + countries.map((c, i) => row(i + 1, c)).join('\n'),
  );
  const routesDir = path.join(tmp, 'apps', 'alphaTiles', 'app', 'games');
  fs.mkdirSync(routesDir, { recursive: true });
  for (const stem of routeStems) {
    fs.writeFileSync(path.join(routesDir, `${stem}.tsx`), '');
  }
  return tmp;
}

describe('assertRoutesForGames', () => {
  it('passes when every classKey has a matching route file', () => {
    const tmp = makeTmpRepo(
      ['Thailand', 'UnitedStates'],
      ['thailand', 'united-states'],
    );
    expect(() =>
      assertRoutesForGames(tmp, path.join(tmp, 'languages', 'fake')),
    ).not.toThrow();
  });

  it('throws listing the missing kebab classKey', () => {
    const tmp = makeTmpRepo(['UnitedStates'], ['thailand']);
    expect(() =>
      assertRoutesForGames(tmp, path.join(tmp, 'languages', 'fake')),
    ).toThrow(/united-states\.tsx \(missing\)/);
  });

  it('ignores the dynamic [classKey].tsx catch-all when checking presence', () => {
    // Only the catch-all is present — the assert must still flag the real route as missing.
    const tmp = makeTmpRepo(['Thailand'], ['[classKey]']);
    expect(() =>
      assertRoutesForGames(tmp, path.join(tmp, 'languages', 'fake')),
    ).toThrow(/thailand\.tsx \(missing\)/);
  });

  it('no-ops when aa_games.txt is absent (pack not yet rsync\'d)', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'routes-test-'));
    fs.mkdirSync(path.join(tmp, 'languages', 'fake'), { recursive: true });
    expect(() =>
      assertRoutesForGames(tmp, path.join(tmp, 'languages', 'fake')),
    ).not.toThrow();
  });
});
