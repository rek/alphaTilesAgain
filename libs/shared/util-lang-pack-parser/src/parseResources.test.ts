import * as fs from 'fs';
import * as path from 'path';
import { parseResources } from './parseResources';

const ENG_PATH = path.resolve(__dirname, '../../../../../..', 'PublicLanguageAssets/engEnglish4/res/raw/aa_resources.txt');

function tryReadFixture(filePath: string): string | null {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return null;
  }
}

describe('parseResources', () => {
  describe('engEnglish4 fixture', () => {
    const src = tryReadFixture(ENG_PATH);

    it('parses 1 data row', () => {
      if (!src) return;
      expect(parseResources(src).rows.length).toBe(1);
    });

    it('rows[0].name === "Alpha Tiles: Ready to Read"', () => {
      if (!src) return;
      expect(parseResources(src).rows[0].name).toBe('Alpha Tiles: Ready to Read');
    });
  });
});
