/**
 * Top-level choice assembly. Standardizes the correct text, builds 3 wrongs per CL,
 * inserts the correct in a random slot, returns 4 unique strings.
 *
 * On `null` from any CL builder we return `degenerate` — caller picks another word.
 */
import type { LangAssets } from '@alphaTiles/data-language-assets';
import type { ParsedTile, ScriptType, TileEntry } from '@shared/util-phoneme';
import { standardizeWordSequence } from '@shared/util-phoneme';
import { buildWrongCL1 } from './buildWrongCL1';
import { buildWrongCL2 } from './buildWrongCL2';
import type { SameTypePools } from './buildWrongCL2';
import { buildWrongCL3 } from './buildWrongCL3';
import { containsForbidden } from './containsForbidden';

type Tile = LangAssets['tiles']['rows'][number];

export type ChoiceLevel = 1 | 2 | 3;

export type BuildChoicesResult =
  | { correct: string; choices: string[]; correctSlot: number }
  | { error: 'degenerate' };

function shuffleInPlace<T>(arr: T[], rng: () => number): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function trioOf(base: string, tileMap: Map<string, TileEntry>): Tile[] {
  const row = tileMap.get(base);
  if (!row) return [];
  const out: Tile[] = [];
  for (const alt of [row.alt1, row.alt2, row.alt3]) {
    if (!alt) continue;
    const e = tileMap.get(alt);
    if (e) out.push(e as Tile);
  }
  return out;
}

export function buildAllChoices({
  level,
  parsed,
  tileMap,
  pools,
  wordInLOP,
  mixedDefs,
  tiles,
  scriptType,
  placeholderCharacter,
  rng = Math.random,
}: {
  level: ChoiceLevel;
  parsed: ParsedTile[];
  tileMap: Map<string, TileEntry>;
  pools: SameTypePools;
  wordInLOP: string;
  mixedDefs: string;
  tiles: Tile[];
  scriptType: ScriptType;
  placeholderCharacter: string;
  rng?: () => number;
}): BuildChoicesResult {
  const correct = standardizeWordSequence(
    { wordInLOP, mixedDefs, tiles, scriptType, placeholderCharacter },
    scriptType,
  );
  if (containsForbidden(correct)) return { error: 'degenerate' };

  const wrongs: string[] = [];

  if (level === 1) {
    const trio = trioOf(parsed[0].base, tileMap);
    if (trio.length === 0) return { error: 'degenerate' };
    const trioShuffled = shuffleInPlace([...trio], rng);
    let trioCursor = 0;
    for (let slot = 0; slot < 3; slot++) {
      let text: string | null = null;
      // Try up to trioShuffled.length entries before giving up; this matches
      // Java's "while (isDuplicateAnswerChoice)" loop on للہ rejection,
      // bounded by the trio's finite size.
      for (let probe = 0; probe < trioShuffled.length && text === null; probe++) {
        const idx = (trioCursor + probe) % trioShuffled.length;
        const candidate = buildWrongCL1({
          parsed,
          tileMap,
          trioShuffled,
          slotIndex: idx as 0 | 1 | 2,
          wordInLOP,
          scriptType,
        });
        if (candidate === null) continue;
        if (containsForbidden(candidate)) continue;
        if (candidate === correct) continue;
        if (wrongs.includes(candidate)) continue;
        text = candidate;
      }
      if (text === null) return { error: 'degenerate' };
      wrongs.push(text);
      trioCursor = (trioCursor + 1) % trioShuffled.length;
    }
  } else if (level === 2) {
    for (let slot = 0; slot < 3; slot++) {
      const text = buildWrongCL2({
        parsed, pools, prior: wrongs, correct, wordInLOP, scriptType, rng,
      });
      if (text === null) return { error: 'degenerate' };
      wrongs.push(text);
    }
  } else {
    for (let slot = 0; slot < 3; slot++) {
      const text = buildWrongCL3({
        parsed, tileMap, prior: wrongs, correct, wordInLOP, scriptType, rng,
      });
      if (text === null) return { error: 'degenerate' };
      wrongs.push(text);
    }
  }

  const correctSlot = Math.floor(rng() * 4);
  const choices = [...wrongs];
  choices.splice(correctSlot, 0, correct);
  return { correct, choices, correctSlot };
}
