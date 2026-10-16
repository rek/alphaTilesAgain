import React from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { useBreakpoint } from '@shared/util-theme';

/** Tablet / wide-web cap so cells don't balloon across a 1024dp+ window. */
const TABLET_BOARD_MAX_WIDTH = 500;

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
  const breakpoint = useBreakpoint();
  const childCount = React.Children.count(children);
  const derivedRows = rows ?? Math.ceil(childCount / columns);

  // Cell size: fit columns across the usable width; shrink if rows overflow height.
  // Phone: full window width (unchanged). Tablet: capped, board stays centred.
  const usableWidth = breakpoint === 'tablet' ? Math.min(width, TABLET_BOARD_MAX_WIDTH) : width;
  const cellByWidth = Math.floor(usableWidth / columns);
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
