import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export type RomaniaScreenProps = {
  /** Display text for the focus tile (the tile being practiced). */
  focusTileText: string;
  /** Current word split into tile bases for rendering. */
  wordTiles: string[];
  /** Full word label for accessibility. */
  wordLabel: string;
  /** Whether to bold tiles that match the focus tile. */
  boldFocusTile: boolean;
  /** The tile base to match for bolding. */
  focusTileBase: string;
  /** Pre-translated label for the next button. */
  nextLabel: string;
  onNext: () => void;
};

export function RomaniaScreen({
  focusTileText,
  wordTiles,
  wordLabel,
  boldFocusTile,
  focusTileBase,
  nextLabel,
  onNext,
}: RomaniaScreenProps): React.JSX.Element {
  return (
    <View style={styles.root}>
      <View style={styles.focusTileContainer}>
        <Text style={styles.focusTileLabel} accessibilityRole="text">
          {focusTileText}
        </Text>
      </View>

      <Pressable
        style={styles.wordContainer}
        onPress={onNext}
        accessibilityLabel={wordLabel}
        accessibilityRole="button"
      >
        <View style={styles.wordTilesRow}>
          {wordTiles.map((tile, i) => {
            const isFocus = tile === focusTileBase;
            return (
              <Text
                key={i}
                style={[styles.wordTile, boldFocusTile && isFocus && styles.boldTile]}
              >
                {tile}
              </Text>
            );
          })}
        </View>
      </Pressable>

      <Pressable
        style={styles.nextButton}
        onPress={onNext}
        accessibilityLabel={nextLabel}
        accessibilityRole="button"
      >
        <Text style={styles.nextButtonText}>{nextLabel}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 32,
    paddingHorizontal: 24,
  },
  focusTileContainer: {
    backgroundColor: '#1565C0',
    borderRadius: 12,
    paddingHorizontal: 32,
    paddingVertical: 20,
    minWidth: 80,
    alignItems: 'center',
  },
  focusTileLabel: {
    color: '#fff',
    fontSize: 48,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  wordContainer: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  wordTilesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 2,
  },
  wordTile: {
    fontSize: 36,
    color: '#212121',
  },
  boldTile: {
    fontWeight: 'bold',
    color: '#1565C0',
  },
  nextButton: {
    backgroundColor: '#1565C0',
    borderRadius: 8,
    paddingHorizontal: 32,
    paddingVertical: 14,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
