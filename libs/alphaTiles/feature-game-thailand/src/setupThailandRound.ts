import type { LangAssets } from '@alphaTiles/data-language-assets';
import type { ThailandType } from './decodeThailandChallengeLevel';
import { firstAudibleTile } from './firstAudibleTile';
import { verifyFreshTile } from './verifyFreshTile';

// Java 258, 279: CL1 rejects ref tiles whose typeOfThisTileInstance matches
// these regex patterns (T = tone mark, AD/D = diacritic, PC = placeholder
// consonant — and C for the standalone TILE_LOWER path).
const CL1_REJECT_REF_TILE = /^(T|AD|D|PC)$/;
const CL1_REJECT_STANDALONE_TILE = /^(T|AD|C|PC)$/;
const COR_V = /^(C|V)$/;

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

/**
 * Java parity: returns the base text of `firstAudibleTile(word)`. Falls back
 * to the longest-prefix tile or the first character if the parser produced
 * nothing (defensive — should not happen for validated packs).
 *
 * Note: full Java match parity (Thailand.java 524-527) also requires
 * `typeOfThisTileInstance` equality. That deeper parity is captured in the
 * spec but lives outside this base-text helper — see firstAudibleTile.ts.
 */
function getFirstTileBase(wordRow: WordRow, tiles: TileRow[]): string {
  const tile = firstAudibleTile(wordRow, tiles);
  if (tile) return tile.base;
  const lopNorm = wordRow.wordInLOP.replace(/[#.]/g, '');
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

/**
 * Pick the first item from `pool` for which `accept(item, retries)` returns
 * true. `retries` starts at 0 and increments per scanned candidate so the
 * acceptor (typically `verifyFreshTile`) can give up after 25 attempts —
 * matching Java's `freshChecks > 25` escape (Thailand.java 424-435).
 */
function pickWithRetries<T>(
  pool: T[],
  accept: (item: T, freshChecks: number) => boolean,
): T | null {
  let freshChecks = 0;
  for (const item of pool) {
    if (accept(item, freshChecks)) return item;
    freshChecks++;
  }
  // Past 25 attempts the acceptor short-circuits; fall back to first item
  // so we never deadlock on a small content pool.
  return pool[0] ?? null;
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

  // CL1 ref-tile rejection (Java 157, 178, 199, 258, 279) — when distractor
  // strategy is 1, structural tile types are unsuitable refs.
  const cl1Reject = (tile: TileRow, pattern: RegExp): boolean =>
    distractorStrategy === 1 && pattern.test(tile.type);

  if (isTileBased(refType) && isTileBased(choiceType)) {
    // Standalone tile pick (Java 252-262): TILE_LOWER/TILE_AUDIO additionally
    // require the chosen tile to be a Consonant or Vowel (`CorV`), and CL1
    // rejects T|AD|C|PC.
    const needsCorV = refType === 'TILE_LOWER' || refType === 'TILE_AUDIO';
    const refTile = pickWithRetries(shuffledTiles, (t, freshChecks) => {
      if (needsCorV && !COR_V.test(t.type)) return false;
      if (cl1Reject(t, CL1_REJECT_STANDALONE_TILE)) return false;
      return verifyFreshTile(t.base, recentRefStrings, freshChecks);
    });
    if (!refTile) return { error: 'insufficient-content' };
    ref = { kind: 'tile', tileRow: refTile, display: refType };
    rawChoiceItems = returnFourTileChoices(refTile, distractorStrategy, tiles, choiceType, rng);
  } else if (isTileBased(refType) && isWordBased(choiceType)) {
    // Word-based ref tile (Java 146-211): pick a word whose firstAudibleTile
    // satisfies CL1 rejection (T|AD|D|PC) and freshness.
    const refWord = pickWithRetries(shuffledWords, (w, freshChecks) => {
      const tile = firstAudibleTile(w, tiles);
      if (!tile) return false;
      if (cl1Reject(tile, CL1_REJECT_REF_TILE)) return false;
      return verifyFreshTile(tile.base, recentRefStrings, freshChecks);
    });
    if (!refWord) return { error: 'insufficient-content' };
    const refTileBase = getFirstTileBase(refWord, tiles);
    ref = {
      kind: 'tile',
      tileRow: tiles.find((t) => t.base === refTileBase) ?? tiles[0],
      display: refType,
    };
    rawChoiceItems = returnFourWordChoices(refWord, refTileBase, distractorStrategy, tiles, words, rng);
  } else if (isWordBased(refType) && isWordBased(choiceType)) {
    const refWord = pickWithRetries(shuffledWords, (w, freshChecks) =>
      verifyFreshTile(w.wordInLOP, recentRefStrings, freshChecks),
    );
    if (!refWord) return { error: 'insufficient-content' };
    const refTileBase = getFirstTileBase(refWord, tiles);
    ref = { kind: 'word', wordRow: refWord, display: refType };
    rawChoiceItems = returnFourWordChoices(refWord, refTileBase, distractorStrategy, tiles, words, rng);
  } else if (isWordBased(refType) && isTileBased(choiceType)) {
    const refWord = pickWithRetries(shuffledWords, (w, freshChecks) =>
      verifyFreshTile(w.wordInLOP, recentRefStrings, freshChecks),
    );
    if (!refWord) return { error: 'insufficient-content' };
    const refTileBase = getFirstTileBase(refWord, tiles);
    const refTileRow = tiles.find((t) => t.base === refTileBase) ?? tiles[0];
    ref = { kind: 'word', wordRow: refWord, display: refType };
    rawChoiceItems = returnFourTileChoices(refTileRow, distractorStrategy, tiles, choiceType, rng);
  } else if (isSyllableBased(refType) && isSyllableBased(choiceType)) {
    const refSyllable = pickWithRetries(shuffledSyllables, (s, freshChecks) =>
      verifyFreshTile(s.syllable, recentRefStrings, freshChecks),
    );
    if (!refSyllable) return { error: 'insufficient-content' };
    ref = { kind: 'syllable', syllableRow: refSyllable, display: refType };
    rawChoiceItems = returnFourSyllableChoices(refSyllable.syllable, syllables, distractorStrategy, rng);
  } else if (isSyllableBased(refType) && isWordBased(choiceType)) {
    const refSyllable = pickWithRetries(shuffledSyllables, (s, freshChecks) =>
      verifyFreshTile(s.syllable, recentRefStrings, freshChecks),
    );
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
