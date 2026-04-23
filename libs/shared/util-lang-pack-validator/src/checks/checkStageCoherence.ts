/**
 * Stage coherence checks.
 *
 * Java reference: StagesChecks.java#check (~line 1–88).
 *
 * Checks:
 * - For each word: compute correspondence ratio against cumulative tile set per stage 1..7
 *   (words with a numeric stageOfFirstAppearance always correspond ≥ that stage)
 * - Respects `stageCorrespondenceRatio` and `firstLetterStageCorrespondence` settings
 * - Emits info STAGE_WORD_COUNT per stage (word count + cumulative tile count)
 * - Emits warning EMPTY_STAGE for any stage with 0 corresponding words
 * - Emits error INVALID_TILE_STAGE for tiles with stageOfFirstAppearance > 7
 */

import type { Issue } from '../Issue';
import type { ParsedPack } from '@shared/util-lang-pack-parser';
import { ISSUE_CODES } from '../issueCodes';
import {
  parseWordIntoTiles,
} from '@shared/util-phoneme';
import type { TileEntry } from '@shared/util-phoneme';

const CATEGORY = 'stage-coherence';
const MAX_STAGE = 7;

// Default settings used when settings keys are absent
const DEFAULT_CORRESPONDENCE_RATIO = 0.7;
const DEFAULT_FIRST_LETTER_CORRESPONDENCE = false;

