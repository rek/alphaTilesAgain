/**
 * useAudio — the primary audio API for all game feature libraries.
 *
 * Returns stable play callbacks + duration getters + web unlock lifecycle.
 * Must be called inside <AudioProvider>. Throws if called outside.
 *
 * Platform strategy (design D4):
 *   Native: seekTo(0) + play() on the existing handle — fire-and-forget.
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
  const ctx = useContext(AudioContext);
  if (ctx === null) {
    throw new Error('useAudio must be called inside <AudioProvider>');
  }
  const { handles, isAudioUnlocked, setIsAudioUnlocked } = ctx;

  // ── playTile ──────────────────────────────────────────────────────────
  const playTile = async (id: string): Promise<void> => {
    const handle = handles.tiles.get(id);
    if (handle === undefined) {
      // tiles map is empty because hasTileAudio = false, or id not in manifest.
      if (!warnedTiles.has(id)) {
        warnedTiles.add(id);
        if (__DEV__) {
          console.warn(`[data-audio] playTile: no handle for id "${id}" (tile audio disabled or missing)`);
        }
      }
      return;
    }
    if (handle === null) {
      if (!warnedTiles.has(id)) {
        warnedTiles.add(id);
        if (__DEV__) {
          console.warn(`[data-audio] playTile: null handle for id "${id}" (file failed to load)`);
        }
      }
      return;
    }
    await playHandle(handle);
  };

  // ── playWord ──────────────────────────────────────────────────────────
  const playWord = async (id: string): Promise<void> => {
    const handle = handles.words.get(id);
    if (handle === undefined || handle === null) {
      if (!warnedWords.has(id)) {
        warnedWords.add(id);
        if (__DEV__) {
          console.warn(`[data-audio] playWord: no/null handle for id "${id}"`);
        }
      }
      return;
    }
    await playHandle(handle);
  };

  // ── playSyllable ──────────────────────────────────────────────────────
  const playSyllable = async (id: string): Promise<void> => {
    const handle = handles.syllables.get(id);
    if (handle === undefined) {
      if (!warnedSyllables.has(id)) {
        warnedSyllables.add(id);
        if (__DEV__) {
          console.warn(`[data-audio] playSyllable: no handle for id "${id}" (syllable audio disabled or missing)`);
        }
      }
      return;
    }
    if (handle === null) {
      if (!warnedSyllables.has(id)) {
        warnedSyllables.add(id);
        if (__DEV__) {
          console.warn(`[data-audio] playSyllable: null handle for id "${id}" (file failed to load)`);
        }
      }
      return;
    }
    await playHandle(handle);
  };

  // ── playInstruction ───────────────────────────────────────────────────
  const playInstruction = async (id: string): Promise<void> => {
    const handle = handles.instructions.get(id);
    if (handle === undefined || handle === null) {
      if (!warnedInstructions.has(id)) {
        warnedInstructions.add(id);
        if (__DEV__) {
          console.warn(`[data-audio] playInstruction: no/null handle for id "${id}"`);
        }
      }
      return;
    }
    await playHandle(handle);
  };

  // ── Chimes ────────────────────────────────────────────────────────────
  const playCorrect = async (): Promise<void> => {
    await playHandle(handles.chimes.correct);
  };

  const playIncorrect = async (): Promise<void> => {
    await playHandle(handles.chimes.incorrect);
  };

  const playCorrectFinal = async (): Promise<void> => {
    await playHandle(handles.chimes.correctFinal);
  };

  // ── Duration getters ──────────────────────────────────────────────────
  const getTileDuration = (id: string): number | undefined => {
    return handles.durations.get(id);
  };

  const getWordDuration = (id: string): number | undefined => {
    return handles.durations.get(id);
  };

  const getSyllableDuration = (id: string): number | undefined => {
    return handles.durations.get(id);
  };

  // ── Web unlock (design D9) ────────────────────────────────────────────
  const unlockAudio = async (): Promise<void> => {
    if (Platform.OS !== 'web' || isAudioUnlocked) return;

    try {
      // Prime the AudioContext by playing a zero-volume chime.
      const chime = handles.chimes.correct;
      const originalVolume = chime.volume;
      chime.volume = 0;
      chime.play();
      // Brief tick to let the browser allow audio context to resume.
      await new Promise<void>((resolve) => setTimeout(resolve, 50));
      chime.pause();
      await chime.seekTo(0);
      chime.volume = originalVolume;
    } catch {
      // Non-fatal — still mark as unlocked so the app can proceed.
      if (__DEV__) {
        console.warn('[data-audio] unlockAudio: priming failed (non-fatal)');
      }
    }

    track({
      type: 'audio_unlock_web',
      props: { millisecondsSinceBoot: Date.now() },
    });

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
    isAudioUnlocked,
    unlockAudio,
  };
}
