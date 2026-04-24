import React from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';

export type GameBoardProps = {
  columns: number;
  rows?: number;
  children: React.ReactNode;
  accessibilityLabel?: string;
};

export function GameBoard({
  columns,
  rows,
  children,
  accessibilityLabel,
}: GameBoardProps): React.JSX.Element {
  const { width, height } = useWindowDimensions();
  const childCount = React.Children.count(children);
  const derivedRows = rows ?? Math.ceil(childCount / columns);

  // Cell size: fit columns across screen width; shrink if rows overflow height.
  const cellByWidth = Math.floor(width / columns);
  const cellByHeight = derivedRows > 0 ? Math.floor((height * 0.7) / derivedRows) : cellByWidth;
  const cellSize = Math.min(cellByWidth, cellByHeight);

  return (
    <View
      accessibilityLabel={accessibilityLabel}
      style={[styles.board, { width: cellSize * columns }]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  board: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    // logical margins (RTL-safe): no marginLeft/marginRight
    alignSelf: 'center',
  },
});
