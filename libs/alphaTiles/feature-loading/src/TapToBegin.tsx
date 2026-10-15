/**
 * TapToBegin — localized locked surface for data-audio's AudioGate (#47).
 *
 * Root layout: `<AudioGate renderLocked={(gate) => <TapToBegin {...gate} />}>`.
 * AudioGate owns when to show it, preload readiness and the unlock (priming,
 * analytics); this container only translates. Presenter is pure.
 */
import React from 'react';
import { useTranslation } from '@shared/util-i18n';
import type { AudioGate } from '@alphaTiles/data-audio';
import { WebAudioUnlockGatePresenter } from '@shared/ui-web-audio-unlock-gate';

export function TapToBegin({
  isReady,
  percent,
  unlock,
}: Parameters<Parameters<typeof AudioGate>[0]['renderLocked']>[0]) {
  const { t } = useTranslation('chrome');
  return (
    <WebAudioUnlockGatePresenter
      isReady={isReady}
      title={t('loading.title')}
      label={isReady ? t('loading.tap_to_begin') : t('loading.progress', { percent })}
      onUnlock={unlock}
    />
  );
}
