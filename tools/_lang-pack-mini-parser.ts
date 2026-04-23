/**
 * Minimal reader for the four aa_*.txt files needed by rsync + manifest scripts.
 * Full parsing (tile stages, word stages, distractor logic, etc.) lives in the
 * `lang-pack-parser` change. This file is deliberately a tiny subset.
 *
 * Column layout verified against:
 *   ../AlphaTiles/app/src/main/java/org/alphatilesapps/alphatiles/Start.java
 *   - buildTileList():     col 0 = tile text, col 5 = AudioName, col 8 = AudioName2, col 10 = AudioName3
 *   - buildWordList():     col 0 = wordInLWC (English key), col 1 = wordInLOP
 *   - buildSyllableList(): col 0 = syllable text, col 4 = SyllableAudioName
 *   - aa_langinfo.txt:     tab-separated key->value pairs (row[0]=label, row[1]=value)
 */

import * as fs from 'fs';

/** Split a line on tab, trimming nothing (values may have leading/trailing spaces). */
function splitTab(line: string): string[] {
  return line.split('\t');
}

/** Strip BOM + normalize CRLF. */
function normalize(raw: string): string {
  return raw.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

// ---------------------------------------------------------------------------
// aa_langinfo.txt
// ---------------------------------------------------------------------------

export type LangInfo = {
  nameInLocalLang: string;
  nameInEnglish: string;
  ethnologueCode: string;
  gameNameInLocalLang: string;
  scriptDirection: 'LTR' | 'RTL';
  scriptType: string;
};

/**
 * Read `aa_langinfo.txt` and return a typed summary.
 * File format: two-column TSV (label \t value), no header row, ~14 rows.
 * Row indices are 1-based labels:
 *   1. Lang Name (In Local Lang)
 *   2. Lang Name (In English)
 *   4. Ethnologue code
 *   7. Game Name (In Local Lang)
 *   8. Script direction (LTR or RTL)
 *  11. Script type
 */
export function readLangInfo(filePath: string): LangInfo {
  if (!fs.existsSync(filePath)) {
    throw new Error(`aa_langinfo.txt not found: ${filePath}`);
  }
  const raw = normalize(fs.readFileSync(filePath, 'utf8'));
  const lines = raw.split('\n').filter((l) => l.trim().length > 0);

  const map = new Map<string, string>();
  for (const line of lines) {
    const cols = splitTab(line);
    if (cols.length >= 2) {
      // Strip leading "N. " prefix from label column for key
      const label = cols[0].replace(/^\d+\.\s*/, '').trim();
      map.set(label, cols[1].trim());
    }
  }

  const nameInLocalLang = map.get('Lang Name (In Local Lang)') ?? '';
  const nameInEnglish = map.get('Lang Name (In English)') ?? '';
  const ethnologueCode = map.get('Ethnologue code') ?? '';
  const gameNameInLocalLang = map.get('Game Name (In Local Lang)') ?? '';
  const rawDirection = map.get('Script direction (LTR or RTL)') ?? 'LTR';
  const scriptDirection: 'LTR' | 'RTL' = rawDirection.trim().toUpperCase() === 'RTL' ? 'RTL' : 'LTR';
  const scriptType = map.get('Script type') ?? '';

  if (!nameInLocalLang) {
    throw new Error(`aa_langinfo.txt missing "Lang Name (In Local Lang)": ${filePath}`);
  }

  return { nameInLocalLang, nameInEnglish, ethnologueCode, gameNameInLocalLang, scriptDirection, scriptType };
}

// ---------------------------------------------------------------------------
// aa_gametiles.txt
// ---------------------------------------------------------------------------

export type TileAudioEntry = {
  tileKey: string;
  audioNames: string[]; // all non-empty, non-"X", non-"none" audio names across Type/Type2/Type3
};

/**
 * Read `aa_gametiles.txt`, return the set of tile keys and their audio names.
 * Col 0 = tile text (key), col 5 = AudioName (Type1), col 8 = AudioName2 (Type2), col 10 = AudioName3 (Type3).
 * Audio names starting with "zz_no_audio_needed", "X", or "none" are excluded.
 */
export function readGameTiles(filePath: string): TileAudioEntry[] {
  if (!fs.existsSync(filePath)) return [];
  const raw = normalize(fs.readFileSync(filePath, 'utf8'));
  const lines = raw.split('\n').filter((l) => l.trim().length > 0);

  const INVALID = new Set(['none', 'x', 'zz_no_audio_needed']);
  const entries: TileAudioEntry[] = [];
  let header = true;

  for (const line of lines) {
    if (header) { header = false; continue; }
    const cols = splitTab(line);
    if (cols.length < 6) continue;
    const tileKey = cols[0].trim();
    if (!tileKey) continue;

    const rawAudioNames = [
      cols[5]?.trim() ?? '',
      cols[8]?.trim() ?? '',
      cols[10]?.trim() ?? '',
    ];
    const audioNames = rawAudioNames.filter(
      (n) => n.length > 0 && !INVALID.has(n.toLowerCase()),
    );
    entries.push({ tileKey, audioNames });
  }

  return entries;
}

/** Return the flat set of all audio file base names referenced by gametiles. */
export function gameTileAudioNames(filePath: string): Set<string> {
  const entries = readGameTiles(filePath);
  const names = new Set<string>();
  for (const e of entries) {
    for (const n of e.audioNames) names.add(n);
  }
  return names;
}

/** Return the set of tile keys (col 0). */
export function gameTileKeys(filePath: string): Set<string> {
  const entries = readGameTiles(filePath);
  return new Set(entries.map((e) => e.tileKey));
}

// ---------------------------------------------------------------------------
// aa_wordlist.txt
// ---------------------------------------------------------------------------

export type WordEntry = {
  wordLWC: string; // col 0 -- LWC key (English in eng pack)
  wordLOP: string; // col 1 -- Language-of-Play text
};

/**
 * Read `aa_wordlist.txt`, return word entries.
 * Col 0 = wordInLWC (the "English" key, also the audio/image file stem).
 * Col 1 = wordInLOP (the language-of-play text).
 */
export function readWordList(filePath: string): WordEntry[] {
  if (!fs.existsSync(filePath)) return [];
  const raw = normalize(fs.readFileSync(filePath, 'utf8'));
  const lines = raw.split('\n').filter((l) => l.trim().length > 0);

  const entries: WordEntry[] = [];
  let header = true;

  for (const line of lines) {
    if (header) { header = false; continue; }
    const cols = splitTab(line);
    if (cols.length < 2) continue;
    const wordLWC = cols[0].trim();
    const wordLOP = cols[1].trim();
    if (!wordLWC) continue;
    entries.push({ wordLWC, wordLOP });
  }

  return entries;
}

/** Return the set of word LWC keys (audio/image file stems). */
export function wordListKeys(filePath: string): Set<string> {
  return new Set(readWordList(filePath).map((e) => e.wordLWC));
}

// ---------------------------------------------------------------------------
// aa_syllables.txt
// ---------------------------------------------------------------------------

export type SyllableEntry = {
  syllable: string;         // col 0 -- syllable text
  audioName: string;        // col 4 -- SyllableAudioName
};

/**
 * Read `aa_syllables.txt`, return syllable entries.
 * Col 0 = syllable text, col 4 = SyllableAudioName.
 */
export function readSyllables(filePath: string): SyllableEntry[] {
  if (!fs.existsSync(filePath)) return [];
  const raw = normalize(fs.readFileSync(filePath, 'utf8'));
  const lines = raw.split('\n').filter((l) => l.trim().length > 0);

  const entries: SyllableEntry[] = [];
  let header = true;

  for (const line of lines) {
    if (header) { header = false; continue; }
    const cols = splitTab(line);
    if (cols.length < 5) continue;
    const syllable = cols[0].trim();
    const audioName = cols[4].trim();
    if (!syllable) continue;
    entries.push({ syllable, audioName });
  }

  return entries;
}

/** Return the set of syllable audio names. */
export function syllableAudioNames(filePath: string): Set<string> {
  return new Set(readSyllables(filePath).map((e) => e.audioName).filter(Boolean));
}

/** Return the set of syllable keys. */
export function syllableKeys(filePath: string): Set<string> {
  return new Set(readSyllables(filePath).map((e) => e.syllable));
}
