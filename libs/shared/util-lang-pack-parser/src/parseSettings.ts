import { LangPackParseError } from './LangPackParseError';
import { splitLines } from './internal/splitLines';

const FILE = 'aa_settings.txt';

/**
 * Normalize an aa_settings item label (same rule as parseLangInfo).
 * Strips leading "N. " numeric prefix and trims.
 */
function normalizeLabel(label: string): string {
  return label.replace(/^\d+\.\s*/, '').trim();
}

/**
 * Parse aa_settings.txt — two columns: Setting, Value.
 *
 * Java reference: Start.java buildSettingsList() (~line 694).
 * Java stores raw string values and casts at each call site.
 *
 * Design decision D7: all values stored as strings; cast helpers provided:
 * - `findBoolean(label, default)` — Java Boolean.parseBoolean semantics
 *   ("TRUE" | "True" | "true" → true; anything else → false).
 * - `findInt(label, default)` — falls back to default on NaN.
 * - `findFloat(label, default)` — falls back to default on NaN.
 *
 * Fixture: engEnglish4/res/raw/aa_settings.txt (17 data rows)
 *
 * @returns `{ entries, find, findBoolean, findInt, findFloat }`
 */
export function parseSettings(src: string) {
  const lines = splitLines(src);
  if (lines.length === 0) {
    throw new LangPackParseError({ file: FILE, line: 0, reason: 'file is empty' });
  }

  // Skip header (line 1)
  const dataLines = lines.slice(1);

  const entries: Array<{ label: string; normalizedLabel: string; value: string }> = [];

  dataLines.forEach((line, i) => {
    const lineNumber = i + 2;
    const tabIndex = line.indexOf('\t');
    let rawLabel: string;
    let value: string;

    if (tabIndex === -1) {
      rawLabel = line.trim();
      value = '';
    } else {
      rawLabel = line.slice(0, tabIndex).trim();
      value = line.slice(tabIndex + 1).trim();
    }

    const normalized = normalizeLabel(rawLabel);
    entries.push({ label: rawLabel, normalizedLabel: normalized, value });

    void lineNumber; // consumed for future error-reporting if needed
  });

  function find(label: string): string | undefined {
    const normalized = normalizeLabel(label);
    const entry = entries.find(
      (e) => e.normalizedLabel === normalized || e.label === label,
    );
    return entry?.value;
  }

  function findBoolean(label: string, defaultValue: boolean): boolean {
    const val = find(label);
    if (val === undefined || val === '') return defaultValue;
    // Java Boolean.parseBoolean: only "true" (case-insensitive) → true.
    return val.toLowerCase() === 'true';
  }

  function findInt(label: string, defaultValue: number): number {
    const val = find(label);
    if (val === undefined || val === '') return defaultValue;
    const n = parseInt(val, 10);
    return isNaN(n) ? defaultValue : n;
  }

  function findFloat(label: string, defaultValue: number): number {
    const val = find(label);
    if (val === undefined || val === '') return defaultValue;
    const n = parseFloat(val);
    return isNaN(n) ? defaultValue : n;
  }

  return {
    entries: entries.map((e) => ({ label: e.label, value: e.value })),
    find,
    findBoolean,
    findInt,
    findFloat,
  };
}
