/**
 * GameShellContainer — owns all shared game lifecycle logic.
 *
 * Ports GameActivity.java abstract class (~1217 LOC) decomposed per design.md §D1:
 * - Route-param extraction (expo-router useLocalSearchParams)
 * - Door progress: trackers, score, mastery action, next door (@alphaTiles/data-door-progress)
 * - Pack speech (speak/durationOf, chain lock) + correct/final chimes (@alphaTiles/data-audio)
 * - i18n strings (react-i18next via @shared/util-i18n)
 * - AppState listener — pause audio when backgrounded (GameActivity.java: Android lifecycle)
 * - Performs the mastery action door progress returns (GameActivity.java:319-412):
 *   menu return, or celebration (correctSoundDuration+1800ms) then next door (4500ms)
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
import { Redirect, useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from '@shared/util-i18n';
import { useLangAssets } from '@alphaTiles/data-language-assets';
import { useAudio, usePackSpeech } from '@alphaTiles/data-audio';
import type { SpeechItem } from '@alphaTiles/data-audio';
import { useActivePlayer } from '@alphaTiles/data-players';
import { useDoor } from '@alphaTiles/data-doors';
import { useDoorProgress } from '@alphaTiles/data-door-progress';
import type { MasteryAction } from '@alphaTiles/data-door-progress';
import { useEffectiveSettings } from '@alphaTiles/data-settings';
import type { Door } from '@alphaTiles/data-doors';
import { GameShellContextProvider } from './GameShellContext';
import { GameShellScreen } from './GameShellScreen';
import type { GameShellScreenProps, GameShellIcons } from './GameShellScreen';
import { buildNextGameHref } from './buildNextGameHref';

// Java timing constants — preserved verbatim (GameActivity.java:342, 412)
const CELEBRATION_DELAY_MS = 1800; // correctSoundDuration + this before celebration shows
const NEXT_GAME_DELAY_MS = 4500;   // total delay before navigating to next game
// Java LoadingScreen.java:270 derives this from zz_correct's length + 200 ms;
// it is not a pack setting. 800 ≈ the bundled chime + 200.
const CORRECT_SOUND_DURATION_MS = 800;

type GameShellContainerProps = {
  /** The mechanic. Pass a function to receive the routed Door (challenge level, variant, …). */
  children: React.ReactNode | ((door: Door) => React.ReactNode);
  /** When true, pressing back shows a confirm dialog (future mechanics with in-flight state). */
  confirmOnBack?: boolean;
  /**
   * Set false to hide the instructions button. Otherwise shown iff the Door
   * has a bundled instruction clip.
   */
  showInstructionsButton?: boolean;
  /** Whether to show the advance arrow button. Defaults true. Set false for games with no lock/unlock mechanic (e.g. Romania). */
  showAdvanceArrow?: boolean;
  /**
   * Optional Lottie override for the celebration screen. Omit to use the
   * bundled `celebrationAnimation` from @shared/ui-celebration. Must be bundled
   * (object or static require), never a remote URI — the app runs offline.
   */
  celebrationSource?: import('@shared/ui-celebration').CelebrationProps['animationSource'];
  /** Chrome + tracker icon images — must be static requires from the app layer. */
  icons?: GameShellIcons;
};

/**
 * Resolves the routed Door (route param `doorIndex`, per the game-menu
 * "Door-press navigation contract") and renders the shell for it. An index
 * that names no door, or a hidden one (`enabled: false`), goes back to the menu.
 */
export function GameShellContainer(props: GameShellContainerProps): React.JSX.Element {
  const door = useDoor(useLocalSearchParams<{ gameNumber?: string; doorIndex?: string }>());
  if (!door) return <Redirect href="/menu" />;
  return <GameShell {...props} door={door} />;
}

