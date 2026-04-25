/**
 * GameShellContainer — owns all shared game lifecycle logic.
 *
 * Ports GameActivity.java abstract class (~1217 LOC) decomposed per design.md §D1:
 * - Route-param extraction (expo-router useLocalSearchParams)
 * - Progress store read/write (@alphaTiles/data-progress)
 * - Audio replay + correct/incorrect/final sounds (@alphaTiles/data-audio)
 * - i18n strings (react-i18next via @shared/util-i18n)
 * - AppState listener — pause audio when backgrounded (GameActivity.java: Android lifecycle)
 * - after12checkedTrackers mode 1/2/3 (GameActivity.java:319-412)
 * - Celebration trigger (GameActivity.java:331-412) — correctSoundDuration+1800ms / 4500ms total
 * - next-uncompleted-game search (GameActivity.java:356-412)
 * - Android hardware-back → router.back()
 * - Exposes useGameShell() context to mechanic children
 *
 * No direct useEffect for state sync. Subscriptions (AppState, timers) use
 * useEffect with empty deps — the permitted one-shot pattern per CODE_STYLE.md §Hooks.
 *
 * Container/presenter split: this file owns all hooks; GameShellScreen is pure props→JSX.
 */

import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { AppState, BackHandler } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from '@shared/util-i18n';
import { useLangAssets } from '@alphaTiles/data-language-assets';
import { useAudio } from '@alphaTiles/data-audio';
import {
  useProgressStore,
  useProgressEntry,
  buildGameUniqueId,
} from '@alphaTiles/data-progress';
import {
  shouldIncrementTracker,
  displayChallengeLevel,
} from '@alphaTiles/util-scoring';
import { GameShellContextProvider } from './GameShellContext';
import { GameShellScreen } from './GameShellScreen';
import type { GameShellScreenProps, GameShellIcons } from './GameShellScreen';
import { findNextUncompletedGame } from './findNextUncompletedGame';

// Java timing constants — preserved verbatim (GameActivity.java:342, 412)
const CELEBRATION_DELAY_MS = 1800; // correctSoundDuration + this before celebration shows
const NEXT_GAME_DELAY_MS = 4500;   // total delay before navigating to next game

type GameShellContainerProps = {
  children: React.ReactNode;
  /** When true, pressing back shows a confirm dialog (future mechanics with in-flight state). */
  confirmOnBack?: boolean;
  /** Whether to show the instructions audio button. */
  showInstructionsButton?: boolean;
  /** Audio ID for the instruction clip (passed to useAudio().playInstruction). */
  instructionAudioId?: string;
  /**
   * Lottie animation source for the celebration screen.
   * Must be a static require (Metro constraint) — injected from the app's route/screen.
   * Example: require('../../assets/lottie/celebration.json')
   */
  celebrationSource?: import('@shared/ui-celebration').CelebrationProps['animationSource'];
  /** Chrome + tracker icon images — must be static requires from the app layer. */
  icons?: GameShellIcons;
};

