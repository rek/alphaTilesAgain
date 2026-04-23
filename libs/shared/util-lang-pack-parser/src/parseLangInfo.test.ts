import * as fs from 'fs';
import * as path from 'path';
import { LangPackParseError } from './LangPackParseError';
import { parseLangInfo } from './parseLangInfo';

const ENG_PATH = path.resolve(__dirname, '../../../../../..', 'PublicLanguageAssets/engEnglish4/res/raw/aa_langinfo.txt');
const TPX_PATH = path.resolve(__dirname, '../../../../../..', 'PublicLanguageAssets/tpxTeocuitlapa/res/raw/aa_langinfo.txt');

function tryReadFixture(filePath: string): string | null {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return null;
  }
}

describe('parseLangInfo', () => {
  describe('engEnglish4 fixture', () => {
    const src = tryReadFixture(ENG_PATH);

    it('find returns English for normalized label', () => {
      if (!src) return;
      const info = parseLangInfo(src);
      expect(info.find('Lang Name (In Local Lang)')).toBe('English');
    });

    it('find also accepts raw label with numeric prefix', () => {
      if (!src) return;
      const info = parseLangInfo(src);
      expect(info.find('1. Lang Name (In Local Lang)')).toBe('English');
    });

    it('Script direction (LTR or RTL) === LTR', () => {
      if (!src) return;
      const info = parseLangInfo(src);
      expect(info.find('Script direction (LTR or RTL)')).toBe('LTR');
    });

    it('Script type === Roman', () => {
      if (!src) return;
      const info = parseLangInfo(src);
      expect(info.find('Script type')).toBe('Roman');
    });

    it('find returns undefined for missing label', () => {
      if (!src) return;
      const info = parseLangInfo(src);
      expect(info.find('NonExistentLabel')).toBeUndefined();
    });

    it('entries preserves file order', () => {
      if (!src) return;
      const info = parseLangInfo(src);
      expect(info.entries[0].label).toContain('Lang Name (In Local Lang)');
    });
  });

  describe('tpxTeocuitlapa fixture', () => {
    const src = tryReadFixture(TPX_PATH);

    it('find returns tpx for Ethnologue code', () => {
      if (!src) return;
      const info = parseLangInfo(src);
      expect(info.find('Ethnologue code')).toBe('tpx');
    });
  });

  describe('error handling', () => {
    it('throws LangPackParseError on duplicate normalized label', () => {
      const dupSrc =
        'Item\tAnswer\n' +
        '1. Lang Name (In Local Lang)\tFoo\n' +
        'Lang Name (In Local Lang)\tBar\n';
      expect(() => parseLangInfo(dupSrc)).toThrow(LangPackParseError);
    });

    it('duplicate error has reason="duplicate label"', () => {
      const dupSrc =
        'Item\tAnswer\n' +
        '1. Lang Name (In Local Lang)\tFoo\n' +
        'Lang Name (In Local Lang)\tBar\n';
      try {
        parseLangInfo(dupSrc);
        fail('should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(LangPackParseError);
        const err = e as LangPackParseError;
        expect(err.reason).toBe('duplicate label');
        expect(err.file).toBe('aa_langinfo.txt');
      }
    });

    it('returns undefined for Email when absent', () => {
      const src = 'Item\tAnswer\n1. Foo\tBar\n';
      const info = parseLangInfo(src);
      expect(info.find('Email')).toBeUndefined();
    });

    it('throws on empty input', () => {
      expect(() => parseLangInfo('')).toThrow(LangPackParseError);
    });
  });
});
