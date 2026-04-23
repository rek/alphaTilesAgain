/**
 * Shape returned by preloadAudio().
 *
 * All maps are keyed by their id (tile audioName, word in LWC, syllable, instruction name).
 * A null entry means the file was missing or failed to load — playback is a no-op + warning.
 *
 * durations: parallel map keyed the same way; value is duration in milliseconds.
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
  durations: Map<string, number>;
};