function GameShell({
  door,
  children,
  confirmOnBack = false,
  showInstructionsButton = true,
  showAdvanceArrow = true,
  celebrationSource,
  icons,
}: GameShellContainerProps & { door: Door }): React.JSX.Element {
  const router = useRouter();
  const { t } = useTranslation('chrome');

  const assets = useLangAssets();
  const audio = useAudio();
  const activePlayer = useActivePlayer();

  const gameNumber = door.index;
  const instructionAudioId = showInstructionsButton ? door.instructionAudio : undefined;
  const playerId = activePlayer?.id ?? null;

  // Unique ID — mirrors GameActivity.java:175 uniqueGameLevelPlayerModeStageID
  const gameUniqueId = useMemo(() => door.progressKey(playerId ?? ''), [door, playerId]);

  // Door progress: score, trackers, mastery (one rule — see doorProgressOf)
  const progress = useDoorProgress(door, playerId);
  const { trackerCount, recordCorrect, nextDoor } = progress;
  const correctSoundDuration = CORRECT_SOUND_DURATION_MS;

  // Tracker states — 12 icons
  const trackerStates = useMemo(
    () => progress.trackers.map((checked): 'complete' | 'incomplete' => (checked ? 'complete' : 'incomplete')),
    [progress.trackers],
  );

  // In-flight state (not persisted — mirrors GameActivity.java fields)
  const [interactionLocked, setInteractionLockedState] = useState(false);
  // Synchronous mirror so a syllable chain can restore the lock it found
  // (state is stale inside the callbacks that start a chain). `lockWrites`
  // counts every write so a chain's release can tell whether a mechanic set
  // the lock meanwhile (then the mechanic's value wins).
  const interactionLockedRef = useRef(false);
  const lockWritesRef = useRef(0);
  const setInteractionLocked = useCallback((locked: boolean) => {
    lockWritesRef.current++;
    interactionLockedRef.current = locked;
    setInteractionLockedState(locked);
  }, []);
  // Pack speech holds this while a syllable chain plays, then restores the
  // lock it found (a chain replayed after a correct answer must not unlock a
  // solved round — Georgia point-farming bug).
  // Chrome row (back / instructions / replay / advance) has its own lock,
  // like Java setOptionsRowUnclickable: held while a chain plays or a
  // mastery action is pending — never by a mechanic's board lock, so a
  // solved round (board locked until advance) can always be advanced (U1).
  const speechHoldsRef = useRef(0);
  const [speechHeld, setSpeechHeld] = useState(false);
  const [masteryPending, setMasteryPending] = useState(false);
  const holdLockForSpeech = useCallback(() => {
    const before = interactionLockedRef.current;
    setInteractionLocked(true);
    const writes = lockWritesRef.current;
    speechHoldsRef.current++;
    setSpeechHeld(true);
    let released = false;
    return () => {
      if (released) return;
      released = true;
      speechHoldsRef.current--;
      if (speechHoldsRef.current === 0) setSpeechHeld(false);
      if (lockWritesRef.current === writes) setInteractionLocked(before);
    };
  }, [setInteractionLocked]);
  const speech = usePackSpeech(
    { words: assets.words.rows, syllables: assets.syllables.rows },
    holdLockForSpeech,
  );
  const [showCelebration, setShowCelebration] = useState(false);
  const [refWord, setRefWord] = useState<{ wordInLOP: string; wordInLWC: string } | null>(null);
  const [repeatLocked, setRepeatLocked] = useState(true);

  // Timer refs — cleared on unmount (mirrors GameActivity.java soundSequencer + nextScreenTimer)
  const celebrationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nextGameTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Leaving the game must cancel pending mastery navigation: a pushed menu keeps
  // this screen mounted, so unmount cleanup alone never clears these timers.
  const clearMasteryTimers = useCallback(() => {
    setMasteryPending(false);
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
        // expo-audio doesn't play in background; cancel any in-flight
        // syllable chain so it doesn't fire on resume.
        speech.stop();
      }
      // Audio resumes naturally when the app returns to 'active'.
    });
    return () => sub.remove();
  }, [speech]);

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
    };
  }, []);

  // Wrap setRefWord so a round transition cancels any in-flight speech
  // (syllable chain) from the previous word.
  const setRefWordWithChainClear = useCallback(
    (next: { wordInLOP: string; wordInLWC: string } | null) => {
      speech.stop();
      setRefWord(next);
    },
    [speech],
  );

  // ── after12checkedTrackers handling (GameActivity.java:316-413) ──────────
  const handleMastery = useCallback((masteryAction: MasteryAction) => {
    if (masteryAction === 'keep-playing') {
      // Mode 1: keep playing, nothing happens.
      return;
    }

    // Java: options row stays unclickable until the menu / celebration.
    setMasteryPending(true);

    if (masteryAction === 'return-to-menu') {
      // Mode 2: return to earth after correctSoundDuration ms (GameActivity.java:319-329)
      celebrationTimerRef.current = setTimeout(() => {
        router.dismissTo('/menu');
      }, correctSoundDuration);
      return;
    }

    if (masteryAction === 'celebrate-then-next-door') {
      // Mode 3: show celebration ~1800ms after correctSoundDuration, then next game at 4500ms
      // GameActivity.java:331-412
      setInteractionLocked(true);
      celebrationTimerRef.current = setTimeout(() => {
        audio.playCorrectFinal();
        setShowCelebration(true);
      }, correctSoundDuration + CELEBRATION_DELAY_MS);

      nextGameTimerRef.current = setTimeout(() => {
        // replace (not push) so the finished game leaves the stack.
        const href = buildNextGameHref(nextDoor());
        if (href === '/menu') router.dismissTo('/menu');
        else router.replace(href);
      }, NEXT_GAME_DELAY_MS);
    }
  }, [correctSoundDuration, nextDoor, audio, router, setInteractionLocked]);

  // ── incrementPointsAndTracker — exposed to mechanics via context ──────────
  const incrementPointsAndTracker = useCallback(
    (isCorrect: boolean, points = 1) => {
      if (isCorrect) {
        // Points always; a tracker only on doors that track progress.
        const masteryAction = recordCorrect(points);
        if (masteryAction) handleMastery(masteryAction);
      }
      setRepeatLocked(!isCorrect);
    },
    [recordCorrect, handleMastery],
  );

  // Pack speech: games speak items, never audio keys (see usePackSpeech).
  const speak = useCallback((item: SpeechItem) => speech.speak(item), [speech]);
  const durationOf = useCallback((item: SpeechItem) => speech.durationOf(item), [speech]);

  // replayWord — replays the current reference word (shell repeat button).
  const replayWord = useCallback(() => {
    if (!refWord) return;
    speech.speak({ word: refWord });
  }, [refWord, speech]);

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
      speech.speak({ instruction: instructionAudioId });
    }
  }, [instructionAudioId, speech]);

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
  const changeArrowColor = useEffectiveSettings().changeArrowColors;
  const advanceArrow: 'blue' | 'gray' | 'hidden' = !showAdvanceArrow
    ? 'hidden'
    : (!changeArrowColor || !repeatLocked ? 'blue' : 'gray');

  const score = progress.points;

  const a11yLabels = useMemo(() => ({
    advance: t('a11y.advance'),
  }), [t]);

  const screenProps: GameShellScreenProps = {
    score,
    gameNumber,
    gameColor: door.colorHex,
    challengeLevel: door.displayLevel,
    trackerCount,
    trackerStates,
    interactionLocked,
    chromeLocked: speechHeld || masteryPending,
    showInstructionsButton: instructionAudioId !== undefined,
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
    children: typeof children === 'function' ? children(door) : children,
    a11yLabels,
  };

  const contextValue = useMemo(() => ({
    incrementPointsAndTracker,
    replayWord,
    speak,
    durationOf,
    interactionLocked,
    setInteractionLocked,
    refWord,
    setRefWord: setRefWordWithChainClear,
    gameUniqueId,
    setOnAdvance,
    setOnRepeat,
  }), [
    incrementPointsAndTracker,
    replayWord,
    speak,
    durationOf,
    interactionLocked,
    setInteractionLocked,
    refWord,
    setRefWordWithChainClear,
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
