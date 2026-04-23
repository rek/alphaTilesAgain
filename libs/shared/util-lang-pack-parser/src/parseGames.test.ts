import * as fs from 'fs';
import * as path from 'path';
import { LangPackParseError } from './LangPackParseError';
import { parseGames } from './parseGames';

const ENG_PATH = path.resolve(__dirname, '../../../../../..', 'PublicLanguageAssets/engEnglish4/res/raw/aa_games.txt');

function tryReadFixture(filePath: string): string | null {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return null;
  }
}

describe('parseGames', () => {
  describe('engEnglish4 fixture', () => {
    const src = tryReadFixture(ENG_PATH);

    it('parses 90 data rows', () => {
      if (!src) return;
      const result = parseGames(src);
      expect(result.rows.length).toBe(90);
    });

    it('row[0].door === 1', () => {
      if (!src) return;
      expect(parseGames(src).rows[0].door).toBe(1);
    });

    it('row[0].country === "Romania"', () => {
      if (!src) return;
      expect(parseGames(src).rows[0].country).toBe('Romania');
    });

    it('all SyllOrTile values are T or S', () => {
      if (!src) return;
      const result = parseGames(src);
      result.rows.forEach((r) => {
        expect(['T', 'S']).toContain(r.syllOrTile);
      });
    });
  });

  describe('SyllOrTile validation', () => {
    it('throws LangPackParseError for invalid SyllOrTile value "X"', () => {
      const bad =
        'Door\tCountry\tChallengeLevel\tColor\tInstructionAudio\tAudioDuration\tSyllOrTile\tStagesIncluded\n' +
        '1\tRomania\t1\t5\tzzz_romania\t1999\tX\t-';
      expect(() => parseGames(bad)).toThrow(LangPackParseError);
    });

    it('error has column="SyllOrTile" and reason="expected T or S"', () => {
      const bad =
        'Door\tCountry\tChallengeLevel\tColor\tInstructionAudio\tAudioDuration\tSyllOrTile\tStagesIncluded\n' +
        '1\tRomania\t1\t5\tzzz_romania\t1999\tX\t-';
      try {
        parseGames(bad);
        fail('should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(LangPackParseError);
        const err = e as LangPackParseError;
        expect(err.column).toBe('SyllOrTile');
        expect(err.reason).toBe('expected T or S');
      }
    });

    it('accepts S as valid SyllOrTile', () => {
      const src =
        'Door\tCountry\tChallengeLevel\tColor\tInstructionAudio\tAudioDuration\tSyllOrTile\tStagesIncluded\n' +
        '1\tChina\t1\t9\tzzz_china\t1999\tS\t-';
      const result = parseGames(src);
      expect(result.rows[0].syllOrTile).toBe('S');
    });
  });

  describe('error handling', () => {
    it('throws on empty input', () => {
      expect(() => parseGames('')).toThrow(LangPackParseError);
    });
  });
});
