import { LangPackParseError } from './LangPackParseError';
import { splitLines } from './internal/splitLines';

const FILE = 'aa_langinfo.txt';

/**
 * Normalize an aa_langinfo / aa_settings item label.
 *
 * Java's SettingsList / LangInfoList uses the raw label as the map key, which
 * includes the numeric prefix. To allow both `"1. Lang Name (In Local Lang)"`
 * and `"Lang Name (In Local Lang)"` to match (spec §D6 / requirement), we
 * strip the leading numeric prefix ("N. " or "N.") and trim.
 */
function normalizeLabel(label: string): string {
  return label.replace(/^\d+\.\s*/, '').trim();
}

/**
 * Parse aa_langinfo.txt — two columns: Item, Answer.
 *
 * Java reference: Start.java buildLangInfoList() (~line 720).
 * Java stores entries in a LangInfoList (map keyed by raw Item label).
 *
 * Design decision D6: returns a label-keyed accessor object.
 * - `find(label)` accepts both the normalized label and the raw label (numeric prefix included).
 * - Throws LangPackParseError on duplicate normalized label.
 *
 * Fixture: engEnglish4/res/raw/aa_langinfo.txt (14 data rows)
 *
 * @returns `{ entries: Array<{label, value}>, find(label): string | undefined }`
 */
export function parseLangInfo(src: string) {
  const lines = splitLines(src);
  if (lines.length === 0) {
    throw new LangPackParseError({ file: FILE, line: 0, reason: 'file is empty' });
  }

  // Skip header (line 1)
  const dataLines = lines.slice(1);

  const entries: Array<{ label: string; normalizedLabel: string; value: string }> = [];
  const seen = new Map<string, number>(); // normalizedLabel -> 1-based line number

  dataLines.forEach((line, i) => {
    const lineNumber = i + 2;
    const tabIndex = line.indexOf('\t');
    let rawLabel: string;
    let value: string;

    if (tabIndex === -1) {
      // Line has no tab: treat entire line as label, value is empty.
      rawLabel = line.trim();
      value = '';
    } else {
      rawLabel = line.slice(0, tabIndex).trim();
      value = line.slice(tabIndex + 1).trim();
    }

    const normalized = normalizeLabel(rawLabel);

    if (seen.has(normalized)) {
      throw new LangPackParseError({
        file: FILE,
        line: lineNumber,
        column: normalized,
        reason: 'duplicate label',
      });
    }
    seen.set(normalized, lineNumber);
    entries.push({ label: rawLabel, normalizedLabel: normalized, value });
  });

  function find(label: string): string | undefined {
    const normalized = normalizeLabel(label);
    const entry = entries.find(
      (e) => e.normalizedLabel === normalized || e.label === label,
    );
    return entry?.value;
  }

  return { entries: entries.map((e) => ({ label: e.label, value: e.value })), find };
}
