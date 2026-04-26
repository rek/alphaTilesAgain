/**
 * Pure presenter for the Georgia first-sound-identification game.
 *
 * Word image at top (tappable to repeat audio); under it, a grid of N choice
 * buttons (N = 6 / 12 / 18 per CL band). After the player picks correctly,
 * the stripped word text appears below the image.
 *
 * Zero hooks except useWindowDimensions; zero i18n imports (per ADR — UI lib
 * may not import react-i18next; container passes pre-translated strings).
 */
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

const GRAYED_BG = '#A9A9A9';
const GRAYED_TEXT = '#000000';
const BUTTON_TEXT = '#FFFFFF';

export type GeorgiaChoice = {
  text: string;
  grayed: boolean;
  bgColor: string;
};

export type GeorgiaGridShape = 6 | 12 | 18;

export type GeorgiaScreenProps = {
  wordImage: ImageSourcePropType | undefined;
  /** Fallback label when the image asset is missing. */
  wordLabel: string;
  /** Stripped wordInLOP shown only after a correct pick. Empty string hides it. */
  revealedText: string;
  choices: GeorgiaChoice[];
  gridShape: GeorgiaGridShape;
  interactionLocked: boolean;
  onChoicePress: (index: number) => void;
  onImagePress: () => void;
};

function columnsFor(gridShape: GeorgiaGridShape): number {
  if (gridShape === 6) return 3;
  if (gridShape === 12) return 4;
  return 6;
}

export function GeorgiaScreen({
  wordImage,
  wordLabel,
  revealedText,
  choices,
  gridShape,
  interactionLocked,
  onChoicePress,
  onImagePress,
}: GeorgiaScreenProps): React.JSX.Element {
  const { width, height } = useWindowDimensions();
  const imageSize = Math.min(
    Math.floor(width * 0.45),
    Math.floor(height * 0.3),
  );
  const cols = columnsFor(gridShape);
  const buttonWidth = Math.floor((width - 16 - (cols + 1) * 6) / cols);
  const buttonHeight = Math.max(
    44,
    Math.floor(((height - imageSize - 80) / Math.ceil(gridShape / cols)) - 6),
  );

  return (
    <View style={styles.root}>
      <Pressable
        onPress={interactionLocked ? undefined : onImagePress}
        style={[styles.imageWrap, { width: imageSize, height: imageSize }]}
        accessibilityLabel={wordLabel}
        accessibilityRole="button"
      >
        {wordImage ? (
          <Image
            source={wordImage}
            style={styles.image}
            resizeMode="contain"
            accessibilityElementsHidden
            importantForAccessibility="no"
          />
        ) : (
          <Text
            style={styles.imageFallback}
            numberOfLines={2}
            adjustsFontSizeToFit
          >
            {wordLabel}
          </Text>
        )}
      </Pressable>

      {revealedText ? (
        <Text style={styles.revealedText} numberOfLines={1} adjustsFontSizeToFit>
          {revealedText}
        </Text>
      ) : null}

      <View style={styles.grid}>
        {choices.map((choice, i) => {
          const bg = choice.grayed ? GRAYED_BG : choice.bgColor;
          const fg = choice.grayed ? GRAYED_TEXT : BUTTON_TEXT;
          return (
            <Pressable
              key={i}
              onPress={
                interactionLocked || choice.grayed
                  ? undefined
                  : () => onChoicePress(i)
              }
              style={({ pressed }) => [
                styles.button,
                {
                  width: buttonWidth,
                  height: buttonHeight,
                  backgroundColor: bg,
                },
                pressed && !choice.grayed && styles.pressed,
              ]}
              accessibilityLabel={choice.text}
              accessibilityRole="button"
              accessibilityState={{
                disabled: choice.grayed || interactionLocked,
              }}
            >
              <Text
                style={[styles.buttonText, { color: fg }]}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {choice.text}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingVertical: 12,
    gap: 12,
  },
  imageWrap: {
    backgroundColor: '#EEEEEE',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: { width: '90%', height: '90%' },
  imageFallback: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  revealedText: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#222',
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  button: {
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  buttonText: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  pressed: { opacity: 0.78, transform: [{ scale: 0.97 }] },
});
