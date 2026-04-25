/**
 * LoadingContainer — orchestrates app boot sequence.
 *
 * Mount once at / (index route). On completion, replaces route with
 * /choose-player or /menu. AudioHandles are stored in useAudioHandlesStore
 * so _layout.tsx can mount AudioProvider after preload completes.
 *
 * One permitted useEffect site (useMountEffect pattern — empty deps, one-shot kickoff).
 * All other state transitions happen inside the promise chain from bootSequence.
 */
import React, { useEffect, useState, useRef } from 'react';
import { Platform } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { useRouter } from 'expo-router';
import { useTranslation } from '@shared/util-i18n';
import { registerContentNamespaces } from '@shared/util-i18n';
import { useLangAssets } from '@alphaTiles/data-language-assets';
import { preloadAudio, BASE_CHIMES, useAudio } from '@alphaTiles/data-audio';
import type { AudioConfig } from '@alphaTiles/data-audio';
import { bootSequence } from './bootSequence';
import type { Phase } from './bootSequence';
import { awaitPlayersHydrated } from './awaitPlayersHydrated';
import { resolveEntryRoute } from './resolveEntryRoute';
import { useAudioHandlesStore } from './audioHandlesStore';
import { LoadingScreen } from './LoadingScreen';

export function LoadingContainer(): React.JSX.Element {
  const router = useRouter();
  const { t } = useTranslation('chrome');
  const assets = useLangAssets();
  const { setHandles } = useAudioHandlesStore.getState();

  const [phase, setPhase] = useState<Phase>('fonts');
  const [audioLoaded, setAudioLoaded] = useState(0);
  const [audioTotal, setAudioTotal] = useState(1);
  const [error, setError] = useState<Error | null>(null);

  const { unlockAudio } = useAudio();
  const webGestureResolveRef = useRef<(() => void) | null>(null);

  // One-shot mount effect — permitted per CODE_STYLE.md for boot-time kickoffs.
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => void 0);

    const audioConfig: AudioConfig = {
      hasTileAudio: assets.settings.findBoolean('Has tile audio', false),
      hasSyllableAudio: assets.settings.findBoolean('Has syllable audio', false),
    };

    const manifest = {
      tiles: assets.audio.tiles,
      words: assets.audio.words,
      syllables: assets.audio.syllables,
      instructions: assets.audio.instructions,
    };

    bootSequence({
      platform: Platform.OS === 'web' ? 'web' : 'native',
      onPhaseChange: setPhase,
      onAudioProgress: (loaded, total) => {
        setAudioLoaded(loaded);
        setAudioTotal(total);
      },
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
      loadAudio: async (onProgress) => {
        const handles = await preloadAudio({
          manifest,
          audioConfig,
          baseChimes: BASE_CHIMES,
          onProgress,
        });
        setHandles(handles);
      },
      waitForWebGesture: Platform.OS === 'web'
        ? () => new Promise<void>((resolve) => { webGestureResolveRef.current = resolve; })
        : undefined,
      awaitHydration: awaitPlayersHydrated,
    })
      .then(() => {
        router.replace(resolveEntryRoute() as Parameters<typeof router.replace>[0]);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err : new Error(String(err)));
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const audioProgress = audioTotal > 0 ? audioLoaded / audioTotal : 0;

  const progressLabel =
    phase === 'audio'
      ? t('loading.progress', { percent: Math.floor(audioProgress * 100) })
      : '';

  return (
    <LoadingScreen
      phase={phase}
      audioProgress={audioProgress}
      error={error}
      onTapToBegin={
        phase === 'web-gate'
          ? () => { void unlockAudio(); webGestureResolveRef.current?.(); }
          : undefined
      }
      labels={{
        title: t('loading.title'),
        progress: progressLabel,
        tapToBegin: t('loading.tap_to_begin'),
        error: t('loading.error'),
      }}
    />
  );
}
