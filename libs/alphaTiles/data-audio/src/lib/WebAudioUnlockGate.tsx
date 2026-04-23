/**
 * WebAudioUnlockGate — renders children only when audio is unlocked.
 *
 * On native (iOS/Android): isAudioUnlocked is always true, so this is
 * a transparent pass-through — children render immediately.
 *
 * On web: renders null (or a provided fallback) until unlockAudio() resolves.
 * The loading screen is responsible for calling unlockAudio() from a user-
 * gesture handler and optionally providing a tap-prompt UI as the fallback.
 *
 * This component is a pure presenter — it accepts a pre-translated fallback
 * as a prop so callers own i18n (container/presenter split rule).
 *
 * Usage:
 *   <WebAudioUnlockGate fallback={<TapToStartPrompt />}>
 *     <AppScreens />
 *   </WebAudioUnlockGate>
 */
import React, { useContext } from 'react';
import { AudioContext } from './AudioContext';

type WebAudioUnlockGateProps = {
  children: React.ReactNode;
  /** Rendered on web before the user gesture unlocks audio. Default: null. */
  fallback?: React.ReactNode;
};

export function WebAudioUnlockGate({
  children,
  fallback = null,
}: WebAudioUnlockGateProps): React.JSX.Element | null {
  const ctx = useContext(AudioContext);

  if (ctx === null) {
    throw new Error('WebAudioUnlockGate must be used inside <AudioProvider>');
  }

  if (!ctx.isAudioUnlocked) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
