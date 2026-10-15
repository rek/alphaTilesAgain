/**
 * useAudio — chimes + audio load/unlock lifecycle.
 *
 * Pack content (tiles, words, syllables, instructions) is NOT played here:
 * use usePackSpeech (or the game shell's speak/durationOf), which owns the
 * audio-map keys and fallbacks. Must be called inside <AudioProvider>.
 *
 * All play* functions swallow errors internally (log, never throw) per spec.
 */
import { useContext } from 'react';
import { Platform } from 'react-native';
import { track } from '@shared/util-analytics';
import { AudioContext } from './AudioContext';
import { millisecondsSinceBoot } from './millisecondsSinceBoot';
import { primeAudioHandles } from './primeAudioHandles';
import { playHandle } from './playHandle';

export function useAudio() {
  const { handles, isLoading, loadProgress, awaitLoaded, isAudioUnlocked, setIsAudioUnlocked } = useContext(AudioContext);

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

  // ── Web unlock (design D9) ────────────────────────────────────────────
  // Must be called from a user-gesture handler AFTER preload resolves
  // (bootSequence awaits audio before the web gate; the root-layout gate
  // disables its button until loaded) so every clip gets primed (#47).
  const unlockAudio = async (): Promise<void> => {
    if (Platform.OS !== 'web' || isAudioUnlocked) return;

    if (handles) {
      primeAudioHandles(handles);
    } else if (__DEV__) {
      console.warn('[data-audio] unlockAudio: called before preload finished; clips not primed');
    }

    track('audio_unlock_web', { millisecondsSinceBoot: millisecondsSinceBoot() });

    setIsAudioUnlocked(true);
  };

  return {
    playCorrect,
    playIncorrect,
    playCorrectFinal,
    isLoading,
    loadProgress,
    awaitLoaded,
    isAudioUnlocked,
    unlockAudio,
  };
}
