/**
 * Logic for selecting a word and generating tile pairs with distractors.
 *
 * Port of UnitedStates.java:132–175 onCreate (pair generation).
 */
import {
  parseWordIntoTilesPreliminary,
  buildTileHashMap,
  getMultitypeTiles,
} from '@shared/util-phoneme';
import type { LangAssets } from '@alphaTiles/data-language-assets';
import type { UnitedStatesData } from './buildUnitedStatesData';

export type TilePair = {
  /** Text shown in the top position. */
  top: string;
  /** Text shown in the bottom position. */
  bottom: string;
  /** Which position holds the correct tile. */
  correct: 'top' | 'bottom';
};

export type RoundData = {
  word: LangAssets['words']['rows'][number];
  pairs: TilePair[];
};

type SetupRoundArgs = {
  unitedStatesData: UnitedStatesData;
  challengeLevel: number;
  assets: LangAssets;
  /** Optionally inject a random function for determinism in tests. */
  rng?: () => number;
};

/** Java `Start.ALT_COUNT` — number of alt slots per tile (alt1..alt3). */
const ALT_COUNT = 3;

/**
 * Picks a distractor by raw index into the alt slots, matching Java
 * `parsedRefWordTileArray.get(i).distractors.get(rand.nextInt(Start.ALT_COUNT))`
 * (UnitedStates.java:161). No filtering for empty / `'none'` / self — Java trusts
 * pack data; pack-validation is the language community's responsibility, not ours.
 */
function pickDistractor(allAlts: string[], rng: () => number): string {
  const idx = Math.floor(rng() * ALT_COUNT);
  return allAlts[idx] ?? '';
}

export function setupRound({
  unitedStatesData,
  challengeLevel,
  assets,
  rng = Math.random,
}: SetupRoundArgs): RoundData | { error: 'insufficient-content' } {
  // 1. Choose word pool by level
  let wordPool: LangAssets['words']['rows'];
  if (challengeLevel <= 1) {
    wordPool = unitedStatesData.level1Words;
  } else if (challengeLevel === 2) {
    wordPool = unitedStatesData.level2Words;
  } else {
    wordPool = unitedStatesData.level3Words;
  }

  if (wordPool.length === 0) {
    return { error: 'insufficient-content' };
  }

  // 2. Pick a random word
  const word = wordPool[Math.floor(rng() * wordPool.length)];

  // 3. Parse into tiles
  const tileRows = assets.tiles.rows;
  const placeholderChar = assets.langInfo.find('Placeholder character') ?? '◌';
  const tileMap = buildTileHashMap(tileRows, placeholderChar);
  const multitypeTiles = getMultitypeTiles(tileRows);

  const parsed = parseWordIntoTilesPreliminary(
    word.wordInLOP,
    word.mixedDefs,
    tileMap,
    multitypeTiles,
    placeholderChar,
  );

  if (!parsed || parsed.length === 0) {
    return { error: 'insufficient-content' };
  }

  // 4. For each tile, build a pair with one distractor
  const pairs: TilePair[] = parsed.map((tile) => {
    const correctText = tile.base;

    // Gather alternatives from the full tile entry
    const fullTile = tileMap.get(correctText) ??
      tileMap.get(placeholderChar + correctText) ??
      tileMap.get(correctText + placeholderChar) ??
      tileMap.get(placeholderChar + correctText + placeholderChar);

    const alts = fullTile ? [fullTile.alt1, fullTile.alt2, fullTile.alt3] : [];
    const distractorText = pickDistractor(alts, rng);

    // Randomize which slot is correct (top or bottom)
    const correctIsTop = rng() < 0.5;
    return {
      top: correctIsTop ? correctText : distractorText,
      bottom: correctIsTop ? distractorText : correctText,
      correct: correctIsTop ? 'top' : 'bottom',
    };
  });

  return { word, pairs };
}
