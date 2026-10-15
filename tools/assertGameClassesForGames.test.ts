import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { assertGameClassesForGames } from './assertGameClassesForGames';

const GAMES_HEADER =
  'Door\tCountry\tChallengeLevel\tColor\tInstructionAudio\tAudioDuration\tSyllOrTile\tStagesIncluded\n';
const row = (door: number, country: string) =>
  `${door}\t${country}\t1\t5\tzzz_x\t1999\tT\t-`;

function makeLangDir(countries: string[]): string {
  const langDir = fs.mkdtempSync(path.join(os.tmpdir(), 'game-classes-test-'));
  fs.writeFileSync(
    path.join(langDir, 'aa_games.txt'),
    GAMES_HEADER + countries.map((c, i) => row(i + 1, c)).join('\n'),
  );
  return langDir;
}

describe('assertGameClassesForGames', () => {
  it('passes when every classKey has a registry entry', () => {
    const langDir = makeLangDir(['Thailand', 'UnitedStates']);
    expect(() => assertGameClassesForGames(langDir, ['thailand', 'united-states'])).not.toThrow();
  });

  it('throws listing the missing kebab classKey', () => {
    const langDir = makeLangDir(['UnitedStates']);
    expect(() => assertGameClassesForGames(langDir, ['thailand'])).toThrow(
      /united-states \(missing\)/,
    );
  });

  it("no-ops when aa_games.txt is absent (pack not yet rsync'd)", () => {
    const langDir = fs.mkdtempSync(path.join(os.tmpdir(), 'game-classes-test-'));
    expect(() => assertGameClassesForGames(langDir, [])).not.toThrow();
  });
});

// Registry completeness: every game class used by any door of any pack present
// under languages/ has an entry in the real registry.
const languagesDir = path.join(__dirname, '..', 'languages');
const packs = fs.existsSync(languagesDir)
  ? fs
      .readdirSync(languagesDir)
      .filter((d) => fs.existsSync(path.join(languagesDir, d, 'aa_games.txt')))
  : [];

(packs.length > 0 ? describe : describe.skip)('game-class registry completeness', () => {
  it.each(packs.length > 0 ? packs : ['(none)'])('%s: every door class is registered', (pack) => {
    expect(() => assertGameClassesForGames(path.join(languagesDir, pack))).not.toThrow();
  });
});
