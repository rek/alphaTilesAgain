/**
 * GameShellScreen — pure props → JSX presenter.
 *
 * Composes:
 *  - <ScoreBar> at top (game number, challenge level, 12 tracker icons, score)
 *  - children slot in the middle (mechanic-specific board)
 *  - bottom chrome row (back, instructions, audio-replay, advance arrow)
 *  - <Celebration> overlay when showCelebration is true
 *
 * Zero hooks, zero i18n imports, zero data-access imports per design.md §D2 rule.
 * Strings arrive as pre-translated props from GameShellContainer.
 */

import React from 'react';
import {
  Image,
  ImageSourcePropType,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ScoreBar } from '@shared/ui-score-bar';
import { Celebration, celebrationAnimation } from '@shared/ui-celebration';
import type { CelebrationProps } from '@shared/ui-celebration';

export type GameShellIcons = {
  back?: ImageSourcePropType;
  instructions?: ImageSourcePropType;
  trackerComplete?: ImageSourcePropType;
  trackerIncomplete?: ImageSourcePropType;
};

export type GameShellScreenProps = {
  score: number;
  gameNumber: number;
  gameColor: string;
  challengeLevel: number;
  trackerCount: number;
  trackerStates: ('complete' | 'incomplete')[]; // always length 12
  /** Board lock (mechanic-owned): dims the board slot only. */
  interactionLocked: boolean;
  /**
   * Chrome-row lock (Java setOptionsRowUnclickable): pack speech chain
   * playing or a mastery action pending. Separate from the board lock — a
   * solved round keeps its board locked until the advance arrow is pressed,
   * so the arrow must not obey it.
   */
  chromeLocked: boolean;
  showInstructionsButton: boolean;
  advanceArrow: 'blue' | 'gray' | 'hidden';
  showCelebration: boolean;
  // Pre-translated strings
  backLabel: string;
  replayLabel: string;
  instructionsLabel: string;
  scoreLabel: string;
  celebrationBackLabel: string;
  /** Pre-translated accessibility labels (container owns i18n). */
  a11yLabels: {
    advance: string;
    /** Summary of the 12 trackers for the score bar. */
    trackers: string;
  };
  // Handlers
  onBackPress: () => void;
  onReplayPress: () => void;
  onInstructionsPress: () => void;
  onAdvancePress: () => void;
  onCelebrationBack: () => void;
  // Slot
  children: React.ReactNode;
  /** Lottie source for the celebration screen. Defaults to the bundled in-house animation (offline, no third-party fetch). */
  celebrationSource?: CelebrationProps['animationSource'];
  /** Chrome + tracker icon images — injected from app (Metro static require). */
  icons?: GameShellIcons;
};

export function GameShellScreen({
  score,
  gameNumber,
  gameColor,
  challengeLevel,
  trackerStates,
  interactionLocked,
  chromeLocked,
  showInstructionsButton,
  advanceArrow,
  showCelebration,
  backLabel,
  replayLabel,
  instructionsLabel,
  scoreLabel,
  celebrationBackLabel,
  onBackPress,
  onReplayPress,
  onInstructionsPress,
  onAdvancePress,
  onCelebrationBack,
  children,
  celebrationSource = celebrationAnimation,
  icons,
  a11yLabels,
}: GameShellScreenProps): React.JSX.Element {
  const trackerIcons =
    icons?.trackerComplete && icons?.trackerIncomplete
      ? { complete: icons.trackerComplete, incomplete: icons.trackerIncomplete }
      : undefined;

  return (
    <SafeAreaView style={styles.screen}>
      {/* Score bar (GameActivity.java:251-314 updatePointsAndTrackers UI) */}
      <ScoreBar
        gameNumber={gameNumber}
        gameColor={gameColor}
        challengeLevel={challengeLevel}
        trackerStates={trackerStates}
        score={score}
        scoreLabel={scoreLabel}
        trackersLabel={a11yLabels.trackers}
        trackerIcons={trackerIcons}
      />

      {/* Mechanic-specific board slot */}
      <View style={[styles.content, interactionLocked && styles.contentLocked]}>
        {children}
      </View>

      {/* Bottom chrome row (GameActivity.java: goBackToEarth, playAudioInstructions, clickPicHearAudio, setAdvanceArrowToBlue) */}
      <View style={styles.chrome}>
        {/* Back / home button */}
        <Pressable
          onPress={onBackPress}
          style={styles.chromeButton}
          accessibilityLabel={backLabel}
          accessibilityRole="button"
          disabled={chromeLocked}
        >
          {icons?.back ? (
            <Image source={icons.back} style={styles.chromeIcon} />
          ) : (
            <Text style={styles.chromeLabel}>{backLabel}</Text>
          )}
        </Pressable>

        {/* Instructions button — hidden when showInstructionsButton is false */}
        {showInstructionsButton && (
          <Pressable
            onPress={onInstructionsPress}
            style={styles.chromeButton}
            accessibilityLabel={instructionsLabel}
            accessibilityRole="button"
            disabled={chromeLocked}
          >
            {icons?.instructions ? (
              <Image source={icons.instructions} style={styles.chromeIcon} />
            ) : (
              <Text style={styles.chromeLabel}>{instructionsLabel}</Text>
            )}
          </Pressable>
        )}

        {/* Audio-replay button — always visible */}
        <Pressable
          onPress={onReplayPress}
          style={[styles.chromeButton, advanceArrow === 'gray' && styles.chromeButtonGray]}
          accessibilityLabel={replayLabel}
          accessibilityRole="button"
          disabled={chromeLocked || advanceArrow === 'gray'}
        >
          <Text style={[styles.chromeLabel, advanceArrow === 'gray' && styles.chromeLabelGray]}>
            {replayLabel}
          </Text>
        </Pressable>

        {/* Advance arrow (separate from replay) — hidden when advanceArrow='hidden' */}
        {advanceArrow !== 'hidden' && (
          <Pressable
            onPress={onAdvancePress}
            style={[styles.chromeButton, advanceArrow === 'gray' && styles.chromeButtonGray]}
            accessibilityLabel={a11yLabels.advance}
            accessibilityRole="button"
            disabled={chromeLocked || advanceArrow === 'gray'}
          >
            <MaterialIcons
              name="arrow-forward"
              size={28}
              color={advanceArrow === 'gray' ? '#e0e0e0' : '#fff'}
            />
          </Pressable>
        )}
      </View>

      {/* Celebration overlay (GameActivity.java:331-342 / Celebration.java) */}
      {showCelebration && (
        <Celebration
          animationSource={celebrationSource}
          onBackPress={onCelebrationBack}
          backLabel={celebrationBackLabel}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  contentLocked: {
    opacity: 0.6,
    pointerEvents: 'none' as never,
  },
  chrome: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  chromeButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#2196F3',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
    minHeight: 48,
  },
  chromeButtonGray: {
    backgroundColor: '#9E9E9E',
  },
  chromeLabel: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  chromeLabelGray: {
    color: '#e0e0e0',
  },
  chromeIcon: {
    width: 32,
    height: 32,
    resizeMode: 'contain',
  },
});
