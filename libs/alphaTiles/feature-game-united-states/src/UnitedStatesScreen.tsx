/**
 * Pure presenter for the United States pairing/spelling game.
 * Zero hook imports, zero i18n imports — all data arrives as props.
 *
 * Layout (portrait):
 *   - Word image at top (tappable to play audio)
 *   - Grid: 2 rows × `slotCount` columns. The first `pairs.length` columns are
 *     filled tiles; trailing columns render invisible placeholders so the grid
 *     keeps a fixed footprint per challenge level (Java pre-renders 10/14/18
 *     buttons and hides extras via View.INVISIBLE — UnitedStates.java:143-194).
 *     Row 0 = top tiles, Row 1 = bottom tiles.
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
  /**
   * Total grid columns rendered (5 / 7 / 9 for cl1 / cl2 / cl3). Indices
   * `[pairs.length, slotCount)` render invisible placeholder tiles to mirror
   * Java's pre-render+View.INVISIBLE pattern (UnitedStates.java:186-191).
   * Defaults to `pairs.length` so legacy callers stay flush.
   */
  slotCount?: number;
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
  /** True after a correct win — display turns dark green + bold (Java 286-287). */
  isWin?: boolean;
  onTilePress: (pairIndex: number, tileIndex: 0 | 1) => void;
  onImagePress: () => void;
};

export function UnitedStatesScreen({
  pairs,
  slotCount,
  selections,
  constructedWord,
  themeColors,
  wordImageSrc,
  wordLabel,
  interactionLocked,
  isWin = false,
  onTilePress,
  onImagePress,
}: UnitedStatesScreenProps): React.JSX.Element {
  const { width, height } = useWindowDimensions();

  // Total slots includes invisible placeholders so grid keeps a fixed footprint
  // per challenge level (Java pre-renders 10/14/18 buttons — UnitedStates.java:130-194).
  const totalSlots = Math.max(slotCount ?? pairs.length, pairs.length, 1);
  const slots: (TilePair | null)[] = Array.from({ length: totalSlots }, (_, i) =>
    i < pairs.length ? pairs[i] : null,
  );

  // Compute tile size so grid fits the screen using the *fixed* slot count so
  // tiles don't resize when shorter words are picked.
  // Image row takes ~20% height, constructed word ~10%, chrome ~20%.
  const usableHeight = height * 0.5;
  const tileByWidth = Math.floor((width - GAP * (totalSlots + 1)) / totalSlots);
  const tileByHeight = Math.floor((usableHeight - GAP * 3) / 2); // 2 rows
  const tileSize = Math.max(36, Math.min(tileByWidth, tileByHeight, 80));

  const imageDim = Math.min(width * 0.35, height * 0.22, 120);

  function renderRow(row: 0 | 1) {
    return (
      <View style={[styles.row, { gap: GAP }]}>
        {slots.map((pair, pairIdx) => {
          // Hidden placeholder slot (Java View.INVISIBLE — keeps layout, not interactive).
          if (pair === null) {
            return (
              <View
                key={pairIdx}
                style={[styles.tile, styles.hiddenTile, { width: tileSize, height: tileSize }]}
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
              />
            );
          }
          const isSelected = selections[pairIdx] === row;
          const themeColor = themeColors[pairIdx % Math.max(1, themeColors.length)] ?? '#1565C0';
          const bg = isSelected ? themeColor : UNSELECTED_BG;
          // Selected: white text on theme color; unselected: black text on dark gray (Java 326-329)
          const textColor = isSelected ? contrastColor(themeColor) : '#000000';
          const text = row === 0 ? pair.top : pair.bottom;
          return (
            <Pressable
              key={pairIdx}
              onPress={interactionLocked ? undefined : () => onTilePress(pairIdx, row)}
              style={({ pressed }) => [
                styles.tile,
                { width: tileSize, height: tileSize, backgroundColor: bg },
                pressed && !interactionLocked && styles.pressed,
              ]}
              accessibilityLabel={text || 'tile'}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected, disabled: interactionLocked }}
            >
              <Text style={[styles.tileText, { color: textColor }]} numberOfLines={1} adjustsFontSizeToFit>
                {text}
              </Text>
            </Pressable>
          );
        })}
      </View>
    );
  }

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

      {/* Tile grid: 2 rows (top, bottom) × totalSlots columns */}
      <View style={[styles.grid, { gap: GAP, marginTop: GAP * 2 }]}>
        {renderRow(0)}
        {renderRow(1)}
      </View>

      {/* Constructed word display — dark green + bold on win (Java 286-287) */}
      <View style={styles.wordDisplay}>
        <Text
          style={[styles.wordText, isWin && styles.wordTextWin]}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
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
  /** Java View.INVISIBLE — occupies layout, not painted, not interactive. */
  hiddenTile: {
    opacity: 0,
    backgroundColor: 'transparent',
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
  wordTextWin: {
    color: '#006400',
  },
});
