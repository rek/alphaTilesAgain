/**
 * Pure presenter for the Mexico matching/memory game.
 * Zero hook imports, zero i18n imports — all data arrives as props.
 *
 * Layout: responsive wrap grid of cards.
 * Face-down: AlphaTiles logo image (zz_alphatileslogo2 via logoSource prop).
 * Face-up TEXT: word text in theme color.
 * Face-up IMAGE: word image.
 * PAIRED: word text in theme color, paired background tint.
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
import type { CardState } from './setupMexicoBoard';

const HIDDEN_BG = '#555555';
const PAIRED_BG = '#E8F5E9';
const REVEALED_BG = '#1565C0';
const BLANK_CARD_BG = '#E0E0E0';
const TEXT_LIGHT = '#FFFFFF';
const TEXT_DARK = '#000000';
const GAP = 4;

/** Minimum contrast color for text over a hex background. */
function contrastColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return 0.299 * r + 0.587 * g + 0.114 * b > 127.5 ? TEXT_DARK : TEXT_LIGHT;
}

export type MexicoScreenProps = {
  cards: CardState[];
  /** Image sources keyed by wordInLWC. */
  wordImages: Record<string, ImageSourcePropType | undefined>;
  /** The AlphaTiles logo — shown on face-down cards. */
  logoSource: ImageSourcePropType;
  /** Theme color hex — used for paired card text and border. */
  themeColor: string;
  interactionLocked: boolean;
  onCardPress: (index: number) => void;
};

export function MexicoScreen({
  cards,
  wordImages,
  logoSource,
  themeColor,
  interactionLocked,
  onCardPress,
}: MexicoScreenProps): React.JSX.Element {
  const { width, height } = useWindowDimensions();

  // Compute card size: fit the most cards possible while keeping them square.
  // Cards range from 6 to 20; target ~4 columns as a sensible default.
  const totalCards = cards.length;
  const cols = totalCards <= 8 ? 2 : totalCards <= 12 ? 3 : 4;
  const availableWidth = width - GAP * (cols + 1);
  const cardByWidth = Math.floor(availableWidth / cols);
  // Leave room for shell chrome (~35% of height)
  const rows = Math.ceil(totalCards / cols);
  const availableHeight = height * 0.65 - GAP * (rows + 1);
  const cardByHeight = rows > 0 ? Math.floor(availableHeight / rows) : cardByWidth;
  const cardSize = Math.max(56, Math.min(cardByWidth, cardByHeight));

  const themeTextColor = contrastColor(themeColor);

  return (
    <View style={styles.root}>
      <View style={[styles.grid, { gap: GAP }]}>
        {cards.map((card, index) => {
          const isHidden = card.status === 'HIDDEN';
          const isPaired = card.status === 'PAIRED';
          const isRevealed = card.status === 'REVEALED';

          let bgColor = HIDDEN_BG;
          if (isPaired) bgColor = PAIRED_BG;
          else if (isRevealed && card.mode === 'TEXT') bgColor = REVEALED_BG;
          else if (isRevealed && card.mode === 'IMAGE') bgColor = BLANK_CARD_BG;

          // Per-pair color (Mexico.java:307 colorList[cardHitA % 5]) overrides default.
          const cardThemeColor = card.pairedColor ?? themeColor;

          const imgSrc = card.mode === 'IMAGE' ? wordImages[card.word.wordInLWC] : undefined;

          return (
            <Pressable
              key={index}
              onPress={interactionLocked || isPaired ? undefined : () => onCardPress(index)}
              style={({ pressed }) => [
                styles.card,
                {
                  width: cardSize,
                  height: cardSize,
                  backgroundColor: bgColor,
                  borderColor: isPaired ? cardThemeColor : 'transparent',
                  borderWidth: isPaired ? 2 : 0,
                },
                pressed && !isPaired && !isHidden && styles.pressed,
              ]}
              accessibilityLabel={
                isHidden ? 'hidden card' : `${card.mode.toLowerCase()} card: ${card.word.wordInLWC}`
              }
              accessibilityRole="button"
              accessibilityState={{ disabled: isPaired || interactionLocked }}
            >
              {isHidden && (
                <Image
                  source={logoSource}
                  style={styles.cardImage}
                  resizeMode="contain"
                  accessibilityElementsHidden
                  importantForAccessibility="no"
                />
              )}

              {!isHidden && card.mode === 'TEXT' && (
                <Text
                  style={[
                    styles.cardText,
                    {
                      color: isPaired ? cardThemeColor : TEXT_LIGHT,
                      fontWeight: isPaired ? 'bold' : 'normal',
                    },
                  ]}
                  numberOfLines={2}
                  adjustsFontSizeToFit
                >
                  {card.word.wordInLOP}
                </Text>
              )}

              {!isHidden && card.mode === 'IMAGE' && imgSrc && (
                <Image
                  source={imgSrc}
                  style={styles.cardImage}
                  resizeMode="contain"
                  accessibilityLabel={card.word.wordInLWC}
                />
              )}

              {!isHidden && card.mode === 'IMAGE' && !imgSrc && (
                <Text
                  style={[styles.cardText, { color: isPaired ? cardThemeColor : themeTextColor }]}
                  numberOfLines={2}
                  adjustsFontSizeToFit
                >
                  {card.word.wordInLWC}
                </Text>
              )}
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
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  card: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  cardImage: {
    width: '80%',
    height: '80%',
  },
  cardText: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.93 }],
  },
});
