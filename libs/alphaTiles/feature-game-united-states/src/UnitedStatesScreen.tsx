/**
 * Pure presenter for the United States pairing/spelling game.
 * Zero hook imports, zero i18n imports — all data arrives as props.
 *
 * Layout (portrait):
 *   - Word image at top (tappable to play audio)
 *   - Grid: 2 rows × N columns (N = pairs.length, max = maxPairs)
 *     Row 0 = top tiles, Row 1 = bottom tiles
 *   - Constructed word display at bottom
 *
 * Port of UnitedStates.java:132–175 (layout) and 319–346 (onBtnClick).
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
import type { TilePair } from './setupRound';

const UNSELECTED_BG = '#A9A9A9';
const IMAGE_BG = '#555555';
const GAP = 4;

/** Minimum contrast color for text over a hex background. */
function contrastColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return 0.299 * r + 0.587 * g + 0.114 * b > 127.5 ? '#000000' : '#FFFFFF';
}

export type UnitedStatesScreenProps = {
  /** The tile pairs for this round (length = word tile count). */
  pairs: TilePair[];
  /** Per-pair selection: 0 = top, 1 = bottom, null = unselected. */
  selections: (0 | 1 | null)[];
  /** The word as reconstructed so far (underscore for unselected positions). */
  constructedWord: string;
  /** Theme hex colors cycling per pair (first 5 from aa_colors.txt). */
  themeColors: string[];
  /** Word image source (undefined if not available). */
  wordImageSrc: ImageSourcePropType | undefined;
  /** Accessibility label for the word image. */
  wordLabel: string;
  interactionLocked: boolean;
  onTilePress: (pairIndex: number, tileIndex: 0 | 1) => void;
  onImagePress: () => void;
};

export function UnitedStatesScreen({
  pairs,
  selections,
  constructedWord,
  themeColors,
  wordImageSrc,
  wordLabel,
  interactionLocked,
  onTilePress,
  onImagePress,
}: UnitedStatesScreenProps): React.JSX.Element {
  const { width, height } = useWindowDimensions();

  // Compute tile size so grid fits the screen
  // Image row takes ~20% height, constructed word ~10%, chrome ~20%
  const usableHeight = height * 0.5;
  const cols = Math.max(1, pairs.length);
  const tileByWidth = Math.floor((width - GAP * (cols + 1)) / cols);
  const tileByHeight = Math.floor((usableHeight - GAP * 3) / 2); // 2 rows
  const tileSize = Math.max(36, Math.min(tileByWidth, tileByHeight, 80));

  const imageDim = Math.min(width * 0.35, height * 0.22, 120);

  return (
    <View style={styles.root}>
      {/* Word image */}
      <Pressable
        onPress={interactionLocked ? undefined : onImagePress}
        style={[styles.imageContainer, { width: imageDim, height: imageDim }]}
        accessibilityLabel={wordLabel}
        accessibilityRole="button"
      >
        {wordImageSrc ? (
          <Image
            source={wordImageSrc}
            style={styles.image}
            resizeMode="contain"
            accessibilityElementsHidden
            importantForAccessibility="no"
          />
        ) : (
          <Text style={styles.imageLabel} numberOfLines={2} adjustsFontSizeToFit>
            {wordLabel}
          </Text>
        )}
      </Pressable>

      {/* Tile grid: 2 rows (top, bottom) × N columns */}
      <View style={[styles.grid, { gap: GAP, marginTop: GAP * 2 }]}>
        {/* Row 0: top tiles */}
        <View style={[styles.row, { gap: GAP }]}>
          {pairs.map((pair, pairIdx) => {
            const isSelected = selections[pairIdx] === 0;
            const themeColor = themeColors[pairIdx % Math.max(1, themeColors.length)] ?? '#1565C0';
            const bg = isSelected ? themeColor : UNSELECTED_BG;
            const textColor = isSelected ? contrastColor(themeColor) : '#FFFFFF';
            return (
              <Pressable
                key={pairIdx}
                onPress={interactionLocked ? undefined : () => onTilePress(pairIdx, 0)}
                style={({ pressed }) => [
                  styles.tile,
                  { width: tileSize, height: tileSize, backgroundColor: bg },
                  pressed && !interactionLocked && styles.pressed,
                ]}
                accessibilityLabel={pair.top || 'tile'}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected, disabled: interactionLocked }}
              >
                <Text style={[styles.tileText, { color: textColor }]} numberOfLines={1} adjustsFontSizeToFit>
                  {pair.top}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Row 1: bottom tiles */}
        <View style={[styles.row, { gap: GAP }]}>
          {pairs.map((pair, pairIdx) => {
            const isSelected = selections[pairIdx] === 1;
            const themeColor = themeColors[pairIdx % Math.max(1, themeColors.length)] ?? '#1565C0';
            const bg = isSelected ? themeColor : UNSELECTED_BG;
            const textColor = isSelected ? contrastColor(themeColor) : '#FFFFFF';
            return (
              <Pressable
                key={pairIdx}
                onPress={interactionLocked ? undefined : () => onTilePress(pairIdx, 1)}
                style={({ pressed }) => [
                  styles.tile,
                  { width: tileSize, height: tileSize, backgroundColor: bg },
                  pressed && !interactionLocked && styles.pressed,
                ]}
                accessibilityLabel={pair.bottom || 'tile'}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected, disabled: interactionLocked }}
              >
                <Text style={[styles.tileText, { color: textColor }]} numberOfLines={1} adjustsFontSizeToFit>
                  {pair.bottom}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Constructed word display */}
      <View style={styles.wordDisplay}>
        <Text style={styles.wordText} numberOfLines={1} adjustsFontSizeToFit>
          {constructedWord}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  imageContainer: {
    borderRadius: 8,
    backgroundColor: IMAGE_BG,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    width: '80%',
    height: '80%',
  },
  imageLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  grid: {
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
  },
  tile: {
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileText: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.93 }],
  },
  wordDisplay: {
    marginTop: 16,
    paddingHorizontal: 12,
    minWidth: 120,
    alignItems: 'center',
  },
  wordText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333333',
    letterSpacing: 4,
    textAlign: 'center',
  },
});
