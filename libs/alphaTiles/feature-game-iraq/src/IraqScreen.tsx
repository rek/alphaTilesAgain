/**
 * Pure presenter for the Iraq tile-explorer screen.
 *
 * 5×7 grid of tiles (35 per page), prev/next page arrows, tap-to-overlay
 * a word + image on the tapped tile. No hooks except useWindowDimensions;
 * no react-i18next imports — all strings flow in as props.
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
import { IRAQ_GRID_COLUMNS, IRAQ_PAGE_SIZE } from './iraqPagination';

export type IraqTileView = {
  /** Visible label — base text or stripped iconic word when overlay active. */
  text: string;
  /** Background colour from colorList; overridden to white when overlay active. */
  bgColor: string;
};

export type IraqOverlay = {
  /** Index within tilesOnPage (0..34) of the tapped tile. */
  tileIndex: number;
  /** Word text to display in the tile (already stripInstructionCharacters'd). */
  wordText: string;
  /** Optional word image overlaid on the tile. */
  wordImage: ImageSourcePropType | undefined;
};

export type IraqScreenProps = {
  /** Up to 35 tile views; partial pages have a shorter list. */
  tilesOnPage: IraqTileView[];
  /** Active overlay (tap animation in flight) — or null. */
  overlay: IraqOverlay | null;
  /** 0-based current page index. */
  page: number;
  /** Total pages (>= 1). */
  pageCount: number;
  /** True while a tap animation is in flight — disables tile/page presses. */
  interactionLocked: boolean;
  /** True when scriptDirection === 'RTL' — flips arrow images horizontally. */
  rtl: boolean;
  onTilePress: (indexOnPage: number) => void;
  onPrev: () => void;
  onNext: () => void;
};

const TILE_OVERLAY_BG = '#FFFFFF';
const TILE_TEXT = '#FFFFFF';
const TILE_OVERLAY_TEXT = '#000000';
const ARROW_BG = '#E0E0E0';
const ARROW_DISABLED = 'transparent';

export function IraqScreen({
  tilesOnPage,
  overlay,
  page,
  pageCount,
  interactionLocked,
  rtl,
  onTilePress,
  onPrev,
  onNext,
}: IraqScreenProps): React.JSX.Element {
  const { width, height } = useWindowDimensions();
  const gridWidth = Math.min(width - 32, height * 1.4);
  const tileSize = Math.floor(gridWidth / IRAQ_GRID_COLUMNS) - 4;

  const showPrev = page > 0;
  const showNext = page < pageCount - 1;

  // Pad with empty cells so the grid is always 5×7 (Java keeps cell positions stable).
  const cells: (IraqTileView | null)[] = Array.from({ length: IRAQ_PAGE_SIZE }, (_, i) =>
    i < tilesOnPage.length ? tilesOnPage[i] : null,
  );

  return (
    <View style={styles.root}>
      <View style={[styles.grid, { width: gridWidth }]}>
        {cells.map((cell, i) => {
          if (cell === null) {
            return (
              <View
                key={i}
                style={[styles.cell, styles.cellEmpty, { width: tileSize, height: tileSize }]}
              />
            );
          }

          const overlayActive = overlay !== null && overlay.tileIndex === i;
          const bg = overlayActive ? TILE_OVERLAY_BG : cell.bgColor;
          const fg = overlayActive ? TILE_OVERLAY_TEXT : TILE_TEXT;
          const text = overlayActive && overlay !== null ? overlay.wordText : cell.text;

          return (
            <Pressable
              key={i}
              onPress={interactionLocked ? undefined : () => onTilePress(i)}
              style={[
                styles.cell,
                { width: tileSize, height: tileSize, backgroundColor: bg },
              ]}
              accessibilityRole="button"
              accessibilityLabel={cell.text}
              accessibilityState={{ disabled: interactionLocked }}
            >
              {overlayActive && overlay !== null && overlay.wordImage ? (
                <Image
                  source={overlay.wordImage}
                  style={styles.overlayImage}
                  resizeMode="contain"
                  accessibilityElementsHidden
                  importantForAccessibility="no"
                />
              ) : null}
              <Text
                style={[styles.cellText, { color: fg }]}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {text}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.arrowRow}>
        <Pressable
          onPress={interactionLocked || !showPrev ? undefined : onPrev}
          accessibilityRole="button"
          accessibilityLabel="Previous page"
          accessibilityState={{ disabled: interactionLocked || !showPrev }}
          style={[
            styles.arrow,
            { backgroundColor: showPrev ? ARROW_BG : ARROW_DISABLED },
            rtl && styles.arrowFlipped,
          ]}
        >
          <Text style={[styles.arrowText, !showPrev && styles.arrowHidden]}>{'◀'}</Text>
        </Pressable>

        <Text style={styles.pageLabel}>
          {page + 1} / {pageCount}
        </Text>

        <Pressable
          onPress={interactionLocked || !showNext ? undefined : onNext}
          accessibilityRole="button"
          accessibilityLabel="Next page"
          accessibilityState={{ disabled: interactionLocked || !showNext }}
          style={[
            styles.arrow,
            { backgroundColor: showNext ? ARROW_BG : ARROW_DISABLED },
            rtl && styles.arrowFlipped,
          ]}
        >
          <Text style={[styles.arrowText, !showNext && styles.arrowHidden]}>{'▶'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cell: {
    margin: 2,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  cellEmpty: {
    backgroundColor: 'transparent',
  },
  cellText: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  overlayImage: {
    width: '70%',
    height: '70%',
    position: 'absolute',
    top: '15%',
    insetInlineStart: '15%',
    opacity: 0.8,
  },
  arrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    paddingVertical: 8,
  },
  arrow: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 56,
    alignItems: 'center',
  },
  arrowFlipped: {
    transform: [{ scaleX: -1 }],
  },
  arrowText: {
    fontSize: 24,
    color: '#000',
  },
  arrowHidden: {
    opacity: 0,
  },
  pageLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
});
