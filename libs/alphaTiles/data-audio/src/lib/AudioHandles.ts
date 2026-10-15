/**
 * Shape returned by preloadAudio().
 *
 * All maps are keyed by their id (tile.base, word in LWC, syllable text, instruction name)
 * — the same keys resolveAudio binds. NOT the pack AudioName column.
 * A null entry means the file was missing or failed to load — playback is a no-op + warning.
 *
 * durations: one map per category, keyed the same way; value is duration in ms.
 * Per-category because keys collide across categories (yue tile 二 vs syllable 二).
 * Missing = file failed or handle not yet loaded.
 */
import type { SoundHandle } from './SoundHandle';

export type AudioHandles = {
  tiles: Map<string, SoundHandle | null>;
  words: Map<string, SoundHandle | null>;
  syllables: Map<string, SoundHandle | null>;
  instructions: Map<string, SoundHandle | null>;
  chimes: {
    correct: SoundHandle;
    incorrect: SoundHandle;
    correctFinal: SoundHandle;
  };
  durations: {
    tiles: Map<string, number>;
    words: Map<string, number>;
    syllables: Map<string, number>;
    instructions: Map<string, number>;
  };
};
