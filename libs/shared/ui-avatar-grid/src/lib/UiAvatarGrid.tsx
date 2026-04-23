/**
 * Pure presentational component — grid of tappable avatar images.
 * No i18n dependency. Accept pre-translated a11y labels as props.
 * See design.md §D3, §D9.
 */
import React from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';

export type UiAvatarGridProps = {
  /** Metro require-id array (up to 12 entries). */
  avatars: number[];
  /** 0-based index of the currently-selected avatar. */
  selectedIndex?: number;
  /** 0-based indices that should be rendered at reduced opacity (already taken). */
  dimmedIndices?: number[];
  /** Fires when the learner taps an avatar. */
  onPick: (index: number) => void;
  /** Provides the accessibilityLabel string for each avatar by index. */
  a11yLabel: (index: number) => string;
  /** Number of columns in the grid. Default 4. */
  columns?: number;
};

export function UiAvatarGrid({
  avatars,
  selectedIndex,
  dimmedIndices = [],
  onPick,
  a11yLabel,
  columns = 4,
}: UiAvatarGridProps): React.JSX.Element {
  const dimmedSet = new Set(dimmedIndices);
  const cellSize = 100 / columns;

  return (
    <View style={styles.grid} accessibilityRole="none">
      {avatars.map((source, idx) => {
        const isSelected = idx === selectedIndex;
        const isDimmed = dimmedSet.has(idx);
        return (
          <Pressable
            key={idx}
            accessibilityRole="button"
            accessibilityLabel={a11yLabel(idx)}
            accessibilityState={{ selected: isSelected }}
            style={[
              styles.cell,
              { width: `${cellSize}%` as `${number}%` },
              isSelected && styles.selectedBorder,
              isDimmed && styles.dimmed,
            ]}
            onPress={() => onPick(idx)}
          >
            <Image
              source={source}
              style={styles.avatar}
              accessibilityElementsHidden
              importantForAccessibility="no"
              resizeMode="contain"
            />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    aspectRatio: 1,
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  selectedBorder: {
    borderWidth: 3,
    borderColor: '#000',
    borderRadius: 8,
  },
  dimmed: {
    opacity: 0.4,
  },
});
