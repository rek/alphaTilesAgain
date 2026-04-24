/**
 * Pure presenter for the China sliding-tile game.
 * Zero hook imports, zero i18n imports — all data arrives as props.
 *
 * Layout: image strip on the left, 4x4 tile grid on the right.
 * Cell size is computed from window dimensions so the grid always fits.
 */
import React from 'react';
import { Image, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import type { ImageSourcePropType } from 'react-native';

const SOLVED_COLOR = '#4CAF50';
const UNSOLVED_COLOR = '#1565C0';
const BLANK_COLOR = '#E0E0E0';
const IMAGE_BG = '#555555';

type CellColor = 'solved' | 'unsolved' | 'blank';

export type ChinaScreenProps = {
  board: string[];
  blankIndex: number;
  rowColors: CellColor[][];
  wordImages: Array<{ src: ImageSourcePropType | undefined; label: string }>;
  interactionLocked: boolean;
  onTilePress: (index: number) => void;
  onImagePress: (index: number) => void;
};

function cellBgColor(color: CellColor): string {
  if (color === 'solved') return SOLVED_COLOR;
  if (color === 'blank') return BLANK_COLOR;
  return UNSOLVED_COLOR;
}

export function ChinaScreen({
  board,
  blankIndex,
  rowColors,
  wordImages,
  interactionLocked,
  onTilePress,
  onImagePress,
}: ChinaScreenProps): React.JSX.Element {
  const { width, height } = useWindowDimensions();

  // 5 columns total: 1 image column + 4 tile columns; 4 rows; leave room for chrome
  const byWidth = Math.floor(width / 5);
  const byHeight = Math.floor((height * 0.72) / 4);
  const cellSize = Math.max(40, Math.min(byWidth, byHeight));
  const gap = 3;

  return (
    <View style={styles.root}>
      {/* Left strip: one word image per row */}
      <View style={{ flexDirection: 'column', gap }}>
        {wordImages.map((img, i) => (
          <Pressable
            key={i}
            onPress={interactionLocked ? undefined : () => onImagePress(i)}
            style={[styles.imageCell, { width: cellSize, height: cellSize, backgroundColor: IMAGE_BG }]}
            accessibilityLabel={img.label}
            accessibilityRole="button"
          >
            {img.src ? (
              <Image
                source={img.src}
                style={styles.cellImage}
                resizeMode="contain"
                accessibilityElementsHidden
                importantForAccessibility="no"
              />
            ) : (
              <Text style={styles.imageLabel} numberOfLines={1} adjustsFontSizeToFit>
                {img.label}
              </Text>
            )}
          </Pressable>
        ))}
      </View>

      {/* 4×4 tile grid */}
      <View style={{ marginStart: gap }}>
        {[0, 1, 2, 3].map((row) => (
          <View key={row} style={{ flexDirection: 'row', gap, marginBottom: row < 3 ? gap : 0 }}>
            {[0, 1, 2, 3].map((col) => {
              const idx = row * 4 + col;
              const isBlank = idx === blankIndex;
              const colorKey = rowColors[row]?.[col] ?? 'unsolved';
              const bg = cellBgColor(colorKey);
              const text = board[idx] ?? '';
              return (
                <Pressable
                  key={idx}
                  onPress={interactionLocked ? undefined : () => onTilePress(idx)}
                  style={({ pressed }) => [
                    styles.tileCell,
                    { width: cellSize, height: cellSize, backgroundColor: bg },
                    pressed && !isBlank && styles.pressed,
                  ]}
                  accessibilityLabel={isBlank ? 'empty' : text}
                  accessibilityRole={isBlank ? 'none' : 'button'}
                >
                  {!isBlank && (
                    <Text style={styles.tileLabel} numberOfLines={1} adjustsFontSizeToFit>
                      {text}
                    </Text>
                  )}
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  imageCell: {
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  cellImage: {
    width: '80%',
    height: '80%',
  },
  imageLabel: {
    color: '#fff',
    fontSize: 11,
    textAlign: 'center',
    paddingHorizontal: 2,
  },
  tileCell: {
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileLabel: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.93 }],
  },
});
