/**
 * Unit tests for _lang-pack-mini-parser.ts
 * Run: bun test tools/_lang-pack-mini-parser.test.ts
 */

import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  readLangInfo,
  readGameTiles,
  gameTileAudioNames,
  gameTileKeys,
  readWordList,
  wordListKeys,
  readSyllables,
  syllableAudioNames,
  syllableKeys,
} from './_lang-pack-mini-parser';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function writeTmp(content: string): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mini-parser-'));
  const file = path.join(dir, 'test.txt');
  fs.writeFileSync(file, content, 'utf8');
  return file;
}

// ---------------------------------------------------------------------------
// aa_langinfo.txt
// ---------------------------------------------------------------------------

describe('readLangInfo', () => {
  it('parses a valid langinfo file', () => {
    const content = [
      'Item\tAnswer',
      '1. Lang Name (In Local Lang)\tAlpha Language',
      '2. Lang Name (In English)\tAlpha English',
      '4. Ethnologue code\talp',
      '7. Game Name (In Local Lang)\tAlpha Tiles',
      '8. Script direction (LTR or RTL)\tLTR',
      '11. Script type\tRoman',
    ].join('\n');
    const file = writeTmp(content);
    const info = readLangInfo(file);
    expect(info.nameInLocalLang).toBe('Alpha Language');
    expect(info.nameInEnglish).toBe('Alpha English');
    expect(info.ethnologueCode).toBe('alp');
    expect(info.scriptDirection).toBe('LTR');
    expect(info.scriptType).toBe('Roman');
  });

  it('handles RTL direction', () => {
    const content = [
      '1. Lang Name (In Local Lang)\tArabic Test',
      '8. Script direction (LTR or RTL)\tRTL',
    ].join('\n');
    const file = writeTmp(content);
    const info = readLangInfo(file);
    expect(info.scriptDirection).toBe('RTL');
  });

  it('normalizes CRLF', () => {
    const content = '1. Lang Name (In Local Lang)\tTest Lang\r\n8. Script direction (LTR or RTL)\tLTR\r\n';
    const file = writeTmp(content);
    const info = readLangInfo(file);
    expect(info.nameInLocalLang).toBe('Test Lang');
  });

  it('throws on missing file', () => {
    expect(() => readLangInfo('/nonexistent/path/aa_langinfo.txt')).toThrow();
  });

  it('throws when required field missing', () => {
    const content = '8. Script direction (LTR or RTL)\tLTR\n';
    const file = writeTmp(content);
    expect(() => readLangInfo(file)).toThrow(/Lang Name/);
  });
});

// ---------------------------------------------------------------------------
// aa_gametiles.txt
// ---------------------------------------------------------------------------

describe('readGameTiles', () => {
  const HEADER = 'tiles\tOr1\tOr2\tOr3\tType\tAudioName\tUpper\tType2\tAudioName2\tType3\tAudioName3\tPh\tPh\tPh\tStage\tStage2\tStage3';

  it('extracts tile keys and audio names', () => {
    const content = [
      HEADER,
      'a\te\to\tar\tV\tzz_a\tA\tnone\tX\tnone\tX\t0\t0\t0\t-\t-\t-',
      'b\td\tp\tm\tC\tzz_b\tB\tnone\tX\tnone\tX\t0\t0\t0\t-\t-\t-',
    ].join('\n');
    const file = writeTmp(content);
    const entries = readGameTiles(file);
    expect(entries).toHaveLength(2);
    expect(entries[0].tileKey).toBe('a');
    expect(entries[0].audioNames).toContain('zz_a');
    expect(entries[0].audioNames).not.toContain('X');
    expect(entries[0].audioNames).not.toContain('none');
  });

  it('excludes X and none audio names', () => {
    const content = [HEADER, 'ch\ts\tc\tt\tC\tzz_ch\tCh\tnone\tX\tnone\tX\t0\t0\t0\t-\t-\t-'].join('\n');
    const file = writeTmp(content);
    const entries = readGameTiles(file);
    expect(entries[0].audioNames).toEqual(['zz_ch']);
  });

  it('returns empty array for missing file', () => {
    expect(readGameTiles('/no/such/file.txt')).toEqual([]);
  });

  it('gameTileAudioNames returns flat set', () => {
    const content = [
      HEADER,
      'a\te\to\tar\tV\tzz_a\tA\tnone\tX\tnone\tX\t0\t0\t0\t-\t-\t-',
      'b\td\tp\tm\tC\tzz_b\tB\tnone\tX\tnone\tX\t0\t0\t0\t-\t-\t-',
    ].join('\n');
    const file = writeTmp(content);
    const names = gameTileAudioNames(file);
    expect(names.has('zz_a')).toBe(true);
    expect(names.has('zz_b')).toBe(true);
    expect(names.size).toBe(2);
  });

  it('gameTileKeys returns tile text keys', () => {
    const content = [HEADER, 'a\te\to\tar\tV\tzz_a\tA\tnone\tX\tnone\tX\t0\t0\t0\t-\t-\t-'].join('\n');
    const file = writeTmp(content);
    const keys = gameTileKeys(file);
    expect(keys.has('a')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// aa_wordlist.txt
// ---------------------------------------------------------------------------

describe('readWordList', () => {
  const HEADER = 'EnglishLWC\tEnglishLOP\t(Placeholder)\tMixed\t(Placeholder)\tFirstAppearsInStage';

  it('extracts word entries', () => {
    const content = [HEADER, 'act\tact\t0\t-\t0\t-', 'bat\tbat\t0\t-\t0\t-'].join('\n');
    const file = writeTmp(content);
    const entries = readWordList(file);
    expect(entries).toHaveLength(2);
    expect(entries[0].wordLWC).toBe('act');
    expect(entries[0].wordLOP).toBe('act');
  });

  it('wordListKeys returns LWC key set', () => {
    const content = [HEADER, 'act\tact\t0\t-\t0\t-'].join('\n');
    const file = writeTmp(content);
    const keys = wordListKeys(file);
    expect(keys.has('act')).toBe(true);
  });

  it('returns empty array for missing file', () => {
    expect(readWordList('/no/file.txt')).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// aa_syllables.txt
// ---------------------------------------------------------------------------

describe('readSyllables', () => {
  const HEADER = 'Syllable\tOr1\tOr2\tOr3\tSyllableAudioName\tDuration\tColor';

  it('extracts syllable entries', () => {
    const content = [HEADER, 'ba\tca\tda\tea\tzs_ba\t1500\t0'].join('\n');
    const file = writeTmp(content);
    const entries = readSyllables(file);
    expect(entries).toHaveLength(1);
    expect(entries[0].syllable).toBe('ba');
    expect(entries[0].audioName).toBe('zs_ba');
  });

  it('syllableAudioNames returns audio name set', () => {
    const content = [HEADER, 'ba\tca\tda\tea\tzs_ba\t1500\t0'].join('\n');
    const file = writeTmp(content);
    const names = syllableAudioNames(file);
    expect(names.has('zs_ba')).toBe(true);
  });

  it('syllableKeys returns syllable text set', () => {
    const content = [HEADER, 'ba\tca\tda\tea\tzs_ba\t1500\t0'].join('\n');
    const file = writeTmp(content);
    const keys = syllableKeys(file);
    expect(keys.has('ba')).toBe(true);
  });

  it('handles empty syllables file (header only)', () => {
    const content = HEADER;
    const file = writeTmp(content);
    expect(readSyllables(file)).toEqual([]);
  });

  it('returns empty array for missing file', () => {
    expect(readSyllables('/no/file.txt')).toEqual([]);
  });
});
