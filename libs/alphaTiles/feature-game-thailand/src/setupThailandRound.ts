import type { LangAssets } from '@alphaTiles/data-language-assets';
import type { ThailandType } from './decodeThailandChallengeLevel';

type TileRow = LangAssets['tiles']['rows'][number];
type WordRow = LangAssets['words']['rows'][number];
type SyllableRow = LangAssets['syllables']['rows'][number];

export type ThailandChoice =
  | { kind: 'tile'; tileRow: TileRow; displayText: string }
  | { kind: 'word'; wordRow: WordRow }
  | { kind: 'syllable'; syllableRow: SyllableRow };

export type ThailandRef =
  | { kind: 'tile'; tileRow: TileRow; display: ThailandType }
  | { kind: 'word'; wordRow: WordRow; display: ThailandType }
  | { kind: 'syllable'; syllableRow: SyllableRow; display: ThailandType };

export type ThailandRound = {
  ref: ThailandRef;
  choices: [ThailandChoice, ThailandChoice, ThailandChoice, ThailandChoice];
  correctIndex: number;
};

type SetupThailandRoundOpts = {
  refType: ThailandType;
  choiceType: ThailandType;
  distractorStrategy: 1 | 2 | 3;
  tiles: TileRow[];
  words: WordRow[];
  syllables: SyllableRow[];
  recentRefStrings?: string[];
  rng?: () => number;
};

function randInt(max: number, rng: () => number): number {
  return Math.floor(rng() * max);
}

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = randInt(i + 1, rng);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function isTileBased(t: ThailandType): boolean {
  return t === 'TILE_LOWER' || t === 'TILE_UPPER' || t === 'TILE_AUDIO';
}

function isWordBased(t: ThailandType): boolean {
  return t === 'WORD_TEXT' || t === 'WORD_IMAGE' || t === 'WORD_AUDIO';
}

function isSyllableBased(t: ThailandType): boolean {
  return t === 'SYLLABLE_TEXT' || t === 'SYLLABLE_AUDIO';
}

