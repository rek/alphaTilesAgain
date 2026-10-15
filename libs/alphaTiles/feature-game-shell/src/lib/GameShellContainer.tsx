/**
 * GameShellContainer — owns all shared game lifecycle logic.
 *
 * Ports GameActivity.java abstract class (~1217 LOC) decomposed per design.md §D1:
 * - Route-param extraction (expo-router useLocalSearchParams)
 * - Progress store read/write (@alphaTiles/data-progress)
 * - Audio replay + correct/incorrect/final sounds (@alphaTiles/data-audio)
 * - i18n strings (react-i18next via @shared/util-i18n)
 * - AppState listener — pause audio when backgrounded (GameActivity.java: Android lifecycle)
 * - "After 12 checked trackers" mode 1/2/3 (GameActivity.java:319-412)
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
import { AppState, BackHandler, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from '@shared/util-i18n';
import { useLangAssets } from '@alphaTiles/data-language-assets';
import { useAudio } from '@alphaTiles/data-audio';
import { useActivePlayer } from '@alphaTiles/data-players';
import {
  useProgressStore,
  useProgressEntry,
  buildGameUniqueId,
} from '@alphaTiles/data-progress';
import {
  shouldIncrementTracker,
  displayChallengeLevel,
} from '@alphaTiles/util-scoring';
import { parseWordIntoSyllables } from '@shared/util-phoneme';
import { GameShellContextProvider } from './GameShellContext';
import { GameShellScreen } from './GameShellScreen';
import type { GameShellScreenProps, GameShellIcons } from './GameShellScreen';
import { findNextUncompletedGame } from './findNextUncompletedGame';
import { buildNextGameHref } from './buildNextGameHref';
import { resolveMasteryAction } from './resolveMasteryAction';

// Java timing constants — preserved verbatim (GameActivity.java:342, 412)
const CELEBRATION_DELAY_MS = 1800; // correctSoundDuration + this before celebration shows
const NEXT_GAME_DELAY_MS = 4500;   // total delay before navigating to next game
// Java LoadingScreen.java:270 derives this from zz_correct's length + 200 ms;
// it is not a pack setting. 800 ≈ the bundled chime + 200.
const CORRECT_SOUND_DURATION_MS = 800;

// Syllable-chain fallback constants (yue-composite-numerals)
// GAP_MS: silent pause between syllables — teaching cue, not concat.
// FALLBACK_MS: per-syllable duration when getSyllableDuration returns undefined
// (matches observed mean of yue base-numeral clips ~400–940ms).
const GAP_MS = 150;
const FALLBACK_MS = 700;

type GameShellContainerProps = {
  children: React.ReactNode;
  /** When true, pressing back shows a confirm dialog (future mechanics with in-flight state). */
  confirmOnBack?: boolean;
  /** Whether to show the instructions audio button. */
  showInstructionsButton?: boolean;
  /** Whether to show the advance arrow button. Defaults true. Set false for games with no lock/unlock mechanic (e.g. Romania). */
  showAdvanceArrow?: boolean;
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
  showAdvanceArrow = true,
  instructionAudioId,
  celebrationSource,
  icons,
}: GameShellContainerProps): React.JSX.Element {
  const router = useRouter();
  const { t } = useTranslation('chrome');

  // Route params — only what the menu pushes per game-menu spec
  // (classKey, doorIndex, challengeLevel). All per-door state below is
  // derived from useLangAssets() + useActivePlayer().
  // `gameNumber` accepted as legacy alias for `doorIndex`.
  const params = useLocalSearchParams<{
    gameNumber: string;
    doorIndex: string;
    challengeLevel: string;
  }>();

  const gameNumber = parseInt(params.gameNumber ?? params.doorIndex ?? '1', 10);
  const challengeLevel = parseInt(params.challengeLevel ?? '1', 10);

  const assets = useLangAssets();
  const audio = useAudio();
  const activePlayer = useActivePlayer();

  const gameRow = assets.games.rows[gameNumber - 1];
  const country = gameRow?.country ?? '';
  const syllableGame = gameRow?.syllOrTile === 'S' ? 'S' : '';
  const stage = gameRow?.stagesIncluded === '-' || !gameRow
    ? 1
    : parseInt(gameRow.stagesIncluded, 10) || 1;
  const playerId = activePlayer?.id ?? '';

  // Unique ID — mirrors GameActivity.java:175 uniqueGameLevelPlayerModeStageID
  const gameUniqueId = useMemo(
    () => buildGameUniqueId({ country, challengeLevel, playerId, syllableGame, stage }),
    [country, challengeLevel, playerId, syllableGame, stage],
  );

  // Progress store
  const { incrementPoints, incrementTracker, markChecked12 } = useProgressStore.getState();
  const progressEntry = useProgressEntry(gameUniqueId);
  const { trackerCount, checked12Trackers } = progressEntry;

  // aa_settings "After 12 checked trackers" (1 keep playing / 2 menu / 3 celebrate)
  const masteryAction = useMemo(
    () => resolveMasteryAction({ settings: assets.settings }),
    [assets.settings],
  );
  const correctSoundDuration = CORRECT_SOUND_DURATION_MS;

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
  const [interactionLocked, setInteractionLockedState] = useState(false);
  // Synchronous mirror so a syllable chain can restore the lock it found
  // (state is stale inside the callbacks that start a chain).
  const interactionLockedRef = useRef(false);
  const setInteractionLocked = useCallback((locked: boolean) => {
    interactionLockedRef.current = locked;
    setInteractionLockedState(locked);
  }, []);
  const [showCelebration, setShowCelebration] = useState(false);
  const [refWord, setRefWord] = useState<{ wordInLOP: string; wordInLWC: string } | null>(null);
  const [repeatLocked, setRepeatLocked] = useState(true);

  // Timer refs — cleared on unmount (mirrors GameActivity.java soundSequencer + nextScreenTimer)
  const celebrationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nextGameTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Syllable-chain fallback timer (single slot, overwritten each step).
  const chainTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearChain = useCallback(() => {
    if (chainTimerRef.current) {
      clearTimeout(chainTimerRef.current);
      chainTimerRef.current = null;
    }
  }, []);

  // Leaving the game must cancel pending mastery navigation: a pushed menu keeps
  // this screen mounted, so unmount cleanup alone never clears these timers.
  const clearMasteryTimers = useCallback(() => {
    if (celebrationTimerRef.current) {
      clearTimeout(celebrationTimerRef.current);
      celebrationTimerRef.current = null;
    }
    if (nextGameTimerRef.current) {
      clearTimeout(nextGameTimerRef.current);
      nextGameTimerRef.current = null;
    }
  }, []);

  // Optional mechanic-registered callback for the advance arrow
  const onAdvanceRef = useRef<(() => void) | null>(null);
  const setOnAdvance = useCallback((fn: (() => void) | null) => {
    onAdvanceRef.current = fn;
  }, []);

  // Optional mechanic-registered callback for the repeat button
  // (overrides the default replayWord — needed for syllable games where the
  // current call audio is a syllable clip, not a word clip).
  const onRepeatRef = useRef<(() => void) | null>(null);
  const setOnRepeat = useCallback((fn: (() => void) | null) => {
    onRepeatRef.current = fn;
  }, []);

  // AppState subscription — pause audio on background (GameActivity.java Android lifecycle)
  // One-shot subscription pattern per CODE_STYLE.md §Hooks.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'background' || state === 'inactive') {
        // useAudio doesn't expose pauseAll; we stop current sounds via a no-op
        // The expo-audio system doesn't play in background so this is a guard.
        // Cancel any in-flight syllable chain so it doesn't fire on resume.
        if (chainTimerRef.current) {
          clearTimeout(chainTimerRef.current);
          chainTimerRef.current = null;
        }
      }
      // Audio resumes naturally when the app returns to 'active'.
    });
    return () => sub.remove();
  }, []);

  // Android hardware-back (GameActivity.java:156-161 OnBackPressedCallback)
  useEffect(() => {
    if (Platform.OS === 'web') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (showCelebration) return true; // swallow during celebration
      if (confirmOnBack) {
        // Future: show confirm dialog. For v1 none needed — fall through.
      }
      clearMasteryTimers(); // e.g. pending mode-2 menu return
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/menu');
      }
      return true;
    });
    return () => sub.remove();
  }, [router, confirmOnBack, showCelebration, clearMasteryTimers]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (celebrationTimerRef.current) clearTimeout(celebrationTimerRef.current);
      if (nextGameTimerRef.current) clearTimeout(nextGameTimerRef.current);
      if (chainTimerRef.current) clearTimeout(chainTimerRef.current);
    };
  }, []);

  // Wrap setRefWord so a round transition cancels any in-flight syllable chain
  // from the previous word (yue-composite-numerals).
  const setRefWordWithChainClear = useCallback(
    (next: { wordInLOP: string; wordInLWC: string } | null) => {
      clearChain();
      setRefWord(next);
    },
    [clearChain],
  );

  // ── after12checkedTrackers handling (GameActivity.java:316-413) ──────────
  const handleMastery = useCallback(() => {
    markChecked12(gameUniqueId);

    if (masteryAction === 'keep-playing') {
      // Mode 1: keep playing, nothing happens.
      return;
    }

    if (masteryAction === 'return-to-menu') {
      // Mode 2: return to earth after correctSoundDuration ms (GameActivity.java:319-329)
      celebrationTimerRef.current = setTimeout(() => {
        router.dismissTo('/menu');
      }, correctSoundDuration);
      return;
    }

    if (masteryAction === 'celebrate-then-next-game') {
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
        // replace (not push) so the finished game leaves the stack.
        const href = buildNextGameHref(nextGame);
        if (href === '/menu') router.dismissTo('/menu');
        else router.replace(href);
      }, NEXT_GAME_DELAY_MS);
    }
  }, [
    masteryAction,
    correctSoundDuration,
    gameUniqueId,
    gameNumber,
    playerId,
    assets.games.rows,
    audio,
    markChecked12,
    router,
    setInteractionLocked,
  ]);

  // ── incrementPointsAndTracker — exposed to mechanics via context ──────────
  const incrementPointsAndTracker = useCallback(
    (isCorrect: boolean, points = 1) => {
      if (isCorrect) {
        incrementPoints(gameUniqueId, points);

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

  // Expected ms playWordAudio(word) plays: word clip, or syllable chain + gaps.
  const getWordAudioDuration = useCallback(
    (word: { wordInLOP: string; wordInLWC: string }): number | undefined => {
      const wordMs = audio.getWordDuration(word.wordInLWC);
      if (wordMs !== undefined) return wordMs;
      const parts = parseWordIntoSyllables(word.wordInLOP, assets.syllables.rows);
      if (parts.length === 0) return undefined;
      return parts.reduce(
        (sum, p, i) => sum + (audio.getSyllableDuration(p.syllable) ?? FALLBACK_MS) + (i > 0 ? GAP_MS : 0),
        0,
      );
    },
    [audio, assets.syllables.rows],
  );

  // playWordAudio — plays a word's audio, three branches:
  //   A: per-word audio handle exists → play it (legacy single-clip path).
  //   B: no word handle but LOP fully decomposes into known syllables →
  //      schedule a syllable chain via setTimeout timer-ref. Locks interaction
  //      for the chain's duration, then restores the lock state it found
  //      (so a chain after a correct answer can't unlock a solved round).
  //   C: neither resolves → no-op (audio layer's warn-once handles the log).
  // Returns the expected playback length in ms (undefined when unknown) so
  // mechanics can schedule follow-up audio/advance timers.
  const playWordAudio = useCallback(
    (word: { wordInLOP: string; wordInLWC: string }): number | undefined => {
      clearChain();
      const wordMs = audio.getWordDuration(word.wordInLWC);
      if (wordMs !== undefined) {
        audio.playWord(word.wordInLWC);
        return wordMs;
      }
      const parts = parseWordIntoSyllables(word.wordInLOP, assets.syllables.rows);
      if (parts.length === 0) {
        // Branch C: fall through to playWord which emits the warn-once message.
        audio.playWord(word.wordInLWC);
        return undefined;
      }
      const lockedBefore = interactionLockedRef.current;
      setInteractionLocked(true);
      const durations = parts.map((p) => audio.getSyllableDuration(p.syllable) ?? FALLBACK_MS);
      const playStep = (i: number) => {
        audio.playSyllable(parts[i].syllable);
        if (i + 1 < parts.length) {
          chainTimerRef.current = setTimeout(() => playStep(i + 1), durations[i] + GAP_MS);
        } else {
          chainTimerRef.current = setTimeout(() => {
            chainTimerRef.current = null;
            setInteractionLocked(lockedBefore);
          }, durations[i]);
        }
      };
      playStep(0);
      return getWordAudioDuration(word);
    },
    [audio, assets.syllables.rows, clearChain, setInteractionLocked, getWordAudioDuration],
  );

  // replayWord — replays the current reference word (shell repeat button).
  const replayWord = useCallback(() => {
    if (!refWord) return;
    playWordAudio(refWord);
  }, [refWord, playWordAudio]);

  const handleBackPress = useCallback(() => {
    if (showCelebration) return;
    clearMasteryTimers();
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/menu');
    }
  }, [router, showCelebration, clearMasteryTimers]);

  const handleReplayPress = useCallback(() => {
    if (onRepeatRef.current) {
      onRepeatRef.current();
    } else {
      replayWord();
    }
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
  }, [setInteractionLocked]);

  const handleCelebrationBack = useCallback(() => {
    clearMasteryTimers();
    setShowCelebration(false);
    // dismissTo pops back to the existing menu instead of stacking another.
    router.dismissTo('/menu');
  }, [router, clearMasteryTimers]);

  // Advance arrow state: blue when changeArrowColor=false or not repeatLocked
  // (design.md §D1 row: onPostCreate → setAdvanceArrowToBlue)
  const changeArrowColor = useMemo(
    // Java label "Change arrow colors" (Start.java:128). Java defaults true; TS
    // keeps false so no-right/wrong games' arrow is never stuck gray.
    () => assets.settings.findBoolean('Change arrow colors', false),
    [assets.settings],
  );
  const advanceArrow: 'blue' | 'gray' | 'hidden' = !showAdvanceArrow
    ? 'hidden'
    : (!changeArrowColor || !repeatLocked ? 'blue' : 'gray');

  // Score from progress entry
  const score = progressEntry.points;

  const a11yLabels = useMemo(() => ({
    advance: t('a11y.advance'),
  }), [t]);

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
    a11yLabels,
  };

  const contextValue = useMemo(() => ({
    incrementPointsAndTracker,
    replayWord,
    playWordAudio,
    getWordAudioDuration,
    interactionLocked,
    setInteractionLocked,
    refWord,
    setRefWord: setRefWordWithChainClear,
    progressEntry,
    gameUniqueId,
    setOnAdvance,
    setOnRepeat,
  }), [
    incrementPointsAndTracker,
    replayWord,
    playWordAudio,
    getWordAudioDuration,
    interactionLocked,
    setInteractionLocked,
    refWord,
    setRefWordWithChainClear,
    progressEntry,
    gameUniqueId,
    setOnAdvance,
    setOnRepeat,
  ]);

  return (
    <GameShellContextProvider value={contextValue}>
      <GameShellScreen {...screenProps} />
    </GameShellContextProvider>
  );
}
