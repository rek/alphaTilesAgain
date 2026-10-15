/**
 * useAudio — the primary audio API for all game feature libraries.
 *
 * Returns stable play callbacks + duration getters + web unlock lifecycle.
 * Must be called inside <AudioProvider>. Throws if called outside.
 *
 * Players come from the bounded LRU pool (M11): `handles.<category>` maps an
 * id to its asset source; `pool.acquire` returns the live player, re-creating
 * it if it was evicted.
 *
 * Platform strategy (design D4):
 *   Native: seekTo(0) + play() on the pooled handle — fire-and-forget.
 *   Web: pause() + seekTo(0) then play() (last-play-wins single-instance).
 *
 * Warn-once dedupe: each category has a module-level Set<string> that records
 * warned ids. Subsequent calls for the same missing id are silent.
 *
 * All play* functions swallow errors internally (log, never throw) per spec.
 */
import { useContext } from 'react';
import { Platform } from 'react-native';
import { track } from '@shared/util-analytics';
import { AudioContext } from './AudioContext';
import type { SoundHandle } from './SoundHandle';

// Module-level warn sets — survive re-renders, reset only on Metro reload.
const warnedTiles = new Set<string>();
const warnedWords = new Set<string>();
const warnedSyllables = new Set<string>();
const warnedInstructions = new Set<string>();

async function playHandle(handle: SoundHandle): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      // Web: single-instance last-play-wins (design D4).
      handle.pause();
      await handle.seekTo(0);
      handle.play();
    } else {
      // Native: restart from zero — equivalent of SoundPool replay.
      await handle.seekTo(0);
      handle.play();
    }
  } catch (err) {
    if (__DEV__) {
      console.warn(
        '[data-audio] playHandle error:',
        err instanceof Error ? err.message : String(err)
      );
    }
  }
}

