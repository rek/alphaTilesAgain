/**
 * Internal React context carrying AudioHandles + load state.
 * Consumed by useAudio() and AudioGate — not exported from the library root.
 */
import { createContext } from 'react';
import type { AudioHandles } from './AudioHandles';

export type AudioContextValue = {
  handles: AudioHandles | null;
  isLoading: boolean;
  loadProgress: { loaded: number; total: number };
  /** Stable Promise that resolves when the loader finishes (or fails). */
  awaitLoaded: Promise<void>;
};

export const AudioContext = createContext<AudioContextValue>({
  handles: null,
  isLoading: false,
  loadProgress: { loaded: 0, total: 0 },
  awaitLoaded: Promise.resolve(),
});