export function checkStageCoherence(
  parsed: ParsedPack,
  scriptType: Parameters<typeof parseWordIntoTiles>[0]['scriptType'] = 'Roman',
  placeholderCharacter = '◌',
): Issue[] {
  const issues: Issue[] = [];
  const { tiles, words, settings } = parsed;

  if (tiles.rows.length === 0 || words.rows.length === 0) return issues;

  // Read settings using helpers — fall back to Java defaults
  const stageCorrespondenceRatio = settings.findFloat(
    'Stage correspondence ratio',
    DEFAULT_CORRESPONDENCE_RATIO,
  );
  const firstLetterCorrespondence = settings.findBoolean(
    'First letter stage correspondence',
    DEFAULT_FIRST_LETTER_CORRESPONDENCE,
  );

  // Build tile structures
  const tileEntries: TileEntry[] = tiles.rows.map((r) => ({
    base: r.base,
    alt1: r.alt1,
    alt2: r.alt2,
    alt3: r.alt3,
    type: r.type,
    tileTypeB: r.tileTypeB,
    tileTypeC: r.tileTypeC,
    stageOfFirstAppearance: r.stageOfFirstAppearance,
    stageOfFirstAppearanceType2: r.stageOfFirstAppearanceType2,
    stageOfFirstAppearanceType3: r.stageOfFirstAppearanceType3,
    audioName: r.audioName,
    audioNameB: r.audioNameB,
    audioNameC: r.audioNameC,
  }));

  // INVALID_TILE_STAGE: tiles with stage > 7
  // Note: parser already clamps to 1..7 — this check catches future parser changes
  // or direct use of the check outside parsePack.
  for (let i = 0; i < tiles.rows.length; i++) {
    const t = tiles.rows[i];
    if (t.stageOfFirstAppearance > MAX_STAGE) {
      issues.push({
        severity: 'error',
        code: ISSUE_CODES.INVALID_TILE_STAGE,
        category: CATEGORY,
        file: 'aa_gametiles.txt',
        line: i + 2,
        message: `Tile "${t.base}" has stageOfFirstAppearance ${t.stageOfFirstAppearance} — maximum is ${MAX_STAGE}`,
        context: { tile: t.base, stage: t.stageOfFirstAppearance, max: MAX_STAGE },
      });
    }
  }

  // wordCounts[i] = number of words that correspond to stage (i+1)
  const wordCounts = new Array<number>(MAX_STAGE).fill(0);

  for (const word of words.rows) {
    const correspondences = new Array<number>(MAX_STAGE).fill(0);

    // If stageOfFirstAppearance is a numeric stage: that word matches stage N and all higher stages
    const stageParsed = parseInt(word.stageOfFirstAppearance, 10);
    if (!isNaN(stageParsed) && stageParsed >= 1) {
      for (let i = stageParsed - 1; i < MAX_STAGE; i++) {
        correspondences[i] = 1.0;
      }
    } else {
      // Parse word into tiles to compute per-stage correspondence ratios
      const parsedTiles = parseWordIntoTiles({
        wordInLOP: word.wordInLOP,
        mixedDefs: word.mixedDefs,
        tiles: tileEntries,
        scriptType,
        placeholderCharacter,
      });

      if (parsedTiles === null) continue;

      for (let stage = 1; stage <= MAX_STAGE; stage++) {
        // First-letter-correspondence shortcut: if first tile's stage > current stage → 0
        if (firstLetterCorrespondence && parsedTiles[0].stageOfFirstAppearanceForThisTileType > stage) {
          correspondences[stage - 1] = 0.0;
          continue;
        }

        let corresponding = 0;
        for (const tile of parsedTiles) {
          if (tile.stageOfFirstAppearanceForThisTileType <= stage) {
            corresponding++;
          }
        }
        correspondences[stage - 1] = corresponding / parsedTiles.length;
      }
    }

    for (let i = 0; i < MAX_STAGE; i++) {
      if (correspondences[i] >= stageCorrespondenceRatio) {
        wordCounts[i]++;
      }
    }
  }

  // Compute cumulative tile counts per stage (new tiles at each stage)
  const seenTileKeys = new Set<string>();
  const tileCounts = new Array<number>(MAX_STAGE).fill(0);

  for (const tileEntry of tileEntries) {
    // Java iterates tileList which expands multitype tiles — replicate by checking all types
    const typesToCheck: Array<{ type: string; stage: number }> = [
      { type: tileEntry.type, stage: tileEntry.stageOfFirstAppearance },
    ];
    if (tileEntry.tileTypeB !== 'none') {
      typesToCheck.push({ type: tileEntry.tileTypeB, stage: tileEntry.stageOfFirstAppearanceType2 });
    }
    if (tileEntry.tileTypeC !== 'none') {
      typesToCheck.push({ type: tileEntry.tileTypeC, stage: tileEntry.stageOfFirstAppearanceType3 });
    }

    for (const { type, stage } of typesToCheck) {
      const key = `${tileEntry.base}-${type}`;
      if (seenTileKeys.has(key)) continue;
      seenTileKeys.add(key);

      if (stage >= 1 && stage <= MAX_STAGE) {
        tileCounts[stage - 1]++;
      }
    }
  }

  // Emit STAGE_WORD_COUNT info per stage (matches Java str output structure)
  let cumulativeTileCount = 0;
  for (let i = 0; i < MAX_STAGE; i++) {
    cumulativeTileCount += tileCounts[i];
    const stage = i + 1;
    const newWords = i > 0 ? wordCounts[i] - wordCounts[i - 1] : wordCounts[i];
    const newTiles = tileCounts[i];

    issues.push({
      severity: 'info',
      code: ISSUE_CODES.STAGE_WORD_COUNT,
      category: CATEGORY,
      message: i === 0
        ? `Stage ${stage}: ${wordCounts[i]} words, ${cumulativeTileCount} tiles`
        : `Stage ${stage}: ${wordCounts[i]} words (${newWords} new), ${cumulativeTileCount} tiles (${newTiles} new)`,
      context: {
        stage,
        wordCount: wordCounts[i],
        newWords: i === 0 ? wordCounts[i] : newWords,
        tileCount: cumulativeTileCount,
        newTiles,
      },
    });

    if (wordCounts[i] === 0) {
      issues.push({
        severity: 'warning',
        code: ISSUE_CODES.EMPTY_STAGE,
        category: CATEGORY,
        message: `Stage ${stage} has 0 corresponding words — check stageOfFirstAppearance assignments`,
        context: { stage, stageCorrespondenceRatio },
      });
    }
  }

  return issues;
}
