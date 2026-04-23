/**
 * Unit tests for rsync-lang-packs.ts classification logic.
 * Run: bun test tools/rsync-lang-packs.test.ts
 */

import {
  buildAudioClassification,
  classifyAudio,
  classifyDrawable,
  type AudioClassification,
  type ImageClassification,
} from './rsync-lang-packs';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

// ---------------------------------------------------------------------------
// Helper: write fixture files into a temp directory
// ---------------------------------------------------------------------------

function makeRawDir(files: Record<string, string>): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rsync-test-'));
  for (const [name, content] of Object.entries(files)) {
    fs.writeFileSync(path.join(dir, name), content, 'utf8');
  }
  return dir;
}

const GAMETILES_HEADER = 'tiles\tOr1\tOr2\tOr3\tType\tAudioName\tUpper\tType2\tAudioName2\tType3\tAudioName3\tPh\tPh\tPh\tStage\tStage2\tStage3';
const WORDLIST_HEADER = 'EnglishLWC\tEnglishLOP\t(Placeholder)\tMixed\t(Placeholder)\tFirstAppearsInStage';
const SYLLABLES_HEADER = 'Syllable\tOr1\tOr2\tOr3\tSyllableAudioName\tDuration\tColor';

// ---------------------------------------------------------------------------
// Audio classification
// ---------------------------------------------------------------------------

describe('classifyAudio', () => {
  const classification: AudioClassification = {
    tiles: new Set(['zz_a', 'zz_b']),
    words: new Set(['act', 'bat']),
    syllables: new Set(['zs_ba']),
  };

  it('classifies tile audio correctly', () => {
    expect(classifyAudio('zz_a', classification)).toEqual(['tiles']);
  });

  it('classifies word audio correctly', () => {
    expect(classifyAudio('act', classification)).toEqual(['words']);
  });

  it('classifies syllable audio correctly', () => {
    expect(classifyAudio('zs_ba', classification)).toEqual(['syllables']);
  });

  it('classifies zzz_ prefix as instructions regardless of index', () => {
    expect(classifyAudio('zzz_china', classification)).toEqual(['instructions']);
    expect(classifyAudio('zzz_brazil_consonant', classification)).toEqual(['instructions']);
  });

  it('returns empty array for unknown stem', () => {
    expect(classifyAudio('unknown_file', classification)).toEqual([]);
  });

  it('can classify into multiple categories if stem appears in multiple indexes', () => {
    // "bat" is both a tile audio and a word audio in our fixture
    const multi: AudioClassification = {
      tiles: new Set(['bat']),
      words: new Set(['bat']),
      syllables: new Set(),
    };
    const result = classifyAudio('bat', multi);
    expect(result).toContain('tiles');
    expect(result).toContain('words');
  });
});

describe('buildAudioClassification', () => {
  it('builds classification from fixture files', () => {
    const rawDir = makeRawDir({
      'aa_gametiles.txt': [
        GAMETILES_HEADER,
        'a\te\to\tar\tV\tzz_a\tA\tnone\tX\tnone\tX\t0\t0\t0\t-\t-\t-',
        'b\td\tp\tm\tC\tzz_b\tB\tnone\tX\tnone\tX\t0\t0\t0\t-\t-\t-',
      ].join('\n'),
      'aa_wordlist.txt': [
        WORDLIST_HEADER,
        'act\tact\t0\t-\t0\t-',
        'bat\tbat\t0\t-\t0\t-',
      ].join('\n'),
      'aa_syllables.txt': [
        SYLLABLES_HEADER,
        'ba\tca\tda\tea\tzs_ba\t1500\t0',
      ].join('\n'),
    });

    const cls = buildAudioClassification(rawDir);
    expect(cls.tiles.has('zz_a')).toBe(true);
    expect(cls.tiles.has('zz_b')).toBe(true);
    expect(cls.words.has('act')).toBe(true);
    expect(cls.words.has('bat')).toBe(true);
    expect(cls.syllables.has('zs_ba')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Image classification
// ---------------------------------------------------------------------------

describe('classifyDrawable', () => {
  const classification: ImageClassification = {
    tileKeys: new Set(['a', 'b', 'ch']),
    wordKeys: new Set(['act', 'bat']),
  };

  it('classifies avatar images', () => {
    expect(classifyDrawable('zz_avatar01', classification)).toBe('avatars');
    expect(classifyDrawable('zz_avatar12', classification)).toBe('avatars');
  });

  it('classifies avataricon images', () => {
    expect(classifyDrawable('zz_avataricon01', classification)).toBe('avataricons');
  });

  it('classifies word images (primary)', () => {
    expect(classifyDrawable('act', classification)).toBe('words');
    expect(classifyDrawable('bat', classification)).toBe('words');
  });

  it('classifies word distractor images (stem2)', () => {
    // "act2" -> strip "2" -> "act" -> word
    expect(classifyDrawable('act2', classification)).toBe('words');
    expect(classifyDrawable('bat2', classification)).toBe('words');
  });

  it('classifies tile images', () => {
    expect(classifyDrawable('a', classification)).toBe('tiles');
    expect(classifyDrawable('ch', classification)).toBe('tiles');
  });

  it('puts unmatched images in other', () => {
    expect(classifyDrawable('some_unknown_img', classification)).toBe('other');
  });
});

// ---------------------------------------------------------------------------
// Density-variant dedup (CRLF->LF is tested in mini-parser tests)
// ---------------------------------------------------------------------------

describe('density variant dedup', () => {
  it('only xxxhdpi variants are used (rsync script selects that dir)', () => {
    // The rsync script reads only from drawable-xxxhdpi for avatars/avataricons.
    // This test documents the contract: lower-density variants should not be present.
    // Since the actual dedup is a directory-selection decision (not a runtime filter),
    // we verify the classification at the drawable-xxxhdpi level returns correct cats.
    const cls: ImageClassification = { tileKeys: new Set(), wordKeys: new Set() };
    expect(classifyDrawable('zz_avatar01', cls)).toBe('avatars');
    expect(classifyDrawable('zz_avataricon01', cls)).toBe('avataricons');
  });
});
