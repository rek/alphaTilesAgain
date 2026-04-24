/**
 * Pure presenter for the China sliding-tile game.
 * Zero hook imports, zero i18n imports — all data arrives as props.
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import type { ImageSourcePropType } from 'react-native';
import { Tile } from '@shared/ui-tile';
import { GameBoard } from '@shared/ui-game-board';

const SOLVED_COLOR = '#4CAF50';
const UNSOLVED_COLOR = '#000000';
const BLANK_COLOR = '#FFFFFF';

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
  return (
    <View style={styles.root}>
      <View style={styles.imageStrip}>
        {wordImages.map((img, i) => (
          <Tile
            key={i}
            imageSource={img.src}
            color="#555555"
            accessibilityLabel={img.label}
            onPress={interactionLocked ? undefined : () => onImagePress(i)}
          />
        ))}
      </View>
      <GameBoard columns={4} rows={4} accessibilityLabel="China sliding tile board">
        {board.map((text, i) => {
          const row = Math.floor(i / 4);
          const col = i % 4;
          const colorKey = rowColors[row]?.[col] ?? 'unsolved';
          const bg = cellBgColor(colorKey);
          const isBlank = i === blankIndex;
          return (
            <Tile
              key={i}
              text={isBlank ? '' : text}
              color={bg}
              fontColor="#FFFFFF"
              accessibilityLabel={isBlank ? 'blank' : text}
              onPress={interactionLocked ? undefined : () => onTilePress(i)}
            />
          );
        })}
      </GameBoard>
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
  imageStrip: {
    flexDirection: 'column',
    marginEnd: 8,
  },
});
