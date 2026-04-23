import * as fs from 'fs';
import * as path from 'path';
import { LangPackParseError } from './LangPackParseError';
import { parseShare } from './parseShare';

const ENG_PATH = path.resolve(__dirname, '../../../../../..', 'PublicLanguageAssets/engEnglish4/res/raw/aa_share.txt');

function tryReadFixture(filePath: string): string | null {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return null;
  }
}

describe('parseShare', () => {
  describe('engEnglish4 fixture', () => {
    const src = tryReadFixture(ENG_PATH);

    it('returns the play store link', () => {
      if (!src) return;
      expect(parseShare(src)).toBe(
        'https://play.google.com/store/apps/details?id=org.alphatilesapps.alphatiles.blue.engEnglish4',
      );
    });
  });

  describe('inline tests', () => {
    it('returns the link string from a simple input', () => {
      expect(parseShare('Link\nhttps://example.com')).toBe('https://example.com');
    });

    it('throws when file has header only (no data row)', () => {
      expect(() => parseShare('Link\n')).toThrow(LangPackParseError);
    });

    it('throws on empty input', () => {
      expect(() => parseShare('')).toThrow(LangPackParseError);
    });
  });
});
