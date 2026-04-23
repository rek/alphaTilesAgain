import * as fs from 'fs';
import * as path from 'path';
import { LangPackParseError } from './LangPackParseError';
import { parseColors } from './parseColors';

const ENG_PATH = path.resolve(__dirname, '../../../../../..', 'PublicLanguageAssets/engEnglish4/res/raw/aa_colors.txt');

function tryReadFixture(filePath: string): string | null {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return null;
  }
}

describe('parseColors', () => {
  describe('engEnglish4 fixture', () => {
    const src = tryReadFixture(ENG_PATH);

    it('rows.length === 13', () => {
      if (!src) return;
      const result = parseColors(src);
      expect(result.rows.length).toBe(13);
    });

    it('hexByIndex[0] === "#9C27B0"', () => {
      if (!src) return;
      const result = parseColors(src);
      expect(result.hexByIndex[0]).toBe('#9C27B0');
    });

    it('hexByIndex[5] === "#FFFF00" (yellow)', () => {
      if (!src) return;
      const result = parseColors(src);
      expect(result.hexByIndex[5]).toBe('#FFFF00');
    });

    it('rows[0] has id, name, hex', () => {
      if (!src) return;
      const result = parseColors(src);
      expect(result.rows[0]).toMatchObject({ id: '0', name: 'themePurple', hex: '#9C27B0' });
    });
  });

  describe('error handling', () => {
    it('throws for short row', () => {
      const bad = 'Game Color Number\tColor Name\tHex Code\n0\tthemePurple';
      expect(() => parseColors(bad)).toThrow(LangPackParseError);
    });

    it('throws on empty input', () => {
      expect(() => parseColors('')).toThrow(LangPackParseError);
    });
  });
});
