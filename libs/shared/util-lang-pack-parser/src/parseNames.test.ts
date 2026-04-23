import * as fs from 'fs';
import * as path from 'path';
import { parseNames } from './parseNames';

const ENG_PATH = path.resolve(__dirname, '../../../../../..', 'PublicLanguageAssets/engEnglish4/res/raw/aa_names.txt');

function tryReadFixture(filePath: string): string | null {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return null;
  }
}

describe('parseNames', () => {
  describe('engEnglish4 fixture (header only)', () => {
    const src = tryReadFixture(ENG_PATH);

    it('returns empty rows array for header-only file', () => {
      if (!src) return;
      expect(parseNames(src).rows).toEqual([]);
    });
  });

  describe('inline tests', () => {
    it('parses name rows', () => {
      const src = 'Entry\tName\n1\tAlice\n2\tBob\n';
      const result = parseNames(src);
      expect(result.rows).toEqual([
        { entry: '1', name: 'Alice' },
        { entry: '2', name: 'Bob' },
      ]);
    });
  });
});
