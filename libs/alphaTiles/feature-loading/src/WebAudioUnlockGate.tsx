/**
 * WebAudioUnlockGate — container for the root-layout web audio gate (#47).
 *
 * Mounted only on web by apps/alphaTiles/app/_layout.tsx (design D1). Covers
 * entry routes that skip LoadingContainer (reload / deep link). Owns hooks +
 * i18n; WebAudioUnlockGatePresenter is pure.
 *
 * unlockAudio() primes every loaded clip and fires `audio_unlock_web` exactly
 * once (it no-ops when already unlocked), so this container does not call
 * track() itself.
 */
import React from 'react';
import { usePathname } from 'expo-router';
import { useTranslation } from '@shared/util-i18n';
import { useAudio } from '@alphaTiles/data-audio';
import { WebAudioUnlockGatePresenter } from '@shared/ui-web-audio-unlock-gate';
import { shouldGateRoute } from './shouldGateRoute';

export function WebAudioUnlockGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { t } = useTranslation('chrome');
  const { isAudioUnlocked, isLoading, loadProgress, unlockAudio } = useAudio();

  const isLocked = shouldGateRoute({ isAudioUnlocked, pathname });
  const percent =
    loadProgress.total > 0 ? Math.floor((loadProgress.loaded / loadProgress.total) * 100) : 0;

  return (
    <WebAudioUnlockGatePresenter
      isLocked={isLocked}
      isReady={!isLoading}
      title={t('loading.title')}
      label={isLoading ? t('loading.progress', { percent }) : t('loading.tap_to_begin')}
      onUnlock={() => { void unlockAudio(); }}
    >
      {children}
    </WebAudioUnlockGatePresenter>
  );
}
