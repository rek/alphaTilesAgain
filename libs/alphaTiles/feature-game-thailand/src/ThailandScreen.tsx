import React from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import type { ImageSourcePropType } from 'react-native';
import type { ThailandType } from './decodeThailandChallengeLevel';

// Java 588-595 correct-feedback parity: when the player taps the correct
// choice and choiceType !== WORD_IMAGE the correct button takes refColor +
// white text; when choiceType === WORD_IMAGE the THREE non-correct buttons
// instead get a white background. The container computes the choice colours
// (it knows refColor + choiceType) and passes them via `choiceFeedback`.
//
// TODO(thailand-spec-drift): thailand2 larger layout variant when
// choiceType === WORD_TEXT (Java 89-96) is deferred — see CLAUDE.md task list.
const DEFAULT_CHOICE_BG = '#A9A9A9';
const REF_AUDIO_BG = '#1565C0';
const REF_TEXT_BG = '#E0E0E0';
const REF_WORD_TEXT_COLOR = '#000000';
const CHOICE_TEXT_COLOR = '#000000';
const WHITE = '#FFFFFF';

export type ThailandRefDisplay =
  | { type: 'text'; text: string; backgroundColor: string; textColor: string }
  | { type: 'image'; imageSource: ImageSourcePropType | undefined; wordLabel: string }
  | { type: 'audio'; refType: ThailandType };

export type ThailandChoiceDisplay =
  | { type: 'text'; text: string }
  | { type: 'image'; imageSource: ImageSourcePropType | undefined; wordLabel: string };

/**
 * Per-choice visual override applied when correctIndex !== null. The
 * container builds this once, encoding Java 588-595 semantics:
 *   - non-WORD_IMAGE rounds: correct = { bg: refColor, fg: white }, others = null
 *   - WORD_IMAGE rounds: correct = null, others = { bg: white }
 */
export type ThailandChoiceFeedback = {
  backgroundColor?: string;
  textColor?: string;
} | null;

export type ThailandScreenProps = {
  refDisplay: ThailandRefDisplay;
  choices: [ThailandChoiceDisplay, ThailandChoiceDisplay, ThailandChoiceDisplay, ThailandChoiceDisplay];
  correctIndex: number | null;
  /** One slot per choice; ignored unless correctIndex !== null. */
  choiceFeedback?: [ThailandChoiceFeedback, ThailandChoiceFeedback, ThailandChoiceFeedback, ThailandChoiceFeedback];
  interactionLocked: boolean;
  onChoicePress: (index: number) => void;
  onRefPress: () => void;
  accessibilityRefLabel: string;
  accessibilityChoiceLabels: [string, string, string, string];
};