// TODO(thailand-spec-drift): replace with `firstAudibleTile(Word)` per Java 633-646:
// skip a leading LV when followed by non-PC, then advance past PC|AD|D|T tiles via
// the parsed-tile sequence. Match comparisons (Java 524-527) ALSO need
// `typeOfThisTileInstance` parity which this string-prefix approach cannot express.
function getFirstTileBase(wordRow: WordRow, tiles: TileRow[]): string {
  const lopNorm = wordRow.wordInLOP.replace(/[#.]/g, '');
  const sorted = [...tiles].sort((a, b) => b.base.length - a.base.length);
  for (const tile of sorted) {
    if (lopNorm.startsWith(tile.base)) return tile.base;
  }
  return lopNorm.charAt(0);
}

function buildTileChoiceText(tile: TileRow, choiceType: ThailandType): string {
  if (choiceType === 'TILE_UPPER') return tile.upper || tile.base;
  return tile.base;
}

function returnFourTileChoices(
  correctTile: TileRow,
  distractorStrategy: 1 | 2 | 3,
  tiles: TileRow[],
  choiceType: ThailandType,
  rng: () => number,
): TileRow[] {
  const result: TileRow[] = [correctTile];
  const added = new Set<string>([correctTile.base]);
  const correctText = buildTileChoiceText(correctTile, choiceType);
  const distTexts = [correctTile.alt1, correctTile.alt2, correctTile.alt3];

  if (distractorStrategy === 1) {
    const pool = shuffle(tiles, rng);
    for (const tile of pool) {
      if (result.length >= 4) break;
      if (added.has(tile.base)) continue;
      const tileText = buildTileChoiceText(tile, choiceType);
      if (tileText.charAt(0).toLowerCase() === correctText.charAt(0).toLowerCase()) continue;
      added.add(tile.base);
      result.push(tile);
    }
  } else {
    for (const distText of distTexts) {
      if (result.length >= 4) break;
      if (!distText || distText === 'none' || added.has(distText)) continue;
      const distTile = tiles.find((t) => t.base === distText);
      if (!distTile) continue;
      added.add(distTile.base);
      result.push(distTile);
    }
    if (result.length < 4) {
      const pool = shuffle(tiles, rng);
      for (const tile of pool) {
        if (result.length >= 4) break;
        if (added.has(tile.base)) continue;
        added.add(tile.base);
        result.push(tile);
      }
    }
  }

  return shuffle(result, rng);
}

function returnFourWordChoices(
  refWord: WordRow,
  refTileBase: string,
  distractorStrategy: 1 | 2 | 3,
  tiles: TileRow[],
  words: WordRow[],
  rng: () => number,
): WordRow[] {
  const refTile = tiles.find((t) => t.base === refTileBase);
  const distTexts = refTile ? [refTile.alt1, refTile.alt2, refTile.alt3] : [];

  const easy: WordRow[] = [];
  const moderate: WordRow[] = [];
  const hard: WordRow[] = [];

  for (const word of words) {
    if (word.wordInLOP === refWord.wordInLOP) continue;
    const firstTile = getFirstTileBase(word, tiles);
    const isDistractor = distTexts.includes(firstTile);
    const isSame = firstTile === refTileBase;
    if (!isSame && !isDistractor) easy.push(word);
    else if (isDistractor) moderate.push(word);
    else if (isSame) hard.push(word);
  }

  const easyShuffled = shuffle(easy, rng);
  const modShuffled = shuffle(moderate, rng);
  const hardShuffled = shuffle(hard, rng);

  const result: WordRow[] = [refWord];

  function fillFrom(pool: WordRow[]): boolean {
    for (const w of pool) {
      if (result.length >= 4) return true;
      if (!result.includes(w)) result.push(w);
    }
    return result.length >= 4;
  }

  if (distractorStrategy === 1) {
    if (!fillFrom(easyShuffled)) { if (!fillFrom(modShuffled)) { fillFrom(hardShuffled); } }
  } else if (distractorStrategy === 2) {
    if (!fillFrom(modShuffled)) { if (!fillFrom(easyShuffled)) { fillFrom(hardShuffled); } }
  } else {
    if (!fillFrom(hardShuffled)) { if (!fillFrom(modShuffled)) { fillFrom(easyShuffled); } }
  }

  return shuffle(result, rng);
}

function returnFourSyllableWordChoices(
  refSyllableText: string,
  syllables: SyllableRow[],
  words: WordRow[],
  distractorStrategy: 1 | 2 | 3,
  rng: () => number,
): WordRow[] {
  const syllableRow = syllables.find((s) => s.syllable === refSyllableText);
  const distTexts: string[] = syllableRow ? [...syllableRow.distractors] : [];
  const shuffledWords = shuffle(words, rng);

  const result: WordRow[] = [];
  const added = new Set<string>();

  function getFirstSyllable(word: WordRow): string {
    return word.wordInLOP.replace(/[#]/g, '').split('.')[0] ?? '';
  }

  for (const word of shuffledWords) {
    if (result.length >= 1) break;
    if (getFirstSyllable(word) === refSyllableText) {
      result.push(word);
      added.add(word.wordInLOP);
    }
  }

  if (distractorStrategy === 1) {
    for (const word of shuffledWords) {
      if (result.length >= 4) break;
      if (added.has(word.wordInLOP)) continue;
      const first = getFirstSyllable(word);
      if (first !== refSyllableText && !distTexts.includes(first)) {
        result.push(word);
        added.add(word.wordInLOP);
      }
    }
  } else {
    for (const word of shuffledWords) {
      if (result.length >= 4) break;
      if (added.has(word.wordInLOP)) continue;
      const first = getFirstSyllable(word);
      if (first !== refSyllableText && distTexts.includes(first)) {
        result.push(word);
        added.add(word.wordInLOP);
      }
    }
    for (const word of shuffledWords) {
      if (result.length >= 4) break;
      if (added.has(word.wordInLOP)) continue;
      result.push(word);
      added.add(word.wordInLOP);
    }
  }

  return shuffle(result, rng);
}

function returnFourSyllableChoices(
  refSyllableText: string,
  syllables: SyllableRow[],
  distractorStrategy: 1 | 2 | 3,
  rng: () => number,
): SyllableRow[] {
  const syllableRow = syllables.find((s) => s.syllable === refSyllableText);
  if (!syllableRow) return [];

  const result: SyllableRow[] = [syllableRow];
  const added = new Set<string>([refSyllableText]);
  const distTexts: string[] = [...syllableRow.distractors];

  if (distractorStrategy === 1) {
    const pool = shuffle(syllables, rng);
    for (const s of pool) {
      if (result.length >= 4) break;
      if (added.has(s.syllable)) continue;
      if (distTexts.includes(s.syllable)) continue;
      result.push(s);
      added.add(s.syllable);
    }
  } else {
    for (const distText of distTexts) {
      if (result.length >= 4) break;
      if (!distText || added.has(distText)) continue;
      const s = syllables.find((x) => x.syllable === distText);
      if (!s) continue;
      result.push(s);
      added.add(distText);
    }
    const pool = shuffle(syllables, rng);
    for (const s of pool) {
      if (result.length >= 4) break;
      if (added.has(s.syllable)) continue;
      result.push(s);
      added.add(s.syllable);
    }
  }

  return shuffle(result, rng);
}

// TODO(thailand-spec-drift): impl `verifyFreshTile` (Java 424-435) — last-3 anti-repeat
// must allow break after 25 retry attempts; current isRecent never gives up. Also missing:
// CL1 ref-tile filter (reject T|AD|D|PC tiles per Java 157, 178, 199, 258, 279) and
// CorV gate for standalone TILE_LOWER/TILE_AUDIO ref picks (Java 252).
function isRecent(text: string, recent: string[]): boolean {
  return recent.some((r) => r.toLowerCase() === text.toLowerCase());
}

export function setupThailandRound(
  opts: SetupThailandRoundOpts,
): ThailandRound | { error: 'insufficient-content' } {
  const {
    refType,
    choiceType,
    distractorStrategy,
    tiles,
    words,
    syllables,
    recentRefStrings = [],
    rng = Math.random,
  } = opts;

  const shuffledTiles = shuffle(tiles, rng);
  const shuffledWords = shuffle(words, rng);
  const shuffledSyllables = shuffle(syllables, rng);

  let ref: ThailandRef | null = null;
  let rawChoiceItems: (TileRow | WordRow | SyllableRow)[] = [];

  if (isTileBased(refType) && isTileBased(choiceType)) {
    const refTile =
      shuffledTiles.find((t) => !isRecent(t.base, recentRefStrings)) ?? shuffledTiles[0];
    if (!refTile) return { error: 'insufficient-content' };
    ref = { kind: 'tile', tileRow: refTile, display: refType };
    rawChoiceItems = returnFourTileChoices(refTile, distractorStrategy, tiles, choiceType, rng);
  } else if (isTileBased(refType) && isWordBased(choiceType)) {
    const refWord =
      shuffledWords.find((w) => !isRecent(getFirstTileBase(w, tiles), recentRefStrings)) ??
      shuffledWords[0];
    if (!refWord) return { error: 'insufficient-content' };
    const refTileBase = getFirstTileBase(refWord, tiles);
    ref = {
      kind: 'tile',
      tileRow: tiles.find((t) => t.base === refTileBase) ?? tiles[0],
      display: refType,
    };
    rawChoiceItems = returnFourWordChoices(refWord, refTileBase, distractorStrategy, tiles, words, rng);
  } else if (isWordBased(refType) && isWordBased(choiceType)) {
    const refWord =
      shuffledWords.find((w) => !isRecent(w.wordInLOP, recentRefStrings)) ?? shuffledWords[0];
    if (!refWord) return { error: 'insufficient-content' };
    const refTileBase = getFirstTileBase(refWord, tiles);
    ref = { kind: 'word', wordRow: refWord, display: refType };
    rawChoiceItems = returnFourWordChoices(refWord, refTileBase, distractorStrategy, tiles, words, rng);
  } else if (isWordBased(refType) && isTileBased(choiceType)) {
    const refWord =
      shuffledWords.find((w) => !isRecent(w.wordInLOP, recentRefStrings)) ?? shuffledWords[0];
    if (!refWord) return { error: 'insufficient-content' };
    const refTileBase = getFirstTileBase(refWord, tiles);
    const refTileRow = tiles.find((t) => t.base === refTileBase) ?? tiles[0];
    ref = { kind: 'word', wordRow: refWord, display: refType };
    rawChoiceItems = returnFourTileChoices(refTileRow, distractorStrategy, tiles, choiceType, rng);
  } else if (isSyllableBased(refType) && isSyllableBased(choiceType)) {
    const refSyllable =
      shuffledSyllables.find((s) => !isRecent(s.syllable, recentRefStrings)) ??
      shuffledSyllables[0];
    if (!refSyllable) return { error: 'insufficient-content' };
    ref = { kind: 'syllable', syllableRow: refSyllable, display: refType };
    rawChoiceItems = returnFourSyllableChoices(refSyllable.syllable, syllables, distractorStrategy, rng);
  } else if (isSyllableBased(refType) && isWordBased(choiceType)) {
    const refSyllable =
      shuffledSyllables.find((s) => !isRecent(s.syllable, recentRefStrings)) ??
      shuffledSyllables[0];
    if (!refSyllable) return { error: 'insufficient-content' };
    ref = { kind: 'syllable', syllableRow: refSyllable, display: refType };
    rawChoiceItems = returnFourSyllableWordChoices(
      refSyllable.syllable,
      syllables,
      words,
      distractorStrategy,
      rng,
    );
  } else {
    return { error: 'insufficient-content' };
  }

  if (!ref || rawChoiceItems.length < 4) return { error: 'insufficient-content' };

  const buildChoice = (item: TileRow | WordRow | SyllableRow): ThailandChoice => {
    if ('syllable' in item) {
      return { kind: 'syllable', syllableRow: item as SyllableRow };
    }
    if ('wordInLOP' in item) {
      return { kind: 'word', wordRow: item as WordRow };
    }
    const tile = item as TileRow;
    return {
      kind: 'tile',
      tileRow: tile,
      displayText: buildTileChoiceText(tile, choiceType),
    };
  };

  const correctRawItem = rawChoiceItems[0];
  const fourChoiceItems = rawChoiceItems.slice(0, 4);
  const choices = fourChoiceItems.map(buildChoice) as [
    ThailandChoice,
    ThailandChoice,
    ThailandChoice,
    ThailandChoice,
  ];

  const correctIndex = fourChoiceItems.indexOf(correctRawItem);

  return {
    ref,
    choices,
    correctIndex: correctIndex >= 0 ? correctIndex : 0,
  };
}
