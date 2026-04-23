/**
 * AudioProvider — mount once, above all game screens, after preloadAudio resolves.
 *
 * Accepts the resolved AudioHandles (from preloadAudio) and exposes them via
 * AudioContext. Tracks the web gesture-unlock flag (isAudioUnlocked).
 *
 * On native, isAudioUnlocked starts true (no gesture required).
 * On web, it starts false and flips via unlockAudio() called from the loading screen.
 *
 * No useEffect — unlock flag is owned as useState and flipped via callback.
 */
import React, { useState } from 'react';
import { Platform } from 'react-native';
import type { AudioHandles } from './AudioHandles';
import { AudioContext } from './AudioContext';

export function AudioProvider({
  handles,
  children,
}: {
  handles: AudioHandles;
  children: React.ReactNode;
}): React.JSX.Element {
  const [isAudioUnlocked, setIsAudioUnlocked] = useState<boolean>(
    Platform.OS !== 'web'
  );

  return (
    <AudioContext.Provider value={{ handles, isAudioUnlocked, setIsAudioUnlocked }}>
      {children}
    </AudioContext.Provider>
  );
}
