import * as fs from 'fs';
import * as path from 'path';
import { LangPackParseError } from './LangPackParseError';
import { parseGametiles } from './parseGametiles';

// Fixture paths — use PublicLanguageAssets (git-tracked in sibling repo).
// Tests that require a fixture skip gracefully when the path is absent.
const ENG_PATH = path.resolve(__dirname, '../../../../../..', 'PublicLanguageAssets/engEnglish4/res/raw/aa_gametiles.txt');
const TPX_PATH = path.resolve(__dirname, '../../../../../..', 'PublicLanguageAssets/tpxTeocuitlapa/res/raw/aa_gametiles.txt');

function tryReadFixture(filePath: string): string | null {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return null;
  }
}

describe('parseGametiles', () => {
  describe('engEnglish4 fixture', () => {
    const src = tryReadFixture(ENG_PATH);

    it('parses 39 data rows', () => {
      if (!src) return;
      const result = parseGametiles(src);
      expect(result.rows.length).toBe(39);
    });

    it('row[0].base === "a"', () => {
      if (!src) return;
      const result = parseGametiles(src);
      expect(result.rows[0].base).toBe('a');
    });

    it('row[0].audioName === "zz_a"', () => {
      if (!src) return;
      const result = parseGametiles(src);
      expect(result.rows[0].audioName).toBe('zz_a');
    });

    it('row[0].stageOfFirstAppearance === 1 (non-numeric "-" falls back to 1)', () => {
      if (!src) return;
      const result = parseGametiles(src);
      expect(result.rows[0].stageOfFirstAppearance).toBe(1);
    });

    it('row[0].upper === "A"', () => {
      if (!src) return;
      const result = parseGametiles(src);
      expect(result.rows[0].upper).toBe('A');
    });

    it('row[0].tileTypeB === "none"', () => {
      if (!src) return;
      const result = parseGametiles(src);
      expect(result.rows[0].tileTypeB).toBe('none');
    });

    it('is pure — calling twice returns deeply equal objects', () => {
      if (!src) return;
      expect(parseGametiles(src)).toEqual(parseGametiles(src));
    });
  });

  describe('tpxTeocuitlapa fixture', () => {
    const src = tryReadFixture(TPX_PATH);

    it('parses 43 data rows (diacritics-heavy pack)', () => {
      if (!src) return;
      const result = parseGametiles(src);
      expect(result.rows.length).toBe(43);
    });
  });

  describe('CRLF tolerance', () => {
    it('produces same output as LF-only', () => {
      const src = tryReadFixture(ENG_PATH);
      if (!src) return;
      const crlf = src.replace(/\n/g, '\r\n');
      expect(parseGametiles(crlf)).toEqual(parseGametiles(src));
    });
  });

  describe('error handling', () => {
    it('throws LangPackParseError for a row with 15 columns when 17 expected', () => {
      const short = 'c0\tc1\tc2\tc3\tc4\tc5\tc6\tc7\tc8\tc9\tc10\tc11\tc12\tc13\tc14\tc15\tc16\n' +
        'a\tb\tc\td\te\tf\tg\th\ti\tj\tk\tl\tm';
      expect(() => parseGametiles(short)).toThrow(LangPackParseError);
    });

    it('error has correct file and got=13 and expected=17', () => {
      const short = 'c0\tc1\tc2\tc3\tc4\tc5\tc6\tc7\tc8\tc9\tc10\tc11\tc12\tc13\tc14\tc15\tc16\n' +
        'a\tb\tc\td\te\tf\tg\th\ti\tj\tk\tl\tm';
      try {
        parseGametiles(short);
        fail('should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(LangPackParseError);
        const err = e as LangPackParseError;
        expect(err.file).toBe('aa_gametiles.txt');
        expect(err.expected).toBe(17);
        expect(err.got).toBe(13);
      }
    });

    it('throws on empty input', () => {
      expect(() => parseGametiles('')).toThrow(LangPackParseError);
    });
  });
});
