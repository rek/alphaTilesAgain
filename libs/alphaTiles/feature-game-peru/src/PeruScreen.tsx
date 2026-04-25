/**
 * Pure presenter for the Peru 4-choice word-recognition game.
 * Word image at top (tappable to repeat audio); 2x2 grid of 4 choice buttons below.
 *
 * Zero hooks except useWindowDimensions; zero i18n imports.
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

export type PeruChoice = {
  text: string;
  grayed: boolean;
  bgColor: string;
};

export type PeruScreenProps = {
  wordImage: ImageSourcePropType | undefined;
  /** Fallback label when image is missing (wordInLWC). */
  wordLabel: string;
  choices: PeruChoice[];
  interactionLocked: boolean;
  onChoicePress: (index: number) => void;
  onImagePress: () => void;
};

export function PeruScreen({
  wordImage,
  wordLabel,
  choices,
  interactionLocked,
  onChoicePress,
  onImagePress,
}: PeruScreenProps): React.JSX.Element {
  const { width, height } = useWindowDimensions();
  const imageSize = Math.min(Math.floor(width * 0.5), Math.floor(height * 0.35));
  const buttonWidth = Math.floor((width - 32) / 2);
  const buttonHeight = Math.max(64, Math.floor(height * 0.12));

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
          <Text style={styles.imageFallback} numberOfLines={2} adjustsFontSizeToFit>
            {wordLabel}
          </Text>
        )}
      </Pressable>

      <View style={styles.grid}>
        {choices.map((choice, i) => {
          const bg = choice.grayed ? GRAYED_BG : choice.bgColor;
          const fg = choice.grayed ? GRAYED_TEXT : BUTTON_TEXT;
          return (
            <Pressable
              key={i}
              onPress={interactionLocked || choice.grayed ? undefined : () => onChoicePress(i)}
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
              accessibilityState={{ disabled: choice.grayed || interactionLocked }}
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
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 24,
  },
  imageWrap: {
    backgroundColor: '#EEEEEE',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    width: '90%',
    height: '90%',
  },
  imageFallback: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  buttonText: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.97 }],
  },
});
