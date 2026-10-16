/**
 * AudioGate — the one place that knows browsers block audio until a gesture (#47).
 *
 * Wraps the whole app (root layout, every route — so a reload / deep link is
 * gated the same as a cold start at '/'). While locked it renders ONLY
 * `renderLocked(...)`, never children, so screens that auto-play on mount do
 * it after the gesture. Owns:
 *   - native pass-through (no autoplay policy → children immediately)
 *   - waiting for preload: `isReady` false and `unlock` a no-op until the
 *     AudioProvider loader settles, so the tap can prime every clip
 *   - the gesture: `unlock` must run inside the press handler; it primes all
 *     clips in chunks (primeAudioHandles), fires `audio_unlock_web` once, opens
 *
 * The locked surface is injected (render prop) so this data-access lib stays
 * free of i18n/UI; feature-loading's TapToBegin supplies it.
 * Must be rendered inside <AudioProvider>.
 */
import React, { useContext, useState } from 'react';
import { Platform } from 'react-native';
import { agentProbe } from '@shared/util-agent-tools';
import { track } from '@shared/util-analytics';
import { AudioContext } from './AudioContext';
import { millisecondsSinceBoot } from './millisecondsSinceBoot';
import { primeAudioHandles } from './primeAudioHandles';

export function AudioGate({
  renderLocked,
  children,
}: {
  renderLocked: (gate: {
    /** Preload settled — the tap can now prime every clip. */
    isReady: boolean;
    /** Preload progress 0–100 (floored). */
    percent: number;
    /** Call from the press handler. No-op until ready. */
    unlock: () => void;
  }) => React.ReactNode;
  children: React.ReactNode;
}) {
  const { handles, isLoading, loadProgress } = useContext(AudioContext);
  const [isUnlocked, setIsUnlocked] = useState(false);

  // Pre-existing platform check, moved here from AudioProvider/useAudio
  // (design I7). Native has no autoplay policy: nothing to gate.
  if (Platform.OS !== 'web' || isUnlocked) return <>{children}</>;

  const unlock = () => {
    if (isLoading) return;
    if (handles) {
      primeAudioHandles(handles);
    } else if (__DEV__) {
      console.warn('[data-audio] AudioGate: preload failed; no clips to prime');
    }
    track('audio_unlock_web', { millisecondsSinceBoot: millisecondsSinceBoot() });
    if (__DEV__) agentProbe.audioUnlocked();
    setIsUnlocked(true);
  };

  const percent =
    loadProgress.total > 0 ? Math.floor((loadProgress.loaded / loadProgress.total) * 100) : 0;

  return <>{renderLocked({ isReady: !isLoading, percent, unlock })}</>;
}
