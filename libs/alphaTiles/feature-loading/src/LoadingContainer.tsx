/**
 * LoadingContainer — orchestrates app boot sequence.
 *
 * Mount once at / (index route). On completion, replaces route with
 * /choose-player or /menu. Audio loading now happens in AudioProvider
 * (mounted in _layout.tsx) so that direct-URL entry routes also get audio.
 * This container awaits the already-in-flight awaitLoaded Promise from useAudio().
 * Web: mounts only after the root AudioGate's tap (#47), so no gesture step here.
 *
 * Native: kicks off a background OTA check at mount (applied next cold start).
 *
 * One permitted useEffect site (useMountEffect pattern — empty deps, one-shot kickoff).
 * All other state transitions happen inside the promise chain from bootSequence.
 */
import React, { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { useRouter } from 'expo-router';
import { useTranslation } from '@shared/util-i18n';
import { registerContentNamespaces } from '@shared/util-i18n';
import { useLangAssets } from '@alphaTiles/data-language-assets';
import { useAudio } from '@alphaTiles/data-audio';
import { reportApplyIfNeeded } from '@shared/util-ota';
import { track } from '@shared/util-analytics';
import { bootSequence } from './bootSequence';
import type { Phase } from './bootSequence';
import { awaitPlayersHydrated } from './awaitPlayersHydrated';
import { resolveEntryRoute } from './resolveEntryRoute';
import { LoadingScreen } from './LoadingScreen';
import { startOtaCheck } from './startOtaCheck';

export function LoadingContainer(): React.JSX.Element {
  const router = useRouter();
  const { t } = useTranslation('chrome');
  const assets = useLangAssets();

  const [phase, setPhase] = useState<Phase>('fonts');
  const [error, setError] = useState<Error | null>(null);

  const { loadProgress, awaitLoaded } = useAudio();

  // One-shot mount effect — permitted per CODE_STYLE.md for boot-time kickoffs.
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => void 0);
    const isNative = Platform.OS !== 'web';
    if (isNative) startOtaCheck();

    bootSequence({
      onPhaseChange: setPhase,
      registerContent: () => {
        const tile: Record<string, string> = {};
        for (const row of assets.tiles.rows) {
          tile[row.base] = row.base;
          if (row.upper) tile[`${row.base}.upper`] = row.upper;
          if (row.alt1) tile[`${row.base}.alt1`] = row.alt1;
        }

        const word: Record<string, string> = {};
        for (const row of assets.words.rows) {
          word[row.wordInLWC] = row.wordInLOP;
        }

        const syllable: Record<string, string> = {};
        for (const row of assets.syllables.rows) {
          syllable[row.syllable] = row.syllable;
        }

        const game: Record<string, string> = {};
        for (const row of assets.games.rows) {
          game[`${row.door}.instruction`] = row.instructionAudio ?? '';
        }

        const langMeta: Record<string, string> = {};
        for (const entry of assets.langInfo.entries) {
          langMeta[entry.label] = entry.value;
        }

        registerContentNamespaces({ tile, word, syllable, game, langMeta });
      },
      awaitAudio: () => awaitLoaded,
      awaitHydration: awaitPlayersHydrated,
    })
      .then(() => {
        // Post-mount: record which OTA update (if any) this launch is running.
        if (isNative) reportApplyIfNeeded({ track }).catch(() => void 0);
        router.replace(resolveEntryRoute());
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err : new Error(String(err)));
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { loaded, total } = loadProgress;
  const audioProgress = total > 0 ? loaded / total : 0;

  const progressLabel =
    phase === 'audio'
      ? t('loading.progress', { percent: Math.floor(audioProgress * 100) })
      : '';

  return (
    <LoadingScreen
      phase={phase}
      audioProgress={audioProgress}
      error={error}
      labels={{
        title: t('loading.title'),
        progress: progressLabel,
        error: t('loading.error'),
      }}
    />
  );
}
