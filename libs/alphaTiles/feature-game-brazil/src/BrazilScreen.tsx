/**
 * Pure presenter for the Brazil "find the missing tile" game.
 * No hooks; no react-i18next. All strings + images flow in as props.
 *
 * Layout (Brazil.java brazil_cl1.xml / brazil_cl3.xml condensed into one):
 *   1) Word image at top.
 *   2) Partial word row: parsed tile texts with one slot rendered as placeholder.
 *   3) Choice grid: up to 15 tile buttons; CL1/2/4/5/7/SL = 4 visible, CL3/6 = up to 15.
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

const TILE_BG = '#A9A9A9';
const CORRECT_BG = '#4CAF50';
const WRONG_BG = '#E57373';
const REVEALED_GRAY = '#A9A9A9';
const WORD_TILE_BG = '#FFFFFF';
const WHITE = '#FFFFFF';
const BLACK = '#000000';

export type DisplayTile = { text: string; isBlank: boolean };

export type ChoiceDisplay = {
  text: string;
  visible: boolean;
  /** Per-slot tile color (cycles through colorList in Java). */
  color: string;
  /** True when correct has been revealed; non-correct slots greyed out. */
  greyed: boolean;
  /** True for the slot the player chose incorrectly — flashes red. */
  wrong: boolean;
  /** True for the correct choice once revealed. */
  highlightCorrect: boolean;
  disabled: boolean;
};

export type BrazilScreenProps = {
  displayTiles: DisplayTile[];
  /** Full revealed word; rendered when `revealed === true`. */
  fullWord: string;
  revealed: boolean;
  choices: ChoiceDisplay[];
  visibleChoiceCount: number;
  wordImage: ImageSourcePropType | undefined;
  wordLabel: string;
  onChoice: (index: number) => void;
  onWordImagePress: () => void;
  /** Accessibility-only: per-choice label (uses choice.text for screen readers). */
  accessibilityChoiceLabels: string[];
};

function ChoiceTile({
  choice,
  size,
  onPress,
  label,
}: {
  choice: ChoiceDisplay;
  size: number;
  onPress: () => void;
  label: string;
}): React.JSX.Element {
  if (!choice.visible) {
    return <View style={[styles.choiceCell, styles.choiceHidden, { width: size, height: size }]} />;
  }
  const bg = choice.highlightCorrect
    ? CORRECT_BG
    : choice.wrong
    ? WRONG_BG
    : choice.greyed
    ? REVEALED_GRAY
    : choice.color;
  const textColor = choice.greyed && !choice.highlightCorrect && !choice.wrong ? BLACK : WHITE;
  return (
    <Pressable
      onPress={choice.disabled ? undefined : onPress}
      style={({ pressed }) => [
        styles.choiceCell,
        { width: size, height: size, backgroundColor: bg },
        pressed && !choice.disabled && styles.pressed,
      ]}
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ disabled: choice.disabled }}
    >
      <Text
        style={[styles.choiceText, { color: textColor }]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {choice.text}
      </Text>
    </Pressable>
  );
}

export function BrazilScreen({
  displayTiles,
  fullWord,
  revealed,
  choices,
  visibleChoiceCount,
  wordImage,
  wordLabel,
  onChoice,
  onWordImagePress,
  accessibilityChoiceLabels,
}: BrazilScreenProps): React.JSX.Element {
  const { width, height } = useWindowDimensions();
  const usingGrid = visibleChoiceCount > 4;
  const tileSize = usingGrid
    ? Math.max(40, Math.min(Math.floor(width / 6), Math.floor(height * 0.12)))
    : Math.max(60, Math.min(Math.floor(width / 5), Math.floor(height * 0.18)));

  const wordSize = Math.max(80, Math.min(Math.floor(width * 0.45), Math.floor(height * 0.3)));

  return (
    <View style={styles.root}>
      <Pressable
        onPress={onWordImagePress}
        accessibilityLabel={wordLabel}
        accessibilityRole="imagebutton"
        style={[styles.wordImageBox, { width: wordSize, height: wordSize }]}
      >
        {wordImage ? (
          <Image source={wordImage} style={styles.wordImage} resizeMode="contain" />
        ) : (
          <Text style={styles.wordImageFallback}>{wordLabel}</Text>
        )}
      </Pressable>

      <View style={styles.constructedWordRow}>
        {revealed ? (
          <Text style={styles.constructedWordText}>{fullWord}</Text>
        ) : (
          displayTiles.map((t, i) => (
            <View
              key={i}
              style={[
                styles.constructedTile,
                t.isBlank && styles.constructedTileBlank,
              ]}
            >
              <Text
                style={[styles.constructedTileText, t.isBlank && styles.constructedTileBlankText]}
              >
                {t.text}
              </Text>
            </View>
          ))
        )}
      </View>

      <View style={styles.choicesContainer}>
        {choices.slice(0, Math.max(visibleChoiceCount, 4)).map((c, i) => (
          <ChoiceTile
            key={i}
            choice={c}
            size={tileSize}
            onPress={() => onChoice(i)}
            label={accessibilityChoiceLabels[i] ?? c.text}
          />
        ))}
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
    padding: 12,
  },
  wordImageBox: {
    backgroundColor: WORD_TILE_BG,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  wordImage: { width: '90%', height: '90%' },
  wordImageFallback: { fontSize: 16, color: BLACK, textAlign: 'center', paddingHorizontal: 6 },
  constructedWordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    minHeight: 48,
  },
  constructedTile: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: WORD_TILE_BG,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#CCC',
  },
  constructedTileBlank: {
    backgroundColor: '#FFFDE7',
    borderColor: '#FBC02D',
  },
  constructedTileText: { fontSize: 28, color: BLACK, fontWeight: '600' },
  constructedTileBlankText: { color: '#F57F17' },
  constructedWordText: { fontSize: 36, color: BLACK, fontWeight: 'bold' },
  choicesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    maxWidth: '100%',
  },
  choiceCell: {
    backgroundColor: TILE_BG,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  choiceHidden: { opacity: 0 },
  choiceText: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', color: WHITE },
  pressed: { opacity: 0.7, transform: [{ scale: 0.95 }] },
});
