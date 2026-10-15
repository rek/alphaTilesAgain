/**
 * Shape returned by preloadAudio().
 *
 * Category maps are keyed by their id (tile.base, word in LWC, syllable text,
 * instruction name) — the same keys resolveAudio binds, NOT the pack
 * AudioName column. Value = the bundled asset source (Metro module id) of a
 * clip that probed OK at boot; null = missing/failed (playback is a no-op +
 * warning). Players are NOT held per clip (M11): `pool` keeps a bounded LRU of
 * live players and re-creates evicted ones from the source on demand. Pool
 * keys are namespaced `<category>:<id>`.
 *
 * durations: one map per category, keyed the same way; value is duration in ms,
 * measured once at boot so getters stay synchronous.
 * Per-category because keys collide across categories (yue tile 二 vs syllable 二).
 * Missing = file failed to load.
 */
import type { SoundHandle } from './SoundHandle';
import type { createPlayerPool } from './createPlayerPool';

export type AudioHandles = {
  tiles: Map<string, number | null>;
  words: Map<string, number | null>;
  syllables: Map<string, number | null>;
  instructions: Map<string, number | null>;
  pool: ReturnType<typeof createPlayerPool>;
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
