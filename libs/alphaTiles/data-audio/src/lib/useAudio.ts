/**
 * useAudio — chimes + audio load lifecycle. Web unlock lives in AudioGate.
 *
 * Pack content (tiles, words, syllables, instructions) is NOT played here:
 * use usePackSpeech (or the game shell's speak/durationOf), which owns the
 * audio-map keys and fallbacks. Must be called inside <AudioProvider>.
 *
 * All play* functions swallow errors internally (log, never throw) per spec.
 */
import { useContext } from 'react';
import { AudioContext } from './AudioContext';
import { playHandle } from './playHandle';

export function useAudio() {
  const { handles, isLoading, loadProgress, awaitLoaded } = useContext(AudioContext);

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

  return {
    playCorrect,
    playIncorrect,
    playCorrectFinal,
    isLoading,
    loadProgress,
    awaitLoaded,
  };
}
