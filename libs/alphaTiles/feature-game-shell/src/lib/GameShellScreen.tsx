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
import { Celebration } from '@shared/ui-celebration';
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
  interactionLocked: boolean;
  showInstructionsButton: boolean;
  advanceArrow: 'blue' | 'gray' | 'hidden';
  showCelebration: boolean;
  // Pre-translated strings
  backLabel: string;
  replayLabel: string;
  instructionsLabel: string;
  scoreLabel: string;
  celebrationBackLabel: string;
  // Handlers
  onBackPress: () => void;
  onReplayPress: () => void;
  onInstructionsPress: () => void;
  onAdvancePress: () => void;
  onCelebrationBack: () => void;
  // Slot
  children: React.ReactNode;
  /** Lottie animation source for the celebration screen — injected from app (Metro static require). */
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
  celebrationSource = { uri: 'https://assets10.lottiefiles.com/packages/lf20_jR229r.json' },
  icons,
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
          disabled={interactionLocked}
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
            disabled={interactionLocked}
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
          disabled={interactionLocked || advanceArrow === 'gray'}
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
            accessibilityLabel="advance"
            accessibilityRole="button"
            disabled={interactionLocked || advanceArrow === 'gray'}
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
  },
  chromeButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#2196F3',
    alignItems: 'center',
    minWidth: 60,
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
