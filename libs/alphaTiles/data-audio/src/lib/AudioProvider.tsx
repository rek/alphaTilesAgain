/**
 * AudioProvider — mounts once in _layout.tsx, owns the full audio load lifecycle.
 *
 * Accepts a `loader` factory constructed by the caller (app layer) so that
 * data-audio has no dependency on data-language-assets (NX boundary rule).
 *
 * Starts loading immediately on mount — audio load races with font load so that
 * any entry route (including deep-links that skip the loading screen) gets audio.
 *
 * Exposes via context:
 *   handles        — null until loading completes
 *   isLoading      — true until loader resolves or rejects
 *   loadProgress   — { loaded, total } updated via the onProgress callback
 *   awaitLoaded    — stable Promise<void> that resolves when loading finishes
 *   isAudioUnlocked — web gesture-unlock flag (starts true on native)
 */
import React, { useState, useRef, useEffect } from 'react';
import { Platform } from 'react-native';
import type { AudioHandles } from './AudioHandles';
import { AudioContext } from './AudioContext';

type AudioProviderProps = {
  loader: (onProgress: (loaded: number, total: number) => void) => Promise<AudioHandles>;
  children: React.ReactNode;
};

export function AudioProvider({ loader, children }: AudioProviderProps): React.JSX.Element {
  const [handles, setHandles] = useState<AudioHandles | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState({ loaded: 0, total: 0 });
  const [isAudioUnlocked, setIsAudioUnlocked] = useState<boolean>(Platform.OS !== 'web');

  // Stable Promise + resolver created once — consumers can await regardless of render timing.
  const awaitLoadedPromiseRef = useRef<Promise<void> | null>(null);
  const awaitLoadedResolveRef = useRef<(() => void) | null>(null);
  if (awaitLoadedPromiseRef.current === null) {
    awaitLoadedPromiseRef.current = new Promise<void>((resolve) => {
      awaitLoadedResolveRef.current = resolve;
    });
  }

  // Guard against StrictMode double-fire — audio players are expensive to create twice.
  const loadingStartedRef = useRef(false);
  const loaderRef = useRef(loader);

  useEffect(() => {
    if (loadingStartedRef.current) return;
    loadingStartedRef.current = true;

    loaderRef.current((loaded, total) => {
      setLoadProgress({ loaded, total });
    })
      .then((h) => {
        setHandles(h);
        setIsLoading(false);
        awaitLoadedResolveRef.current?.();
      })
      .catch((err: unknown) => {
        setIsLoading(false);
        awaitLoadedResolveRef.current?.(); // unblock waiters even on failure
        if (__DEV__) {
          console.warn('[data-audio] AudioProvider: loader failed', err instanceof Error ? err.message : String(err));
        }
      });
  }, []);

  return (
    <AudioContext.Provider value={{
      handles,
      isLoading,
      loadProgress,
      // awaitLoadedPromiseRef.current is set synchronously before first render — always non-null here
      awaitLoaded: awaitLoadedPromiseRef.current ?? Promise.resolve(),
      isAudioUnlocked,
      setIsAudioUnlocked,
    }}>
      {children}
    </AudioContext.Provider>
  );
}
