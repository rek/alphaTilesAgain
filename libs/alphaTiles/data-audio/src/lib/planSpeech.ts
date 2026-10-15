/**
 * planSpeech — decides which recorded clips speak one pack item, and when.
 *
 * Internal to pack speech (createPackSpeech). Owns every key-resolution rule
 * so no caller ever names an audio map or id:
 *   tile        → tile clip keyed by tile.base (NOT the AudioName column)
 *   word        → word clip keyed by wordInLWC, else syllable chain over the
 *                 LOP (yue composite numerals 二十 = 二 + 十), else silent
 *   syllable    → syllable clip keyed by syllable text, else the clip of the
 *                 first word whose LOP contains it (Taiwan single hanzi), else
 *                 silent
 *   instruction → instruction clip keyed by its InstructionAudio id
 *
 * Chain timing: each syllable starts after the previous one's measured length
 * (FALLBACK_MS when unmeasured) plus GAP_MS. The gap is a teaching cue, not a
 * concat seam — see GAME_PATTERNS "Syllable-chain audio fallback".
 */
import { syllableChainFor } from '@shared/util-phoneme';

/** Silent pause between chained syllables. */
const GAP_MS = 150;
/** Per-syllable length when a clip has no measured duration. */
const FALLBACK_MS = 700;

type Word = { wordInLWC: string; wordInLOP: string };

/** A pack item to speak. Pass the row; pack speech picks the clip. */
export type SpeechItem =
  | { tile: { base: string } }
  | { word: Word }
  | { syllable: { syllable: string } }
  | { instruction: string };

export type ClipCategory = 'tile' | 'word' | 'syllable' | 'instruction';

/** A playable clip's measured length (undefined = playable, length unknown); null = no playable clip. */
export type ClipLookup = (category: ClipCategory, id: string) => { ms: number | undefined } | null;

export type SpeechPlan = {
  route: 'clip' | 'syllable-chain' | 'word-containing-syllable' | 'silent';
  steps: { category: ClipCategory; id: string; atMs: number }[];
  /** Expected total playback ms; undefined when unknown (or silent). */
  ms: number | undefined;
};

const SILENT: SpeechPlan = { route: 'silent', steps: [], ms: undefined };

function single(
  route: SpeechPlan['route'],
  category: ClipCategory,
  id: string,
  ms: number | undefined,
): SpeechPlan {
  return { route, steps: [{ category, id, atMs: 0 }], ms };
}

export function planSpeech(
  item: SpeechItem,
  pack: { words: Word[]; syllables: { syllable: string }[] },
  clip: ClipLookup,
): SpeechPlan {
  if ('instruction' in item) {
    const c = clip('instruction', item.instruction);
    return c ? single('clip', 'instruction', item.instruction, c.ms) : SILENT;
  }

  if ('tile' in item) {
    const c = clip('tile', item.tile.base);
    return c ? single('clip', 'tile', item.tile.base, c.ms) : SILENT;
  }

  if ('syllable' in item) {
    const text = item.syllable.syllable;
    const c = clip('syllable', text);
    if (c) return single('clip', 'syllable', text, c.ms);
    if (!text) return SILENT;
    for (const word of pack.words) {
      if (!word.wordInLOP.includes(text)) continue;
      const w = clip('word', word.wordInLWC);
      if (w) return single('word-containing-syllable', 'word', word.wordInLWC, w.ms);
    }
    return SILENT;
  }

  const { wordInLWC, wordInLOP } = item.word;
  const c = clip('word', wordInLWC);
  if (c) return single('clip', 'word', wordInLWC, c.ms);

  const parts = syllableChainFor(wordInLOP, pack.syllables, (s) => clip('syllable', s.syllable) !== null);
  if (parts.length === 0) return SILENT;
  const steps: SpeechPlan['steps'] = [];
  let atMs = 0;
  parts.forEach((p, i) => {
    if (i > 0) atMs += GAP_MS;
    steps.push({ category: 'syllable', id: p.syllable, atMs });
    atMs += clip('syllable', p.syllable)?.ms ?? FALLBACK_MS;
  });
  return { route: 'syllable-chain', steps, ms: atMs };
}
