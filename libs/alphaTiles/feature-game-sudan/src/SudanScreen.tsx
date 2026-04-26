/**
 * Pure presenter for the Sudan tile/syllable audio browser.
 *
 * No hooks beyond `useWindowDimensions`; no `react-i18next` import.
 * Discriminated-union props: `variant: 'T'` for tiles, `variant: 'S'` for syllables.
 * Pagination chrome (prev/next arrows) is owned here; visibility is driven by props.
 */

import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

const GAP = 4;
const TEXT_LIGHT = '#FFFFFF';
const TEXT_DARK = '#000000';
const ARROW_BG = '#1565C0';
const MUTED_BG = '#9E9E9E';

/** Choose readable text color over a background hex. */
function contrastColor(hex: string): string {
  if (!hex || hex.length < 7) return TEXT_DARK;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  if ([r, g, b].some(Number.isNaN)) return TEXT_DARK;
  return 0.299 * r + 0.587 * g + 0.114 * b > 127.5 ? TEXT_DARK : TEXT_LIGHT;
}

export type SudanCell = {
  /** Display text — tile.base or syllable.syllable. */
  text: string;
  /** Background color hex (already resolved by container). */
  color: string;
  /** When false, cell is rendered muted and is not a tap target (syllable variant only). */
  tappable: boolean;
};

type CommonProps = {
  page: number;
  pageCount: number;
  disabled: boolean;
  onPrev: () => void;
  onNext: () => void;
};

export type SudanScreenProps =
  | (CommonProps & {
      variant: 'T';
      tiles: readonly SudanCell[];
      onTile: (index: number) => void;
    })
  | (CommonProps & {
      variant: 'S';
      syllables: readonly SudanCell[];
      onSyllable: (index: number) => void;
    });

export function SudanScreen(props: SudanScreenProps): React.JSX.Element {
  const { width, height } = useWindowDimensions();

  const cells: readonly SudanCell[] =
    props.variant === 'T' ? props.tiles : props.syllables;
  const onCellPress =
    props.variant === 'T' ? props.onTile : props.onSyllable;

  // Layout: tile variant 9 cols × 7 rows = 63; syllable 7 cols × 5 rows = 35.
  const cols = props.variant === 'T' ? 9 : 7;
  const rows = props.variant === 'T' ? 7 : 5;

  // Reserve ~30% of height for shell chrome.
  const availableWidth = width - GAP * (cols + 1);
  const availableHeight = height * 0.7 - GAP * (rows + 1);
  const cellByWidth = Math.floor(availableWidth / cols);
  const cellByHeight = Math.floor(availableHeight / rows);
  const cellSize = Math.max(28, Math.min(cellByWidth, cellByHeight));

  const showPrev = props.page > 0;
  const showNext = props.page < props.pageCount - 1;

  return (
    <View style={styles.root}>
      <View
        style={[
          styles.grid,
          { gap: GAP, maxWidth: (cellSize + GAP) * cols },
        ]}
      >
        {cells.map((cell, index) => {
          const bg = cell.tappable ? cell.color : MUTED_BG;
          const textColor = contrastColor(bg);
          const isPressable = !props.disabled && cell.tappable;
          return (
            <Pressable
              key={`${index}-${cell.text}`}
              accessibilityLabel={cell.text}
              accessibilityRole="button"
              accessibilityState={{ disabled: !isPressable }}
              onPress={isPressable ? () => onCellPress(index) : undefined}
              style={({ pressed }) => [
                styles.cell,
                {
                  width: cellSize,
                  height: cellSize,
                  backgroundColor: bg,
                  opacity: cell.tappable ? 1 : 0.55,
                },
                pressed && isPressable && styles.pressed,
              ]}
            >
              <Text
                style={[styles.cellText, { color: textColor }]}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {cell.text}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.arrowRow}>
        {showPrev ? (
          <Pressable
            accessibilityLabel="previous page"
            accessibilityRole="button"
            accessibilityState={{ disabled: props.disabled }}
            onPress={props.disabled ? undefined : props.onPrev}
            style={({ pressed }) => [
              styles.arrow,
              pressed && !props.disabled && styles.pressed,
              props.disabled && styles.arrowDisabled,
            ]}
          >
            <Text style={styles.arrowText}>{'←'}</Text>
          </Pressable>
        ) : (
          <View style={styles.arrowSpacer} />
        )}

        <Text style={styles.pageLabel}>
          {props.page + 1}
          {' / '}
          {props.pageCount}
        </Text>

        {showNext ? (
          <Pressable
            accessibilityLabel="next page"
            accessibilityRole="button"
            accessibilityState={{ disabled: props.disabled }}
            onPress={props.disabled ? undefined : props.onNext}
            style={({ pressed }) => [
              styles.arrow,
              pressed && !props.disabled && styles.pressed,
              props.disabled && styles.arrowDisabled,
            ]}
          >
            <Text style={styles.arrowText}>{'→'}</Text>
          </Pressable>
        ) : (
          <View style={styles.arrowSpacer} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  cell: {
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  cellText: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    paddingHorizontal: 2,
  },
  arrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 24,
    marginTop: 12,
  },
  arrow: {
    minWidth: 56,
    minHeight: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ARROW_BG,
    paddingHorizontal: 12,
  },
  arrowSpacer: {
    minWidth: 56,
    minHeight: 44,
  },
  arrowText: {
    color: TEXT_LIGHT,
    fontSize: 22,
    fontWeight: 'bold',
  },
  arrowDisabled: {
    opacity: 0.5,
  },
  pageLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: TEXT_DARK,
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.95 }],
  },
});
