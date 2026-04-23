import * as fs from 'fs';
import * as path from 'path';
import { LangPackParseError } from './LangPackParseError';
import { parsePack } from './parsePack';

function readPackFiles(dir: string): Record<string, string> | null {
  const files = [
    'aa_gametiles',
    'aa_wordlist',
    'aa_syllables',
    'aa_keyboard',
    'aa_games',
    'aa_langinfo',
    'aa_settings',
    'aa_names',
    'aa_resources',
    'aa_colors',
    'aa_share',
  ];
  const result: Record<string, string> = {};
  for (const key of files) {
    const filePath = path.join(dir, `${key}.txt`);
    try {
      result[key] = fs.readFileSync(filePath, 'utf8');
    } catch {
      return null; // skip if any file is missing
    }
  }
  return result;
}

const ENG_DIR = path.resolve(__dirname, '../../../../../..', 'PublicLanguageAssets/engEnglish4/res/raw');
const TPX_DIR = path.resolve(__dirname, '../../../../../..', 'PublicLanguageAssets/tpxTeocuitlapa/res/raw');

describe('parsePack', () => {
  describe('engEnglish4 integration', () => {
    const rawFiles = readPackFiles(ENG_DIR);

    it('returns all 11 keys', () => {
      if (!rawFiles) return;
      const result = parsePack(rawFiles);
      expect(result).toHaveProperty('tiles');
      expect(result).toHaveProperty('words');
      expect(result).toHaveProperty('syllables');
      expect(result).toHaveProperty('keys');
      expect(result).toHaveProperty('games');
      expect(result).toHaveProperty('langInfo');
      expect(result).toHaveProperty('settings');
      expect(result).toHaveProperty('names');
      expect(result).toHaveProperty('resources');
      expect(result).toHaveProperty('colors');
      expect(result).toHaveProperty('share');
    });

    it('langInfo.find("Script direction (LTR or RTL)") === "LTR"', () => {
      if (!rawFiles) return;
      const result = parsePack(rawFiles);
      expect(result.langInfo.find('Script direction (LTR or RTL)')).toBe('LTR');
    });

    it('colors.hexByIndex.length === 13', () => {
      if (!rawFiles) return;
      expect(parsePack(rawFiles).colors.hexByIndex.length).toBe(13);
    });

    it('tiles.rows.length === 39', () => {
      if (!rawFiles) return;
      expect(parsePack(rawFiles).tiles.rows.length).toBe(39);
    });

    it('words.rows.length === 328', () => {
      if (!rawFiles) return;
      expect(parsePack(rawFiles).words.rows.length).toBe(328);
    });

    it('games.rows.length === 90', () => {
      if (!rawFiles) return;
      expect(parsePack(rawFiles).games.rows.length).toBe(90);
    });
  });

  describe('tpxTeocuitlapa integration', () => {
    const rawFiles = readPackFiles(TPX_DIR);

    it('returns 11 keys for tpx pack', () => {
      if (!rawFiles) return;
      const result = parsePack(rawFiles);
      expect(result).toHaveProperty('tiles');
      expect(result).toHaveProperty('syllables');
    });

    it('langInfo.find("Ethnologue code") === "tpx"', () => {
      if (!rawFiles) return;
      expect(parsePack(rawFiles).langInfo.find('Ethnologue code')).toBe('tpx');
    });

    it('syllables.rows.length === 217 (non-empty syllable pack)', () => {
      if (!rawFiles) return;
      expect(parsePack(rawFiles).syllables.rows.length).toBe(217);
    });
  });

  describe('error handling', () => {
    it('throws LangPackParseError when aa_gametiles is missing', () => {
      expect(() => parsePack({})).toThrow(LangPackParseError);
    });

    it('error has file="aa_gametiles" and reason="missing from rawFiles"', () => {
      try {
        parsePack({});
        fail('should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(LangPackParseError);
        const err = e as LangPackParseError;
        expect(err.file).toBe('aa_gametiles');
        expect(err.reason).toBe('missing from rawFiles');
      }
    });

    it('propagates child LangPackParseError unchanged', () => {
      const bad: Record<string, string> = {
        'aa_gametiles': 'bad\ndata',
        'aa_wordlist': '',
        'aa_syllables': '',
        'aa_keyboard': '',
        'aa_games': '',
        'aa_langinfo': '',
        'aa_settings': '',
        'aa_names': '',
        'aa_resources': '',
        'aa_colors': '',
        'aa_share': '',
      };
      expect(() => parsePack(bad)).toThrow(LangPackParseError);
    });
  });
});
