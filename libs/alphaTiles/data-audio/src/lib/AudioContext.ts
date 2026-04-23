/**
 * Internal React context carrying AudioHandles + unlock state.
 * Consumed exclusively by useAudio() — not exported from the library root.
 */
import { createContext } from 'react';
import type { AudioHandles } from './AudioHandles';

export type AudioContextValue = {
  handles: AudioHandles;
  isAudioUnlocked: boolean;
  setIsAudioUnlocked: (v: boolean) => void;
};

export const AudioContext = createContext<AudioContextValue | null>(null);