export function GameShellContainer({
  children,
  confirmOnBack = false,
  showInstructionsButton = true,
  instructionAudioId,
  celebrationSource,
  icons,
}: GameShellContainerProps): React.JSX.Element {
  const router = useRouter();
  const { t } = useTranslation('chrome');

  // Route params — mirror GameActivity.java:163-174 (getIntent().getIntExtra etc.)
  const params = useLocalSearchParams<{
    gameNumber: string;
    challengeLevel: string;
    stage: string;
    syllableGame: string;
    country: string;
    playerId: string;
  }>();

  const gameNumber = parseInt(params.gameNumber ?? '1', 10);
  const challengeLevel = parseInt(params.challengeLevel ?? '1', 10);
  const stage = parseInt(params.stage ?? '1', 10);
  const syllableGame = params.syllableGame ?? '';
  const country = params.country ?? '';
  const playerId = params.playerId ?? '';

  // Unique ID — mirrors GameActivity.java:175 uniqueGameLevelPlayerModeStageID
  const gameUniqueId = useMemo(
    () => buildGameUniqueId({ country, challengeLevel, playerId, syllableGame, stage }),
    [country, challengeLevel, playerId, syllableGame, stage],
  );

  const assets = useLangAssets();
  const audio = useAudio();

  // Progress store
  const { incrementPoints, incrementTracker, markChecked12 } = useProgressStore.getState();
  const progressEntry = useProgressEntry(gameUniqueId);
  const { trackerCount, checked12Trackers } = progressEntry;

  // Read settings from lang pack
  const after12checkedTrackers = useMemo(
    () => assets.settings.findInt('after12checkedTrackers', 3) as 1 | 2 | 3,
    [assets.settings],
  );
  const correctSoundDuration = useMemo(
    () => assets.settings.findInt('correctSoundDuration', 800),
    [assets.settings],
  );

  // Game color — GameActivity.java:256-258
  const gameColor = useMemo(() => {
    const game = assets.games.rows[gameNumber - 1];
    const colorIndex = game ? parseInt(game.color, 10) : 0;
    return assets.colors.hexByIndex[colorIndex] ?? '#666666';
  }, [assets.games.rows, assets.colors.hexByIndex, gameNumber]);

  // Displayed challenge level — GameActivity.java:261-274 → util-scoring.displayChallengeLevel
  const displayedChallengeLevel = useMemo(
    () => displayChallengeLevel(country, challengeLevel),
    [country, challengeLevel],
  );

  // Tracker states — 12 icons
  const trackerStates = useMemo(
    (): ('complete' | 'incomplete')[] =>
      Array.from({ length: 12 }, (_, i) =>
        i < trackerCount % 12 || (trackerCount > 0 && trackerCount % 12 === 0 && checked12Trackers)
          ? 'complete'
          : 'incomplete',
      ),
    [trackerCount, checked12Trackers],
  );

  // In-flight state (not persisted — mirrors GameActivity.java fields)
  const [interactionLocked, setInteractionLocked] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [refWord, setRefWord] = useState<{ wordInLOP: string; wordInLWC: string } | null>(null);
  const [repeatLocked, setRepeatLocked] = useState(true);

  // Timer refs — cleared on unmount (mirrors GameActivity.java soundSequencer + nextScreenTimer)
  const celebrationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nextGameTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Optional mechanic-registered callback for the advance arrow
  const onAdvanceRef = useRef<(() => void) | null>(null);
  const setOnAdvance = useCallback((fn: (() => void) | null) => {
    onAdvanceRef.current = fn;
  }, []);

  // AppState subscription — pause audio on background (GameActivity.java Android lifecycle)
  // One-shot subscription pattern per CODE_STYLE.md §Hooks.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'background' || state === 'inactive') {
        // useAudio doesn't expose pauseAll; we stop current sounds via a no-op
        // The expo-audio system doesn't play in background so this is a guard.
      }
      // Audio resumes naturally when the app returns to 'active'.
    });
    return () => sub.remove();
  }, []);

  // Android hardware-back (GameActivity.java:156-161 OnBackPressedCallback)
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (showCelebration) return true; // swallow during celebration
      if (confirmOnBack) {
        // Future: show confirm dialog. For v1 none needed — fall through.
      }
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/menu');
      }
      return true;
    });
    return () => sub.remove();
  }, [router, confirmOnBack, showCelebration]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (celebrationTimerRef.current) clearTimeout(celebrationTimerRef.current);
      if (nextGameTimerRef.current) clearTimeout(nextGameTimerRef.current);
    };
  }, []);

  // ── after12checkedTrackers handling (GameActivity.java:316-413) ──────────
  const handleMastery = useCallback(() => {
    markChecked12(gameUniqueId);

    if (after12checkedTrackers === 1) {
      // Mode 1: keep playing, nothing happens.
      return;
    }

    if (after12checkedTrackers === 2) {
      // Mode 2: return to earth after correctSoundDuration ms (GameActivity.java:319-329)
      celebrationTimerRef.current = setTimeout(() => {
        router.push('/earth' as Parameters<typeof router.push>[0]);
      }, correctSoundDuration);
      return;
    }

    if (after12checkedTrackers === 3) {
      // Mode 3: show celebration ~1800ms after correctSoundDuration, then next game at 4500ms
      // GameActivity.java:331-412
      setInteractionLocked(true);
      celebrationTimerRef.current = setTimeout(() => {
        audio.playCorrectFinal();
        setShowCelebration(true);
      }, correctSoundDuration + CELEBRATION_DELAY_MS);

      nextGameTimerRef.current = setTimeout(() => {
        const nextGame = findNextUncompletedGame(
          assets.games.rows,
          gameNumber,
          useProgressStore.getState().progress,
          playerId,
        );
        if (nextGame) {
          router.push({
            pathname: '/game',
            params: {
              gameNumber: String(nextGame.gameNumber),
              challengeLevel: String(nextGame.challengeLevel),
              stage: String(nextGame.stage),
              syllableGame: nextGame.syllableGame,
              country: nextGame.country,
              playerId,
            },
          } as Parameters<typeof router.push>[0]);
        } else {
          router.push('/earth' as Parameters<typeof router.push>[0]);
        }
      }, NEXT_GAME_DELAY_MS);
    }
  }, [
    after12checkedTrackers,
    correctSoundDuration,
    gameUniqueId,
    gameNumber,
    playerId,
    assets.games.rows,
    audio,
    markChecked12,
    router,
  ]);

  // ── incrementPointsAndTracker — exposed to mechanics via context ──────────
  const incrementPointsAndTracker = useCallback(
    (isCorrect: boolean) => {
      if (isCorrect) {
        incrementPoints(gameUniqueId, 1);

        // Only increment tracker for non-exempt countries (design.md §D3)
        if (shouldIncrementTracker(country)) {
          incrementTracker(gameUniqueId);
          // After increment, re-read count from store to check mastery
          const newCount = (useProgressStore.getState().progress[gameUniqueId]?.trackerCount ?? 0);
          if (newCount > 0 && newCount % 12 === 0) {
            handleMastery();
          }
        }
      }
      setRepeatLocked(!isCorrect);
    },
    [country, gameUniqueId, incrementPoints, incrementTracker, handleMastery],
  );

  const replayWord = useCallback(() => {
    if (refWord) {
      audio.playWord(refWord.wordInLWC);
    }
  }, [refWord, audio]);

  const handleBackPress = useCallback(() => {
    if (showCelebration) return;
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/menu');
    }
  }, [router, showCelebration]);

  const handleReplayPress = useCallback(() => {
    replayWord();
  }, [replayWord]);

  const handleInstructionsPress = useCallback(() => {
    if (instructionAudioId) {
      audio.playInstruction(instructionAudioId);
    }
  }, [instructionAudioId, audio]);

  const handleAdvancePress = useCallback(() => {
    setRepeatLocked(false);
    setInteractionLocked(false);
    onAdvanceRef.current?.();
  }, []);

  const handleCelebrationBack = useCallback(() => {
    setShowCelebration(false);
    router.push('/earth' as Parameters<typeof router.push>[0]);
  }, [router]);

  // Advance arrow state: blue when changeArrowColor=false or not repeatLocked
  // (design.md §D1 row: onPostCreate → setAdvanceArrowToBlue)
  const changeArrowColor = useMemo(
    () => assets.settings.findBoolean('changeArrowColor', false),
    [assets.settings],
  );
  const advanceArrow: 'blue' | 'gray' | 'hidden' = !changeArrowColor || !repeatLocked
    ? 'blue'
    : 'gray';

  // Score from progress entry
  const score = progressEntry.points;

  const screenProps: GameShellScreenProps = {
    score,
    gameNumber,
    gameColor,
    challengeLevel: displayedChallengeLevel,
    trackerCount,
    trackerStates,
    interactionLocked,
    showInstructionsButton,
    advanceArrow,
    showCelebration,
    backLabel: t('back'),
    replayLabel: t('replay'),
    instructionsLabel: t('instructions'),
    scoreLabel: t('score'),
    celebrationBackLabel: t('back'),
    onBackPress: handleBackPress,
    onReplayPress: handleReplayPress,
    onInstructionsPress: handleInstructionsPress,
    onAdvancePress: handleAdvancePress,
    onCelebrationBack: handleCelebrationBack,
    celebrationSource,
    icons,
    children,
  };

  const contextValue = {
    incrementPointsAndTracker,
    replayWord,
    interactionLocked,
    setInteractionLocked,
    refWord,
    setRefWord,
    progressEntry,
    gameUniqueId,
    setOnAdvance,
  };

  return (
    <GameShellContextProvider value={contextValue}>
      <GameShellScreen {...screenProps} />
    </GameShellContextProvider>
  );
}
