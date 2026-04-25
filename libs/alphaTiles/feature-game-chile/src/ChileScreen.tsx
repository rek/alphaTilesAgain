/**
 * Pure presenter for the Chile Wordle game.
 * Zero hook imports, zero i18n imports — all data arrives as props.
 *
 * Layout:
 *   - Guess grid: guessCount rows × wordLength columns of colored tile cells.
 *   - Tile keyboard: keyTiles in a grid of keyboardWidth columns.
 *   - Backspace and Submit buttons.
 *
 * Color constants match Java color indices from aa_colors.txt:
 *   GREEN = index 3, BLUE = index 1, GRAY = index 8, EMPTY = index 6, KEY = index 0.
 */
import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import type { ColorTile, TileColor } from './evaluateGuess';

const TILE_BG: Record<TileColor, string> = {
  GREEN: '#4CAF50',  // colorList[3]
  BLUE:  '#2196F3',  // colorList[1]
  GRAY:  '#9E9E9E',  // colorList[8]
  EMPTY: '#E0E0E0',  // colorList[6]
  KEY:   '#607D8B',  // colorList[0]
};

const TILE_TEXT_COLOR = '#FFFFFF';

export type ChileScreenProps = {
  /** Flat array of tiles, guessCount × wordLength. */
  guessTiles: ColorTile[];
  /** Keyboard tiles. */
  keyTiles: ColorTile[];
  /** Number of tiles in the secret word. */
  wordLength: number;
  /** Number of guess rows. */
  guessCount: number;
  /** Keyboard column count. */
  keyboardWidth: number;
  /** Called when a keyboard tile is pressed. */
  onKeyPress: (tile: string) => void;
  /** Called when backspace is pressed. */
  onBackspace: () => void;
  /** Called when the submit button is pressed. */
  onSubmitGuess: () => void;
  /** When true, show a reset/play-again button instead of submit. */
  showReset?: boolean;
  /** Called when reset is pressed. */
  onReset?: () => void;
};

const TILE_GAP = 4;
const MIN_TILE_SIZE = 24;

export function ChileScreen({
  guessTiles,
  keyTiles,
  wordLength,
  guessCount,
  keyboardWidth,
  onKeyPress,
  onBackspace,
  onSubmitGuess,
  showReset = false,
  onReset,
}: ChileScreenProps): React.JSX.Element {
  const { width } = useWindowDimensions();

  // Compute guess tile size to fit wordLength columns
  const guessTileSize = Math.max(
    MIN_TILE_SIZE,
    Math.floor((width - TILE_GAP * (wordLength + 1)) / Math.max(wordLength, 1)),
  );
  // Clamp to reasonable max
  const clampedGuessTileSize = Math.min(guessTileSize, 56);

  // Compute keyboard tile size to fit keyboardWidth columns
  const keyTileSize = Math.max(
    MIN_TILE_SIZE,
    Math.floor((width - TILE_GAP * (keyboardWidth + 1)) / Math.max(keyboardWidth, 1)),
  );
  const clampedKeyTileSize = Math.min(keyTileSize, 52);

  return (
    <View style={styles.root}>
      {/* Guess grid */}
      <View style={styles.guessGrid}>
        {Array.from({ length: guessCount }).map((_, rowIdx) => (
          <View key={rowIdx} style={[styles.guessRow, { gap: TILE_GAP }]}>
            {Array.from({ length: wordLength }).map((_, colIdx) => {
              const tileIdx = rowIdx * wordLength + colIdx;
              const tile = guessTiles[tileIdx];
              const text = tile?.text ?? '';
              const color = tile?.color ?? 'EMPTY';
              return (
                <View
                  key={colIdx}
                  style={[
                    styles.guessTile,
                    {
                      width: clampedGuessTileSize,
                      height: clampedGuessTileSize,
                      backgroundColor: TILE_BG[color],
                    },
                  ]}
                  accessibilityLabel={`row ${rowIdx + 1} col ${colIdx + 1}: ${text || 'empty'}`}
                >
                  <Text style={styles.guessTileText} adjustsFontSizeToFit numberOfLines={1}>
                    {text}
                  </Text>
                </View>
              );
            })}
          </View>
        ))}
      </View>

      {/* Action buttons */}
      <View style={styles.buttonRow}>
        <Pressable
          style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}
          onPress={onBackspace}
          accessibilityLabel="backspace"
          accessibilityRole="button"
        >
          <Text style={styles.actionButtonText}>⌫</Text>
        </Pressable>

        {showReset ? (
          <Pressable
            style={({ pressed }) => [styles.actionButton, styles.resetButton, pressed && styles.pressed]}
            onPress={onReset}
            accessibilityLabel="play again"
            accessibilityRole="button"
          >
            <Text style={styles.actionButtonText}>↺</Text>
          </Pressable>
        ) : (
          <Pressable
            style={({ pressed }) => [styles.actionButton, styles.submitButton, pressed && styles.pressed]}
            onPress={onSubmitGuess}
            accessibilityLabel="submit guess"
            accessibilityRole="button"
          >
            <Text style={styles.actionButtonText}>✓</Text>
          </Pressable>
        )}
      </View>

      {/* Tile keyboard */}
      <View style={styles.keyboard}>
        {keyTiles.map((tile, idx) => (
          <Pressable
            key={idx}
            onPress={() => onKeyPress(tile.text)}
            style={({ pressed }) => [
              styles.keyTile,
              {
                width: clampedKeyTileSize,
                height: clampedKeyTileSize,
                backgroundColor: TILE_BG[tile.color],
              },
              pressed && styles.pressed,
            ]}
            accessibilityLabel={`key ${tile.text}`}
            accessibilityRole="button"
          >
            <Text style={styles.keyTileText} adjustsFontSizeToFit numberOfLines={1}>
              {tile.text}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingVertical: 8,
    gap: 8,
  },
  guessGrid: {
    gap: TILE_GAP,
    alignItems: 'center',
  },
  guessRow: {
    flexDirection: 'row',
  },
  guessTile: {
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  guessTileText: {
    color: TILE_TEXT_COLOR,
    fontWeight: 'bold',
    fontSize: 18,
    paddingHorizontal: 2,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButton: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#455A64',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButton: {
    backgroundColor: '#388E3C',
  },
  resetButton: {
    backgroundColor: '#1565C0',
  },
  actionButtonText: {
    color: TILE_TEXT_COLOR,
    fontSize: 22,
    fontWeight: 'bold',
  },
  keyboard: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: TILE_GAP,
    paddingHorizontal: TILE_GAP,
  },
  keyTile: {
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  keyTileText: {
    color: TILE_TEXT_COLOR,
    fontWeight: 'bold',
    fontSize: 14,
    paddingHorizontal: 2,
  },
  pressed: {
    opacity: 0.7,
    transform: [{ scale: 0.93 }],
  },
});