export function useAudio() {
  const { handles, isLoading, loadProgress, awaitLoaded, isAudioUnlocked, setIsAudioUnlocked } = useContext(AudioContext);

  /** Live player for a probed clip; acquiring never throws. */
  const acquire = (category: string, id: string, source: number): SoundHandle | null => {
    if (!handles) return null;
    try {
      return handles.pool.acquire(`${category}:${id}`, source);
    } catch (err) {
      if (__DEV__) {
        console.warn(
          `[data-audio] failed to create player for ${category}:${id}`,
          err instanceof Error ? err.message : String(err)
        );
      }
      return null;
    }
  };

  // ── playTile ──────────────────────────────────────────────────────────
  const playTile = async (id: string): Promise<void> => {
    if (!handles) return;
    const source = handles.tiles.get(id);
    if (source === undefined) {
      // tiles map is empty because hasTileAudio = false, or id not in manifest.
      if (!warnedTiles.has(id)) {
        warnedTiles.add(id);
        if (__DEV__) {
          console.warn(`[data-audio] playTile: no handle for id "${id}" (tile audio disabled or missing)`);
        }
      }
      return;
    }
    if (source === null) {
      if (!warnedTiles.has(id)) {
        warnedTiles.add(id);
        if (__DEV__) {
          console.warn(`[data-audio] playTile: null handle for id "${id}" (file failed to load)`);
        }
      }
      return;
    }
    const handle = acquire('tile', id, source);
    if (handle) await playHandle(handle);
  };

  // ── playWord ──────────────────────────────────────────────────────────
  const playWord = async (id: string): Promise<void> => {
    if (!handles) return;
    const source = handles.words.get(id);
    if (source === undefined || source === null) {
      if (!warnedWords.has(id)) {
        warnedWords.add(id);
        if (__DEV__) {
          console.warn(`[data-audio] playWord: no/null handle for id "${id}"`);
        }
      }
      return;
    }
    const handle = acquire('word', id, source);
    if (handle) await playHandle(handle);
  };

  // ── playSyllable ──────────────────────────────────────────────────────
  const playSyllable = async (id: string): Promise<void> => {
    if (!handles) return;
    const source = handles.syllables.get(id);
    if (source === undefined) {
      if (!warnedSyllables.has(id)) {
        warnedSyllables.add(id);
        if (__DEV__) {
          console.warn(`[data-audio] playSyllable: no handle for id "${id}" (syllable audio disabled or missing)`);
        }
      }
      return;
    }
    if (source === null) {
      if (!warnedSyllables.has(id)) {
        warnedSyllables.add(id);
        if (__DEV__) {
          console.warn(`[data-audio] playSyllable: null handle for id "${id}" (file failed to load)`);
        }
      }
      return;
    }
    const handle = acquire('syllable', id, source);
    if (handle) await playHandle(handle);
  };

  // ── playInstruction ───────────────────────────────────────────────────
  const playInstruction = async (id: string): Promise<void> => {
    if (!handles) return;
    const source = handles.instructions.get(id);
    if (source === undefined || source === null) {
      if (!warnedInstructions.has(id)) {
        warnedInstructions.add(id);
        if (__DEV__) {
          console.warn(`[data-audio] playInstruction: no/null handle for id "${id}"`);
        }
      }
      return;
    }
    const handle = acquire('instruction', id, source);
    if (handle) await playHandle(handle);
  };

  // ── Chimes ────────────────────────────────────────────────────────────
  const playCorrect = async (): Promise<void> => {
    if (!handles) return;
    await playHandle(handles.chimes.correct);
  };

  const playIncorrect = async (): Promise<void> => {
    if (!handles) return;
    await playHandle(handles.chimes.incorrect);
  };

  const playCorrectFinal = async (): Promise<void> => {
    if (!handles) return;
    await playHandle(handles.chimes.correctFinal);
  };

  // ── Duration getters ──────────────────────────────────────────────────
  const getTileDuration = (id: string): number | undefined => {
    return handles?.durations.tiles.get(id);
  };

  const getWordDuration = (id: string): number | undefined => {
    return handles?.durations.words.get(id);
  };

  const getSyllableDuration = (id: string): number | undefined => {
    return handles?.durations.syllables.get(id);
  };

  // ── Web unlock (design D9) ────────────────────────────────────────────
  const unlockAudio = async (): Promise<void> => {
    if (Platform.OS !== 'web' || isAudioUnlocked) return;

    // Priming requires loaded handles — skip if called before preload completes
    // (e.g. from the loading screen tap handler before audio phase).
    if (handles) {
      // Safari/iOS require EACH <audio> element's first play() to originate
      // from a user gesture — priming just the chime leaves tiles/words/etc.
      // silent on first play (issue #25). Fire play()+pause() synchronously
      // on every loaded handle within the gesture frame; no awaits between
      // elements so the whole loop stays in the gesture's task.
      const primeOne = (handle: SoundHandle | null): void => {
        if (!handle) return;
        try {
          const originalVolume = handle.volume;
          handle.volume = 0;
          handle.play();
          handle.pause();
          handle.volume = originalVolume;
        } catch {
          // Per-handle priming failure is non-fatal; keep going.
        }
      };

      try {
        primeOne(handles.chimes.correct);
        primeOne(handles.chimes.incorrect);
        primeOne(handles.chimes.correctFinal);
        // Web pool is unbounded, so this primes every probed clip.
        for (const h of handles.pool.liveHandles()) primeOne(h);
      } catch {
        if (__DEV__) {
          console.warn('[data-audio] unlockAudio: priming loop failed (non-fatal)');
        }
      }
    }

    track('audio_unlock_web', { millisecondsSinceBoot: Date.now() });

    setIsAudioUnlocked(true);
  };

  return {
    playTile,
    playWord,
    playSyllable,
    playInstruction,
    playCorrect,
    playIncorrect,
    playCorrectFinal,
    getTileDuration,
    getWordDuration,
    getSyllableDuration,
    isLoading,
    loadProgress,
    awaitLoaded,
    isAudioUnlocked,
    unlockAudio,
  };
}
