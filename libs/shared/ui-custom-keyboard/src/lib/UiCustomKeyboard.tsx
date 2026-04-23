/**
 * Custom on-screen keyboard driven by keyList from aa_keyboard.txt.
 *
 * Renders 35 cells per page: 33 key cells + 2 navigation slots.
 * When keys.length <= 35, no navigation arrows shown.
 * When keys.length > 35, arrow keys occupy slots 34-35 on the last page.
 * Pagination state is internal (useState).
 *
 * No i18n import. All labels are passed as props by the container.
 * See design.md §D5.
 */
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

const KEYS_PER_PAGE = 33;
const TOTAL_CELLS = 35;

export type KeyEntry = {
  text: string;
  colorHex: string;
};

export type UiCustomKeyboardProps = {
  keys: KeyEntry[];
  onKey: (text: string) => void;
  onBackspace: () => void;
  a11y: {
    delete: string;
    next: string;
    prev: string;
  };
};

export function UiCustomKeyboard({
  keys,
  onKey,
  onBackspace,
  a11y,
}: UiCustomKeyboardProps): React.JSX.Element {
  const [page, setPage] = useState(0);

  const needsPagination = keys.length > TOTAL_CELLS;
  const totalPages = needsPagination
    ? Math.ceil(keys.length / KEYS_PER_PAGE)
    : 1;

  const pageStart = page * KEYS_PER_PAGE;
  const pageEnd = pageStart + KEYS_PER_PAGE;
  const pageKeys = keys.slice(pageStart, pageEnd);

  const hasPrev = page > 0;
  const hasNext = page < totalPages - 1;

  const cells: React.JSX.Element[] = [];

  pageKeys.forEach((k, i) => {
    cells.push(
      <Pressable
        key={`key-${pageStart + i}`}
        accessibilityRole="button"
        accessibilityLabel={k.text}
        style={[styles.cell, { backgroundColor: k.colorHex || '#e0e0e0' }]}
        onPress={() => onKey(k.text)}
      >
        <Text style={styles.keyText}>{k.text}</Text>
      </Pressable>,
    );
  });

  // Fill remaining cells up to slot 33
  const keysOnPage = pageKeys.length;
  for (let i = keysOnPage; i < KEYS_PER_PAGE; i++) {
    cells.push(<View key={`empty-${i}`} style={styles.emptyCell} />);
  }

  // Slot 34: backward arrow (or empty)
  if (needsPagination) {
    cells.push(
      hasPrev ? (
        <Pressable
          key="prev"
          accessibilityRole="button"
          accessibilityLabel={a11y.prev}
          style={[styles.cell, styles.navCell]}
          onPress={() => setPage((p) => Math.max(0, p - 1))}
        >
          <Text style={styles.navText}>{'←'}</Text>
        </Pressable>
      ) : (
        <View key="prev-empty" style={styles.emptyCell} />
      ),
    );

    // Slot 35: forward arrow (or empty)
    cells.push(
      hasNext ? (
        <Pressable
          key="next"
          accessibilityRole="button"
          accessibilityLabel={a11y.next}
          style={[styles.cell, styles.navCell]}
          onPress={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
        >
          <Text style={styles.navText}>{'→'}</Text>
        </Pressable>
      ) : (
        <View key="next-empty" style={styles.emptyCell} />
      ),
    );
  }

  return (
    <View style={styles.wrapper}>
      <View style={styles.grid}>{cells}</View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={a11y.delete}
        style={styles.backspaceButton}
        onPress={onBackspace}
      >
        <Text style={styles.backspaceText}>{'⌫'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: '20%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#999',
  },
  emptyCell: {
    width: '20%',
    aspectRatio: 1,
  },
  navCell: {
    backgroundColor: '#c8c8c8',
  },
  keyText: {
    fontSize: 18,
    textAlign: 'center',
  },
  navText: {
    fontSize: 20,
    textAlign: 'center',
  },
  backspaceButton: {
    alignSelf: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 4,
    backgroundColor: '#ddd',
    borderRadius: 4,
  },
  backspaceText: {
    fontSize: 20,
  },
});
