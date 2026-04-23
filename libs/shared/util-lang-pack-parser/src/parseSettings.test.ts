import * as fs from 'fs';
import * as path from 'path';
import { LangPackParseError } from './LangPackParseError';
import { parseSettings } from './parseSettings';

const ENG_PATH = path.resolve(__dirname, '../../../../../..', 'PublicLanguageAssets/engEnglish4/res/raw/aa_settings.txt');

function tryReadFixture(filePath: string): string | null {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return null;
  }
}

describe('parseSettings', () => {
  describe('engEnglish4 fixture', () => {
    const src = tryReadFixture(ENG_PATH);

    it('findBoolean("Has tile audio", false) === true', () => {
      if (!src) return;
      const settings = parseSettings(src);
      expect(settings.findBoolean('Has tile audio', false)).toBe(true);
    });

    it('find("Has tile audio") === "TRUE" (string preserved)', () => {
      if (!src) return;
      const settings = parseSettings(src);
      expect(settings.find('Has tile audio')).toBe('TRUE');
    });

    it('findBoolean("Has syllable audio", true) === false', () => {
      if (!src) return;
      const settings = parseSettings(src);
      expect(settings.findBoolean('Has syllable audio', true)).toBe(false);
    });

    it('findInt("Number of avatars", 0) === 12', () => {
      if (!src) return;
      const settings = parseSettings(src);
      expect(settings.findInt('Number of avatars', 0)).toBe(12);
    });

    it('findFloat("Stage correspondence ratio", 0) === 0.75', () => {
      if (!src) return;
      const settings = parseSettings(src);
      expect(settings.findFloat('Stage correspondence ratio', 0)).toBe(0.75);
    });

    it('find returns undefined for missing label', () => {
      if (!src) return;
      const settings = parseSettings(src);
      expect(settings.find('Nonexistent Setting')).toBeUndefined();
    });

    it('also accepts raw label with numeric prefix', () => {
      if (!src) return;
      const settings = parseSettings(src);
      expect(settings.find('3. Has tile audio')).toBe('TRUE');
    });
  });

  describe('helper semantics', () => {
    const src = 'Setting\tValue\nHas tile audio\tTRUE\nAfter 12 checked trackers\tthree\n';

    it('findBoolean treats "TRUE" as true', () => {
      expect(parseSettings(src).findBoolean('Has tile audio', false)).toBe(true);
    });

    it('findBoolean treats "True" as true', () => {
      const s = parseSettings('Setting\tValue\nFoo\tTrue\n');
      expect(s.findBoolean('Foo', false)).toBe(true);
    });

    it('findBoolean treats "true" as true', () => {
      const s = parseSettings('Setting\tValue\nFoo\ttrue\n');
      expect(s.findBoolean('Foo', false)).toBe(true);
    });

    it('findBoolean treats "FALSE" as false', () => {
      const s = parseSettings('Setting\tValue\nFoo\tFALSE\n');
      expect(s.findBoolean('Foo', true)).toBe(false);
    });

    it('findInt falls back to default on non-numeric', () => {
      expect(parseSettings(src).findInt('After 12 checked trackers', 5)).toBe(5);
    });

    it('findInt returns parsed value on numeric', () => {
      const s = parseSettings('Setting\tValue\nCount\t42\n');
      expect(s.findInt('Count', 0)).toBe(42);
    });

    it('findFloat falls back to default on non-numeric', () => {
      const s = parseSettings('Setting\tValue\nRatio\tnope\n');
      expect(s.findFloat('Ratio', 1.0)).toBe(1.0);
    });
  });

  describe('error handling', () => {
    it('throws on empty input', () => {
      expect(() => parseSettings('')).toThrow(LangPackParseError);
    });
  });
});
