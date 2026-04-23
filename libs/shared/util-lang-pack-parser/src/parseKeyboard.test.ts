import * as fs from 'fs';
import * as path from 'path';
import { parseKeyboard } from './parseKeyboard';

const ENG_PATH = path.resolve(__dirname, '../../../../../..', 'PublicLanguageAssets/engEnglish4/res/raw/aa_keyboard.txt');

function tryReadFixture(filePath: string): string | null {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return null;
  }
}

describe('parseKeyboard', () => {
  describe('engEnglish4 fixture', () => {
    const src = tryReadFixture(ENG_PATH);

    it('parses 26 data rows', () => {
      if (!src) return;
      expect(parseKeyboard(src).rows.length).toBe(26);
    });

    it('rows[0].key === "a"', () => {
      if (!src) return;
      expect(parseKeyboard(src).rows[0].key).toBe('a');
    });

    it('rows[0].color === "4"', () => {
      if (!src) return;
      expect(parseKeyboard(src).rows[0].color).toBe('4');
    });
  });
});