function RefDisplay({
  refDisplay,
  cellSize,
  onRefPress,
  accessibilityLabel,
}: {
  refDisplay: ThailandRefDisplay;
  cellSize: number;
  onRefPress: () => void;
  accessibilityLabel: string;
}): React.JSX.Element {
  if (refDisplay.type === 'image') {
    return (
      <Pressable
        onPress={onRefPress}
        style={[styles.refCell, { width: cellSize * 2, height: cellSize * 2 }]}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="imagebutton"
      >
        {refDisplay.imageSource ? (
          <Image
            source={refDisplay.imageSource}
            style={styles.refImage}
            resizeMode="contain"
            accessibilityElementsHidden
            importantForAccessibility="no"
          />
        ) : (
          <Text style={styles.refFallbackText} numberOfLines={1} adjustsFontSizeToFit>
            {refDisplay.wordLabel}
          </Text>
        )}
      </Pressable>
    );
  }

  if (refDisplay.type === 'audio') {
    return (
      <Pressable
        onPress={onRefPress}
        style={[styles.refCell, styles.refAudioCell, { width: cellSize * 2, height: cellSize * 2 }]}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
      >
        <Text style={styles.audioIcon}>🔊</Text>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onRefPress}
      style={[
        styles.refCell,
        styles.refTextCell,
        { width: cellSize * 2, height: cellSize * 2, backgroundColor: refDisplay.backgroundColor },
      ]}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
    >
      <Text
        style={[styles.refText, { color: refDisplay.textColor }]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {refDisplay.text}
      </Text>
    </Pressable>
  );
}

function ChoiceCell({
  choice,
  feedback,
  interactionLocked,
  cellSize,
  onPress,
  accessibilityLabel,
}: {
  choice: ThailandChoiceDisplay;
  feedback: ThailandChoiceFeedback;
  interactionLocked: boolean;
  cellSize: number;
  onPress: () => void;
  accessibilityLabel: string;
}): React.JSX.Element {
  const bg = feedback?.backgroundColor ?? DEFAULT_CHOICE_BG;
  const fg = feedback?.textColor ?? CHOICE_TEXT_COLOR;

  return (
    <Pressable
      onPress={interactionLocked ? undefined : onPress}
      style={({ pressed }) => [
        styles.choiceCell,
        { width: cellSize, height: cellSize, backgroundColor: bg },
        pressed && !interactionLocked && styles.pressed,
      ]}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
    >
      {choice.type === 'image' ? (
        choice.imageSource ? (
          <Image
            source={choice.imageSource}
            style={styles.choiceImage}
            resizeMode="contain"
            accessibilityElementsHidden
            importantForAccessibility="no"
          />
        ) : (
          <Text style={[styles.choiceText, { color: fg }]} numberOfLines={1} adjustsFontSizeToFit>
            {choice.wordLabel}
          </Text>
        )
      ) : (
        <Text style={[styles.choiceText, { color: fg }]} numberOfLines={1} adjustsFontSizeToFit>
          {choice.text}
        </Text>
      )}
    </Pressable>
  );
}

export function ThailandScreen({
  refDisplay,
  choices,
  correctIndex,
  choiceFeedback,
  interactionLocked,
  onChoicePress,
  onRefPress,
  accessibilityRefLabel,
  accessibilityChoiceLabels,
}: ThailandScreenProps): React.JSX.Element {
  const { width, height } = useWindowDimensions();
  const cellSize = Math.max(60, Math.min(Math.floor(width / 3), Math.floor(height * 0.25)));

  const feedbackFor = (i: 0 | 1 | 2 | 3): ThailandChoiceFeedback =>
    correctIndex !== null && choiceFeedback ? choiceFeedback[i] : null;

  return (
    <View style={styles.root}>
      <RefDisplay
        refDisplay={refDisplay}
        cellSize={cellSize}
        onRefPress={onRefPress}
        accessibilityLabel={accessibilityRefLabel}
      />

      <View style={styles.grid}>
        <View style={styles.gridRow}>
          {([0, 1] as const).map((i) => (
            <ChoiceCell
              key={i}
              choice={choices[i]}
              feedback={feedbackFor(i)}
              interactionLocked={interactionLocked}
              cellSize={cellSize}
              onPress={() => onChoicePress(i)}
              accessibilityLabel={accessibilityChoiceLabels[i]}
            />
          ))}
        </View>
        <View style={styles.gridRow}>
          {([2, 3] as const).map((i) => (
            <ChoiceCell
              key={i}
              choice={choices[i]}
              feedback={feedbackFor(i)}
              interactionLocked={interactionLocked}
              cellSize={cellSize}
              onPress={() => onChoicePress(i)}
              accessibilityLabel={accessibilityChoiceLabels[i]}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingHorizontal: 12,
  },
  refCell: {
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: REF_TEXT_BG,
  },
  refAudioCell: {
    backgroundColor: REF_AUDIO_BG,
  },
  refTextCell: {
    // backgroundColor set inline from refColor
  },
  refImage: {
    width: '85%',
    height: '85%',
  },
  refFallbackText: {
    color: REF_WORD_TEXT_COLOR,
    fontSize: 18,
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  refText: {
    color: WHITE,
    fontSize: 36,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  audioIcon: {
    fontSize: 48,
  },
  grid: {
    gap: 10,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 10,
  },
  choiceCell: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  choiceImage: {
    width: '80%',
    height: '80%',
  },
  choiceText: {
    color: CHOICE_TEXT_COLOR,
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.93 }],
  },
});
