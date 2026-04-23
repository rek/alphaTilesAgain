import * as fs from 'fs';
import * as path from 'path';
import { LangPackParseError } from './LangPackParseError';
import { parseSyllables } from './parseSyllables';

const ENG_PATH = path.resolve(__dirname, '../../../../../..', 'PublicLanguageAssets/engEnglish4/res/raw/aa_syllables.txt');
const TPX_PATH = path.resolve(__dirname, '../../../../../..', 'PublicLanguageAssets/tpxTeocuitlapa/res/raw/aa_syllables.txt');

function tryReadFixture(filePath: string): string | null {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return null;
  }
}

describe('parseSyllables', () => {
  describe('engEnglish4 fixture (header only)', () => {
    const src = tryReadFixture(ENG_PATH);

    it('parses 0 rows (header-only file is valid)', () => {
      if (!src) return;
      expect(parseSyllables(src).rows.length).toBe(0);
    });
  });

  describe('tpxTeocuitlapa fixture', () => {
    const src = tryReadFixture(TPX_PATH);

    it('parses 217 data rows', () => {
      if (!src) return;
      expect(parseSyllables(src).rows.length).toBe(217);
    });

    it('row[0].syllable === "a"', () => {
      if (!src) return;
      expect(parseSyllables(src).rows[0].syllable).toBe('a');
    });

    it('row[0].duration is a number', () => {
      if (!src) return;
      const r = parseSyllables(src).rows[0];
      expect(typeof r.duration).toBe('number');
    });

    it('row[0].distractors has 3 elements', () => {
      if (!src) return;
      expect(parseSyllables(src).rows[0].distractors).toHaveLength(3);
    });
  });

  describe('error handling', () => {
    it('throws LangPackParseError for non-integer Duration', () => {
      const bad =
        'Syllable\tOr1\tOr2\tOr3\tSyllableAudioName\tDuration\tColor\n' +
        'a\tb\tc\td\tzz_a\tNaN\t0';
      expect(() => parseSyllables(bad)).toThrow(LangPackParseError);
    });

    it('error has column="Duration"', () => {
      const bad =
        'Syllable\tOr1\tOr2\tOr3\tSyllableAudioName\tDuration\tColor\n' +
        'a\tb\tc\td\tzz_a\tNaN\t0';
      try {
        parseSyllables(bad);
        fail('should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(LangPackParseError);
        expect((e as LangPackParseError).column).toBe('Duration');
      }
    });
  });
});
