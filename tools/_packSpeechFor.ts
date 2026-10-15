/**
 * Pack speech over a loaded pack's bound audio maps, with an in-memory
 * player that records what it plays (test adapter for createPackSpeech).
 * Every bound clip reports `clipMs`; chained steps fire on timers, so use
 * jest fake timers to hear a whole chain.
 */
import { createPackSpeech } from '../libs/alphaTiles/data-audio/src/lib/createPackSpeech';
import type { LangAssets } from '../libs/alphaTiles/data-language-pack/src/LangAssets';

export function packSpeechFor(assets: LangAssets, clipMs = 500) {
  const played: string[] = [];
  const maps = {
    tile: assets.audio.tiles,
    word: assets.audio.words,
    syllable: assets.audio.syllables,
    instruction: assets.audio.instructions,
  };
  const speech = createPackSpeech({
    pack: { words: assets.words.rows, syllables: assets.syllables.rows },
    clip: (category, id) => (maps[category][id] !== undefined ? { ms: clipMs } : null),
    play: (category, id) => played.push(`${category}:${id}`),
  });
  return { speech, played };
}
