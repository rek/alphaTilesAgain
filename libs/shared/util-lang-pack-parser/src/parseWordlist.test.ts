import * as fs from 'fs';
import * as path from 'path';
import { LangPackParseError } from './LangPackParseError';
import { parseWordlist } from './parseWordlist';

const ENG_PATH = path.resolve(__dirname, '../../../../../..', 'PublicLanguageAssets/engEnglish4/res/raw/aa_wordlist.txt');
const TPX_PATH = path.resolve(__dirname, '../../../../../..', 'PublicLanguageAssets/tpxTeocuitlapa/res/raw/aa_wordlist.txt');

function tryReadFixture(filePath: string): string | null {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return null;
  }
}

describe('parseWordlist', () => {
  describe('engEnglish4 fixture', () => {
    const src = tryReadFixture(ENG_PATH);

    it('parses 328 data rows', () => {
      if (!src) return;
      const result = parseWordlist(src);
      expect(result.rows.length).toBe(328);
    });

    it('rows[0].wordInLWC === "act"', () => {
      if (!src) return;
      expect(parseWordlist(src).rows[0].wordInLWC).toBe('act');
    });

    it('rows[0].wordInLOP === "act"', () => {
      if (!src) return;
      expect(parseWordlist(src).rows[0].wordInLOP).toBe('act');
    });

    it('rows[0].duration === 0 (parsed as int)', () => {
      if (!src) return;
      expect(parseWordlist(src).rows[0].duration).toBe(0);
    });

    it('stageOfFirstAppearance is raw string "-"', () => {
      if (!src) return;
      expect(parseWordlist(src).rows[0].stageOfFirstAppearance).toBe('-');
    });
  });

  describe('tpxTeocuitlapa fixture', () => {
    const src = tryReadFixture(TPX_PATH);

    it('parses 167 data rows (diacritics)', () => {
      if (!src) return;
      const result = parseWordlist(src);
      expect(result.rows.length).toBe(167);
    });
  });

  describe('CRLF tolerance', () => {
    it('CRLF result equals LF result', () => {
      const src = tryReadFixture(ENG_PATH);
      if (!src) return;
      expect(parseWordlist(src.replace(/\n/g, '\r\n'))).toEqual(parseWordlist(src));
    });
  });

  describe('trailing empty cell tolerance', () => {
    it('accepts row with trailing empty cell when length equals expected', () => {
      const src = 'EnglishLWC\tEnglishLOP\tdur\tmixed\tplaceholder\tstage\nword\tword\t0\t-\t0\t';
      const result = parseWordlist(src);
      expect(result.rows.length).toBe(1);
      expect(result.rows[0].stageOfFirstAppearance).toBe('');
    });
  });

  describe('trailing blank line tolerance', () => {
    it('trailing blank line is ignored', () => {
      const src = 'EnglishLWC\tEnglishLOP\tdur\tmixed\tplaceholder\tstage\nword\tword\t0\t-\t0\t-\n\n';
      const result = parseWordlist(src);
      expect(result.rows.length).toBe(1);
    });
  });

  describe('error handling', () => {
    it('throws LangPackParseError for non-integer duration', () => {
      const bad = 'EnglishLWC\tEnglishLOP\tdur\tmixed\tplaceholder\tstage\nword\tword\tNaN\t-\t0\t-';
      expect(() => parseWordlist(bad)).toThrow(LangPackParseError);
    });

    it('throws on empty input', () => {
      expect(() => parseWordlist('')).toThrow(LangPackParseError);
    });
  });
});
