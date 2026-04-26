/**
 * Build the Colombia keyboard for the active round.
 *
 * Port of Colombia.java loadKeyboard() (~line 158). One pure function fanned out
 * across (variant, challengeLevel) per design D2.
 *
 * Java parity quirks:
 *   - CL1 keeps duplicates ("Will list <a> twice if <a> is needed twice", line 165).
 *   - CL2 distractor draw is RANDOM via tileList.returnRandomDistractorTile /
 *     syllableList.returnRandomDistractorSyllable (NOT first-of-trio).
 *   - CL3-T uses keyList from aa_keyboard.txt (paginated when keysInUse > 35).
 *   - CL3-S capped at 18 (no pagination).
 *   - CL4-T deduped tileList, type-colored (C→colorList[1], V→2, T→3, else 4).
 *   - Pagination math uses literal 33 keys/page (not tilesPerPage - 2).
 */
import type { LangAssets } from '@alphaTiles/data-language-assets';
import type { ParsedTile } from '@shared/util-phoneme';
import type { ChallengeLevel, ColombiaVariant, KeyTile } from './types';
import { shuffleArray } from './shuffleArray';
import { paginateKeyboard, TILES_PER_PAGE, SYLS_PER_PAGE } from './paginateKeyboard';
import { drawTileDistractor } from './drawTileDistractor';
import { drawSyllableDistractor } from './drawSyllableDistractor';
import type { SyllableRow } from './drawSyllableDistractor';

export type TileRow = LangAssets['tiles']['rows'][number];
export type KeyboardKey = LangAssets['keys']['rows'][number];

export type BuildKeyboardArgs = {
  level: ChallengeLevel;
  variant: ColombiaVariant;
  parsedTiles: ParsedTile[];
  parsedSyllables: SyllableRow[];
  tileList: TileRow[];
  syllableList: SyllableRow[];
  keyList: KeyboardKey[];
  colorList: string[];
  sadStrings?: ReadonlySet<string>;
  rng?: () => number;
};

export type BuildKeyboardResult = {
  keys: KeyTile[];
  /** keysInUse — total entries in keys[]. */
  visible: number;
  paginated: boolean;
  totalScreens: number;
  partial: number;
};

const TYPE_COLOR_INDEX: Record<string, number> = {
  C: 1,
  V: 2,
  T: 3,
};

function colorAt(colorList: string[], i: number): string {
  return colorList[i] ?? '#666666';
}

function cycleColor(colorList: string[], k: number): string {
  // Java: colorList.get(k % 5)
  return colorAt(colorList, k % 5);
}

function tileTypeColor(type: string | undefined, colorList: string[]): string {
  const idx = type !== undefined && TYPE_COLOR_INDEX[type] !== undefined
    ? TYPE_COLOR_INDEX[type]
    : 4;
  return colorAt(colorList, idx);
}

export function buildKeyboard(args: BuildKeyboardArgs): BuildKeyboardResult {
  const {
    level, variant, parsedTiles, parsedSyllables,
    tileList, syllableList, keyList, colorList,
    sadStrings = new Set<string>(),
    rng = Math.random,
  } = args;

  const tilesByBase = new Map<string, TileRow>();
  for (const t of tileList) tilesByBase.set(t.base, t);

  switch (level) {
    case 1: {
      if (variant === 'S') {
        const shuffled = shuffleArray(parsedSyllables, rng);
        const keys: KeyTile[] = shuffled.map((s, k) => ({
          text: s.syllable,
          bgColor: cycleColor(colorList, k),
        }));
        return { keys, visible: keys.length, paginated: false, totalScreens: 1, partial: 0 };
      }
      const shuffled = shuffleArray(parsedTiles, rng);
      const keys: KeyTile[] = shuffled.map((t, k) => ({
        text: t.base,
        bgColor: cycleColor(colorList, k),
        type: t.typeOfThisTileInstance,
      }));
      return { keys, visible: keys.length, paginated: false, totalScreens: 1, partial: 0 };
    }

    case 2: {
      if (variant === 'S') {
        const list: SyllableRow[] = [...parsedSyllables];
        const numCorrect = parsedSyllables.length;
        for (let n = 0; n < numCorrect; n++) {
          const distractor = drawSyllableDistractor({
            target: list[n], pool: syllableList, sadStrings, tilesByBase, rng,
          });
          list.push(distractor);
        }
        const shuffled = shuffleArray(list, rng);
        const keys: KeyTile[] = shuffled.map((s, k) => ({
          text: s.syllable,
          bgColor: cycleColor(colorList, k),
        }));
        return { keys, visible: keys.length, paginated: false, totalScreens: 1, partial: 0 };
      }
      const list: TileRow[] = parsedTiles
        .map((p) => tilesByBase.get(p.base) ?? null)
        .filter((t): t is TileRow => t !== null);
      const numCorrect = list.length;
      for (let n = 0; n < numCorrect; n++) {
        const distractor = drawTileDistractor({
          target: list[n], tilesByBase, allTiles: tileList, rng,
        });
        list.push(distractor);
      }
      const shuffled = shuffleArray(list, rng);
      const keys: KeyTile[] = shuffled.map((t, k) => ({
        text: t.base,
        bgColor: cycleColor(colorList, k),
        type: t.type,
      }));
      return { keys, visible: keys.length, paginated: false, totalScreens: 1, partial: 0 };
    }

    case 3: {
      if (variant === 'S') {
        const list: SyllableRow[] = [...parsedSyllables];
        const fillCount = Math.max(0, SYLS_PER_PAGE - parsedSyllables.length);
        for (let n = 0; n < fillCount; n++) {
          const target = list[n] ?? parsedSyllables[n % Math.max(parsedSyllables.length, 1)];
          if (!target) break;
          const distractor = drawSyllableDistractor({
            target, pool: syllableList, sadStrings, tilesByBase, rng,
          });
          list.push(distractor);
        }
        const shuffled = shuffleArray(list, rng);
        const keys: KeyTile[] = shuffled.map((s, k) => ({
          text: s.syllable,
          bgColor: cycleColor(colorList, k),
        }));
        return { keys, visible: keys.length, paginated: false, totalScreens: 1, partial: 0 };
      }
      const keysInUse = keyList.length;
      const colored: KeyTile[] = keyList.map((k) => ({
        text: k.key,
        bgColor: colorAt(colorList, parseInt(k.color, 10) || 0),
      }));
      const paginated = keysInUse > TILES_PER_PAGE;
      const pg = paginateKeyboard(keysInUse, paginated);
      return { keys: colored, visible: keysInUse, ...pg };
    }

    case 4: {
      if (variant === 'S') {
        return { keys: [], visible: 0, paginated: false, totalScreens: 1, partial: 0 };
      }
      const deduped: TileRow[] = [];
      for (const t of tileList) {
        const prev = deduped[deduped.length - 1];
        if (!prev || prev.base !== t.base) {
          deduped.push(t);
        }
      }
      const keys: KeyTile[] = deduped.map((t) => ({
        text: t.base,
        bgColor: tileTypeColor(t.type, colorList),
        type: t.type,
      }));
      const keysInUse = keys.length;
      const paginated = keysInUse > TILES_PER_PAGE;
      const pg = paginateKeyboard(keysInUse, paginated);
      return { keys, visible: keysInUse, ...pg };
    }
  }
}
