/**
 * Per-pack stroke-data checks (game-taiwan).
 *
 * Behaviour:
 * - Non-Chinese packs: skip (no errors, no warnings).
 * - Chinese packs: warn for hanzi present in aa_gametiles.txt that lack
 *   a corresponding strokes/<char>.json file (coverage gap).
 * - Any pack: error on malformed strokes/<char>.json (invalid JSON, missing
 *   `strokes` / `medians` arrays, or mismatched lengths).
 *
 * The strokes/ directory is optional; absence on Chinese packs is treated as
 * a coverage gap for every hanzi tile (warning each).
 */
import type { Issue } from '../Issue';
import type { FileInventory } from '../FileInventory';
import type { ParsedPack } from '@shared/util-lang-pack-parser';
import { ISSUE_CODES } from '../issueCodes';

const CATEGORY = 'stroke-data';

function isHan(ch: string): boolean {
  const cp = ch.codePointAt(0);
  if (cp === undefined) return false;
  return (
    (cp >= 0x4e00 && cp <= 0x9fff) ||
    (cp >= 0x3400 && cp <= 0x4dbf) ||
    (cp >= 0x20000 && cp <= 0x2a6df)
  );
}

export function checkStrokeData(parsed: ParsedPack, inventory: FileInventory): Issue[] {
  const issues: Issue[] = [];

  const fileContents = inventory.strokeFileContents ?? {};

  // Shape errors apply to ANY pack that ships strokes/.
  for (const ch of Object.keys(fileContents)) {
    const raw = fileContents[ch];
    let parsedJson: { character?: unknown; strokes?: unknown; medians?: unknown };
    try {
      parsedJson = JSON.parse(raw);
    } catch {
      issues.push(malformed(ch, 'invalid JSON'));
      continue;
    }
    if (!Array.isArray(parsedJson.strokes)) {
      issues.push(malformed(ch, '`strokes` is not an array'));
      continue;
    }
    if (!Array.isArray(parsedJson.medians)) {
      issues.push(malformed(ch, '`medians` is not an array'));
      continue;
    }
    if (parsedJson.strokes.length !== parsedJson.medians.length) {
      issues.push(
        malformed(
          ch,
          `strokes.length (${parsedJson.strokes.length}) !== medians.length (${parsedJson.medians.length})`,
        ),
      );
    }
  }

  // Coverage warnings only for Chinese-script packs.
  const scriptType = (parsed.langInfo.find('Script type') ?? '').trim().toLowerCase();
  if (scriptType !== 'chinese') return issues;

  const covered = new Set(inventory.strokeChars ?? []);
  const seenInTiles = new Set<string>();
  for (const tile of parsed.tiles.rows) {
    for (const ch of [...tile.base.trim()]) {
      if (!isHan(ch)) continue;
      seenInTiles.add(ch);
    }
  }

  for (const ch of seenInTiles) {
    if (!covered.has(ch)) {
      issues.push({
        severity: 'warning',
        code: ISSUE_CODES.STROKE_COVERAGE_GAP,
        category: CATEGORY,
        message: `Chinese-script pack is missing stroke data for "${ch}" (no strokes/${ch}.json)`,
        context: { character: ch },
      });
    }
  }

  return issues;
}

function malformed(ch: string, reason: string): Issue {
  return {
    severity: 'error',
    code: ISSUE_CODES.STROKE_DATA_MALFORMED,
    category: CATEGORY,
    file: `strokes/${ch}.json`,
    message: `strokes/${ch}.json is malformed: ${reason}`,
    context: { character: ch, reason },
  };
}
