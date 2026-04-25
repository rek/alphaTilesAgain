/**
 * Pure presenter for the Italy Lotería game.
 * Zero hooks, zero i18n imports — all data arrives as props.
 *
 * Layout:
 *   - Caller area at top: current call text + image; tap to replay audio.
 *   - 4×4 board of tiles below; bean overlay when covered, lotería bean when winning.
 *
 * Bean / lotería bean visuals are rendered as styled circles (not pack assets) so
 * the screen has zero asset dependencies; an app may swap to image assets via the
 * `beanImage` / `loteriaImage` props.
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

export type ItalyBoardCell = {
  /** Text to render on the cell (wordInLOP for T variant, syllable for S). */
  text: string;
  /** Image source for the cell (variant-2 word image for T; syllable image for S). May be undefined. */
  image?: ImageSourcePropType;
  /** True once the player has tapped the matching cell. */
  covered: boolean;
  /** True once the cell is part of the winning sequence. */
  loteria: boolean;
  /** Color hex for the cell text (Italy.java:224 — colorList[i % 5]). */
  textColor: string;
};

export type ItalyScreenProps = {
  board: readonly ItalyBoardCell[];
  /** Current called text shown in the caller area. */
  currentCallText: string;
  /** Current called image (variant-2 word image or undefined for syllables). */
  currentCallImage?: ImageSourcePropType;
  /** Optional bean image override (defaults to a styled circle). */
  beanImage?: ImageSourcePropType;
  /** Optional lotería bean image override (defaults to a styled circle with star). */
  loteriaImage?: ImageSourcePropType;
  /** True once a player has won this round (suppresses further taps). */
  won: boolean;
  /** True while the shell holds an interaction lock. */
  disabled: boolean;
  /** Pre-translated label for the caller area (a11y). */
  callerLabel: string;
  onTilePress: (boardIndex: number) => void;
  onCallerPress: () => void;
};

export function ItalyScreen({
  board,
  currentCallText,
  currentCallImage,
  beanImage,
  loteriaImage,
  won,
  disabled,
  callerLabel,
  onTilePress,
  onCallerPress,
}: ItalyScreenProps): React.JSX.Element {
  const { width, height } = useWindowDimensions();

  const cols = 4;
  const availableWidth = width - GAP * (cols + 1) - PADDING * 2;
  const cellByWidth = Math.floor(availableWidth / cols);
  const availableHeight = height * 0.6 - GAP * (cols + 1);
  const cellByHeight = Math.floor(availableHeight / cols);
  const cellSize = Math.max(60, Math.min(cellByWidth, cellByHeight));

  return (
    <View style={styles.root}>
      <Pressable
        onPress={disabled ? undefined : onCallerPress}
        accessibilityRole="button"
        accessibilityLabel={`${callerLabel}: ${currentCallText}`}
        style={({ pressed }) => [
          styles.caller,
          pressed && !disabled && styles.callerPressed,
        ]}
      >
        {currentCallImage ? (
          <Image
            source={currentCallImage}
            style={styles.callerImage}
            resizeMode="contain"
            accessibilityElementsHidden
            importantForAccessibility="no"
          />
        ) : null}
        <Text style={styles.callerText} numberOfLines={1} adjustsFontSizeToFit>
          {currentCallText}
        </Text>
      </Pressable>

      <View style={[styles.grid, { gap: GAP }]}>
        {board.map((cell, index) => {
          const showBean = cell.covered && !cell.loteria;
          const showLoteria = cell.loteria;

          return (
            <Pressable
              key={index}
              onPress={
                disabled || cell.covered || won
                  ? undefined
                  : () => onTilePress(index)
              }
              style={({ pressed }) => [
                styles.cell,
                {
                  width: cellSize,
                  height: cellSize,
                },
                pressed && !disabled && !cell.covered && styles.cellPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={cell.text}
              accessibilityState={{ disabled: cell.covered || disabled }}
            >
              <View style={styles.cellContent}>
                {cell.image ? (
                  <Image
                    source={cell.image}
                    style={styles.cellImage}
                    resizeMode="contain"
                  />
                ) : null}
                <Text
                  style={[
                    styles.cellText,
                    { color: cell.covered ? COVERED_TEXT : cell.textColor },
                  ]}
                  numberOfLines={2}
                  adjustsFontSizeToFit
                >
                  {cell.text}
                </Text>
              </View>

              {(showBean || showLoteria) ? (
                <View
                  style={styles.beanOverlay}
                  pointerEvents="none"
                  accessibilityElementsHidden
                  importantForAccessibility="no"
                >
                  {showLoteria && loteriaImage ? (
                    <Image source={loteriaImage} style={styles.beanImage} resizeMode="contain" />
                  ) : showBean && beanImage ? (
                    <Image source={beanImage} style={styles.beanImage} resizeMode="contain" />
                  ) : (
                    <View
                      style={[
                        styles.beanCircle,
                        showLoteria ? styles.beanCircleLoteria : styles.beanCircleNormal,
                      ]}
                    >
                      {showLoteria ? <Text style={styles.beanStar}>★</Text> : null}
                    </View>
                  )}
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const GAP = 4;
const PADDING = 8;
const COVERED_TEXT = '#000000';

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: PADDING,
    paddingTop: 12,
  },
  caller: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    minHeight: 64,
    minWidth: 200,
  },
  callerPressed: {
    opacity: 0.7,
  },
  callerImage: {
    width: 48,
    height: 48,
  },
  callerText: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    justifyContent: 'center',
    maxWidth: '100%',
  },
  cell: {
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    borderColor: '#DDDDDD',
    borderWidth: 1,
    overflow: 'hidden',
  },
  cellPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.96 }],
  },
  cellContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 4,
  },
  cellImage: {
    flex: 1,
    width: '100%',
  },
  cellText: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    paddingHorizontal: 2,
  },
  beanOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    start: 0,
    end: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
  },
  beanImage: {
    width: '70%',
    height: '70%',
  },
  beanCircle: {
    width: '60%',
    aspectRatio: 1,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  beanCircleNormal: {
    backgroundColor: '#C99A4F',
    borderColor: '#5C3D17',
    borderWidth: 2,
  },
  beanCircleLoteria: {
    backgroundColor: '#F2C200',
    borderColor: '#A37B00',
    borderWidth: 3,
  },
  beanStar: {
    color: '#5C3D17',
    fontSize: 28,
    fontWeight: 'bold',
  },
});
