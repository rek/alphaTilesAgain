/**
 * Pure presenter for the Myanmar 7×7 word-search game.
 * Left: 7×7 tile grid. Right: 7-slot image bank. Below: active-word text.
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

export type MyanmarCell = {
  text: string;
  // Hex color for found-word highlighting; null = default cell color.
  color: string | null;
  // True while this cell is part of the in-flight selection (Method 1 first tap or Method 2 stack).
  selected: boolean;
};

export type MyanmarImageSlot = {
  // Falsy when the slot has been cleared (word found + audio finished).
  source: ImageSourcePropType | undefined;
  label: string;
  done: boolean;
};

export type MyanmarScreenProps = {
  // 49 cells in row-major order.
  grid: MyanmarCell[];
  imageBank: MyanmarImageSlot[];
  activeWord: string;
  interactionLocked: boolean;
  onCellPress: (index: number) => void;
  onImagePress: (slot: number) => void;
};

const ROWS = 7;
const COLS = 7;
const DEFAULT_CELL_BG = '#F4ECD8';
const SELECTED_CELL_BG = '#FFD54F';
const CELL_TEXT = '#222222';

export function MyanmarScreen({
  grid,
  imageBank,
  activeWord,
  interactionLocked,
  onCellPress,
  onImagePress,
}: MyanmarScreenProps): React.JSX.Element {
  const { width, height } = useWindowDimensions();
  const gridSide = Math.min(Math.floor(width * 0.65), Math.floor(height * 0.7));
  const cellSide = Math.floor(gridSide / COLS);
  const tileFontSize = Math.max(14, Math.floor(cellSide * 0.45));
  const slotSide = Math.max(40, Math.floor(cellSide * 0.85));

  return (
    <View style={styles.root}>
      <View style={styles.body}>
        <View
          style={[styles.grid, { width: cellSide * COLS, height: cellSide * ROWS }]}
        >
          {grid.map((cell, i) => {
            const bg = cell.color ?? (cell.selected ? SELECTED_CELL_BG : DEFAULT_CELL_BG);
            return (
              <Pressable
                key={i}
                onPress={interactionLocked ? undefined : () => onCellPress(i)}
                style={({ pressed }) => [
                  styles.cell,
                  {
                    width: cellSide,
                    height: cellSide,
                    backgroundColor: bg,
                  },
                  pressed && styles.pressed,
                ]}
                accessibilityLabel={cell.text}
                accessibilityRole="button"
              >
                <Text
                  style={[styles.cellText, { fontSize: tileFontSize }]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {cell.text}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.bank}>
          {imageBank.map((slot, i) => (
            <Pressable
              key={i}
              onPress={
                interactionLocked || slot.done ? undefined : () => onImagePress(i)
              }
              style={[
                styles.bankSlot,
                { width: slotSide, height: slotSide },
                slot.done && styles.bankSlotDone,
              ]}
              accessibilityLabel={slot.label}
              accessibilityRole="button"
              accessibilityState={{ disabled: slot.done || interactionLocked }}
            >
              {slot.source && !slot.done ? (
                <Image
                  source={slot.source}
                  style={styles.bankImage}
                  resizeMode="contain"
                  accessibilityElementsHidden
                  importantForAccessibility="no"
                />
              ) : (
                <Text style={styles.bankFallback} numberOfLines={1} adjustsFontSizeToFit>
                  {slot.done ? '' : slot.label}
                </Text>
              )}
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.activeWordRow}>
        <Text style={styles.activeWord} numberOfLines={1} adjustsFontSizeToFit>
          {activeWord}
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
    paddingVertical: 16,
    gap: 16,
  },
  body: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#000',
  },
  cell: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#000',
  },
  cellText: {
    color: CELL_TEXT,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.85,
  },
  bank: {
    flexDirection: 'column',
    gap: 6,
  },
  bankSlot: {
    backgroundColor: '#EEE',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  bankSlotDone: {
    backgroundColor: 'transparent',
  },
  bankImage: {
    width: '90%',
    height: '90%',
  },
  bankFallback: {
    fontSize: 12,
    color: '#444',
    paddingHorizontal: 4,
    textAlign: 'center',
  },
  activeWordRow: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeWord: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#222',
  },
});
