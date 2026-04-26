/**
 * Precompute for the Malaysia word browser.
 *
 * Builds `wordStagesByStage[i]` = words whose earliest fully-covered stage is
 * `i+1` (length 7). Mirrors `Start.java:buildWordStagesLists` (line 475) so the
 * Malaysia container can later select `wordStagesByStage[stage - 1]`
 * (`Malaysia.java:71, 81, 86`).
 *
 * Settings consumed (defaults match Java):
 * - "Stage correspondence ratio" → float (default 0.7)
 * - "Malaysia colorless" → boolean (default false)
 *
 * Done at boot via registerPrecompute (registered in app/registerPrecomputes.ts) so paginating a stage at runtime is O(N).
 */
import {
  parseWordIntoTiles,
  type ScriptType,
} from '@shared/util-phoneme';
import {
  tileStagesLists,
  wordStagesLists,
} from '@alphaTiles/util-stages';
import type { LangAssets } from '@alphaTiles/data-language-assets';

type WordRow = LangAssets['words']['rows'][number];
type TileRow = LangAssets['tiles']['rows'][number];

export type MalaysiaData = {
  /** length 7. wordStagesByStage[i] = words whose first appearance is stage i+1. */
  wordStagesByStage: WordRow[][];
  /** Cached from settings — when true, all rows use colorList[8]. */
  colorless: boolean;
};

const DEFAULT_CORRESPONDENCE_RATIO = 0.7;

export function malaysiaPreProcess(assets: LangAssets): MalaysiaData {
  const tileRows: TileRow[] = assets.tiles.rows;
  const wordRows: WordRow[] = assets.words.rows;
  const placeholderCharacter = assets.langInfo.find('Placeholder character') ?? '◌';
  const scriptType = (assets.langInfo.find('Script type') ?? 'Roman') as ScriptType;
  const correspondenceRatio = assets.settings.findFloat(
    'Stage correspondence ratio',
    DEFAULT_CORRESPONDENCE_RATIO,
  );
  // Java reads `colorless` flag from settings (Malaysia.java line 25, 108).
  const colorless = assets.settings.findBoolean('Malaysia colorless', false);

  // Stage 1..7 tile buckets keyed by tile.stageOfFirstAppearance.
  const tileStages = tileStagesLists(tileRows);

  // Words bucketed by earliest fully-covered stage.
  const wordStagesByStage = wordStagesLists(
    wordRows,
    tileStages,
    (word) => {
      const parsed = parseWordIntoTiles({
        wordInLOP: word.wordInLOP,
        mixedDefs: word.mixedDefs,
        tiles: tileRows,
        scriptType,
        placeholderCharacter,
      });
      // wordStagesLists treats an empty array as "skip this word for ratio
      // computation"; explicit overrides on the word still apply.
      return parsed === null ? [] : parsed;
    },
    correspondenceRatio,
  );

  return { wordStagesByStage, colorless };
}
