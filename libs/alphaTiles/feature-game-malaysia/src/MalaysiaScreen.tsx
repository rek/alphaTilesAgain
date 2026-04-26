/**
 * Pure presenter for the Malaysia word browser.
 * Zero hook imports (apart from useWindowDimensions for sizing) and zero i18n
 * imports — all data arrives as props (CODE_STYLE.md §UI Containers).
 *
 * Layout: vertical list of up to PAGE_SIZE rows. Each row shows the
 * standardized word text (coloured per the pyramid in `colorList`) on one
 * side, the word image on the other. Tapping the text or the image fires
 * `onPress(rowIndex)`. Pagination arrows are rendered below the list and are
 * hidden at the first/last page (Malaysia.java:187-192).
 *
 * RTL: arrow images are mirrored via `transform: [{ scaleX: -1 }]`. Logical
 * row layout uses `flexDirection: 'row'` which RN auto-flips on RTL locales,
 * so the explicit constraint swap from Malaysia.java:146-167 is unnecessary.
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
import type { ImageSourcePropType, ImageStyle } from 'react-native';

export type MalaysiaRow = {
  /** Standardized text shown to the learner (LOP, post-standardize). */
  text: string;
  /** Background hex from colorList per the pyramid (or colorless index). */
  bgColor: string;
  /** Word image — undefined when the lang pack has no image for this word. */
  image: ImageSourcePropType | undefined;
  /** Stable identifier for accessibility / keying — typically wordInLWC. */
  id: string;
};

export type MalaysiaScreenProps = {
  rows: MalaysiaRow[];
  /** 0-based current page. */
  page: number;
  /** Total page count. */
  pageCount: number;
  /** Locks all input (audio playing or page transitioning). */
  disabled: boolean;
  /** Image source for the back/prev arrow chrome. */
  prevArrowSource?: ImageSourcePropType;
  /** Image source for the forward/next arrow chrome. */
  nextArrowSource?: ImageSourcePropType;
  /** When true, arrow images are flipped via scaleX: -1 (RTL parity). */
  rtl?: boolean;
  onPress: (rowIndex: number) => void;
  onPrev: () => void;
  onNext: () => void;
};

const TEXT_LIGHT = '#FFFFFF';
const TEXT_DARK = '#000000';

/** Pick a high-contrast text color over a hex background. */
function contrastColor(hex: string): string {
  if (!hex || !hex.startsWith('#') || hex.length < 7) return TEXT_DARK;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return 0.299 * r + 0.587 * g + 0.114 * b > 127.5 ? TEXT_DARK : TEXT_LIGHT;
}

export function MalaysiaScreen({
  rows,
  page,
  pageCount,
  disabled,
  prevArrowSource,
  nextArrowSource,
  rtl = false,
  onPress,
  onPrev,
  onNext,
}: MalaysiaScreenProps): React.JSX.Element {
  const { width, height } = useWindowDimensions();

  // Reserve ~30% of the height for shell chrome / arrows; remaining for rows.
  const listHeight = Math.max(220, height * 0.7 - 60);
  const rowHeight = rows.length > 0 ? Math.floor(listHeight / rows.length) : 0;

  const showPrev = page > 0;
  // pageCount comes in as a count (length), so the last page index is pageCount-1.
  const showNext = page < pageCount - 1;

  // The horizontal-flip transform is valid on Image, View, and Text styles.
  // Type as ImageStyle (the most-restrictive consumer) and reuse it on the
  // <Text> fallbacks via the shared `transform` shape.
  const arrowFlip: ImageStyle | null = rtl
    ? { transform: [{ scaleX: -1 }] }
    : null;

  return (
    <View style={[styles.root, { width }]}>
      <View style={[styles.list, { height: listHeight }]}>
        {rows.map((row, idx) => {
          const textColor = contrastColor(row.bgColor);
          return (
            <Pressable
              key={`${row.id}-${idx}`}
              onPress={disabled ? undefined : () => onPress(idx)}
              disabled={disabled}
              accessibilityRole="button"
              accessibilityLabel={`Play ${row.id}`}
              accessibilityState={{ disabled }}
              style={[
                styles.row,
                {
                  backgroundColor: row.bgColor,
                  height: rowHeight || undefined,
                },
              ]}
            >
              <Text
                style={[styles.rowText, { color: textColor }]}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {row.text}
              </Text>
              {row.image ? (
                <Image
                  source={row.image}
                  style={styles.rowImage}
                  resizeMode="contain"
                  accessibilityLabel={row.id}
                />
              ) : (
                <View style={styles.rowImagePlaceholder} />
              )}
            </Pressable>
          );
        })}
      </View>

      <View style={styles.arrowBar}>
        <Pressable
          onPress={disabled || !showPrev ? undefined : onPrev}
          disabled={disabled || !showPrev}
          accessibilityRole="button"
          accessibilityLabel="Previous page"
          accessibilityState={{ disabled: disabled || !showPrev }}
          style={[styles.arrowSlot, !showPrev && styles.arrowHidden]}
        >
          {prevArrowSource ? (
            <Image
              source={prevArrowSource}
              style={[styles.arrowImage, arrowFlip]}
              resizeMode="contain"
            />
          ) : (
            <Text style={[styles.arrowFallback, arrowFlip]}>{'<'}</Text>
          )}
        </Pressable>

        <Text style={styles.pageLabel}>
          {pageCount > 0 ? `${page + 1} / ${pageCount}` : '0 / 0'}
        </Text>

        <Pressable
          onPress={disabled || !showNext ? undefined : onNext}
          disabled={disabled || !showNext}
          accessibilityRole="button"
          accessibilityLabel="Next page"
          accessibilityState={{ disabled: disabled || !showNext }}
          style={[styles.arrowSlot, !showNext && styles.arrowHidden]}
        >
          {nextArrowSource ? (
            <Image
              source={nextArrowSource}
              style={[styles.arrowImage, arrowFlip]}
              resizeMode="contain"
            />
          ) : (
            <Text style={[styles.arrowFallback, arrowFlip]}>{'>'}</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'stretch',
    justifyContent: 'flex-start',
  },
  list: {
    flexDirection: 'column',
    width: '100%',
    paddingHorizontal: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    marginVertical: 2,
    borderRadius: 6,
    minHeight: 40,
  },
  rowText: {
    flex: 1,
    fontSize: 22,
    fontWeight: '600',
    paddingEnd: 8,
  },
  rowImage: {
    width: 48,
    height: 48,
  },
  rowImagePlaceholder: {
    width: 48,
    height: 48,
  },
  arrowBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  arrowSlot: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowHidden: {
    opacity: 0,
  },
  arrowImage: {
    width: 48,
    height: 48,
  },
  arrowFallback: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
  },
  pageLabel: {
    fontSize: 14,
    color: '#444',
    minWidth: 60,
    textAlign: 'center',
  },
});
