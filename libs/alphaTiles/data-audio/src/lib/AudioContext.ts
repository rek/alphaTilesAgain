/**
 * Internal React context carrying AudioHandles + unlock state.
 * Consumed exclusively by useAudio() — not exported from the library root.
 */
import { createContext } from 'react';
import type { AudioHandles } from './AudioHandles';

export type AudioContextValue = {
  handles: AudioHandles | null;
  isAudioUnlocked: boolean;
  setIsAudioUnlocked: (v: boolean) => void;
};

// Default is a no-op sentinel — AudioProvider is always mounted, handles may
// arrive after fonts load but before audio preload completes.
export const AudioContext = createContext<AudioContextValue>({
  handles: null,
  isAudioUnlocked: false,
  setIsAudioUnlocked: () => undefined,
});
