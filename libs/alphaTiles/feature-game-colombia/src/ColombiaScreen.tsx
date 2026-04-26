/**
 * Pure presenter for the Colombia "build the word" game.
 *
 * Word image at top (tappable to repeat audio) → active-attempt display
 * (background tinted by status) → tile keyboard (paginated when needed) plus
 * delete button. No hooks beyond useWindowDimensions; no react-i18next.
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
import type { AttemptStatus, KeyTile } from './types';

const STATUS_BG: Record<AttemptStatus, string> = {
  yellow: '#FFEB3B',
  orange: '#F44336',
  gray: '#A9A9A9',
  green: '#4CAF50',
};

const STATUS_FG: Record<AttemptStatus, string> = {
  yellow: '#000000',
  orange: '#000000',
  gray: '#000000',
  green: '#FFFFFF',
};

export type ColombiaScreenProps = {
  wordImage: ImageSourcePropType | undefined;
  /** Fallback label / accessibility label for the image. */
  wordLabel: string;
  /** Currently displayed attempt text. */
  displayedText: string;
  /** Color of the attempt-display background. */
  status: AttemptStatus;
  /** Visible keys for the current page (already paginated in container). */
  keys: KeyTile[];
  /** True when keysInUse > one page → arrows visible. */
  paginated: boolean;
  page: number;
  totalScreens: number;
  /** True iff keys & delete are interactive (false during win/lock). */
  interactionLocked: boolean;
  /** Tap delete to pop last keyed entry. */
  onDelete: () => void;
  /** Tap a key at slotIndex to keypress. */
  onKeyPress: (slotIndex: number) => void;
  /** Tap the back/forward arrows. delta ∈ {-1, +1}. */
  onPageChange: (delta: 1 | -1) => void;
  /** Tap the word image to replay audio. */
  onImagePress: () => void;
};

export function ColombiaScreen({
  wordImage,
  wordLabel,
  displayedText,
  status,
  keys,
  paginated,
  page,
  totalScreens,
  interactionLocked,
  onDelete,
  onKeyPress,
  onPageChange,
  onImagePress,
}: ColombiaScreenProps): React.JSX.Element {
  const { width, height } = useWindowDimensions();
  const imageSize = Math.min(Math.floor(width * 0.4), Math.floor(height * 0.28));
  const cols = Math.min(7, Math.max(1, keys.length));
  const keyWidth = Math.floor((width - 32) / Math.max(cols, 1)) - 6;
  const keyHeight = Math.max(48, Math.floor(height * 0.075));

  const onFirstPage = page <= 1;
  const onLastPage = page >= totalScreens;

  return (
    <View style={styles.root}>
      <Pressable
        onPress={interactionLocked ? undefined : onImagePress}
        style={[styles.imageWrap, { width: imageSize, height: imageSize }]}
        accessibilityLabel={wordLabel}
        accessibilityRole="button"
      >
        {wordImage ? (
          <Image
            source={wordImage}
            style={styles.image}
            resizeMode="contain"
            accessibilityElementsHidden
            importantForAccessibility="no"
          />
        ) : (
          <Text style={styles.imageFallback} numberOfLines={2} adjustsFontSizeToFit>
            {wordLabel}
          </Text>
        )}
      </Pressable>

      <View
        style={[
          styles.attempt,
          { backgroundColor: STATUS_BG[status] },
        ]}
        accessibilityLabel={displayedText || wordLabel}
      >
        <Text
          style={[styles.attemptText, { color: STATUS_FG[status] }]}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {displayedText || ' '}
        </Text>
      </View>

      <View style={styles.keyGrid}>
        {keys.map((k, i) => (
          <Pressable
            key={`${i}-${k.text}`}
            onPress={interactionLocked ? undefined : () => onKeyPress(i)}
            style={({ pressed }) => [
              styles.key,
              { width: keyWidth, height: keyHeight, backgroundColor: k.bgColor },
              pressed && !interactionLocked && styles.pressed,
            ]}
            accessibilityLabel={k.text}
            accessibilityRole="button"
            accessibilityState={{ disabled: interactionLocked }}
          >
            <Text style={styles.keyText} numberOfLines={1} adjustsFontSizeToFit>
              {k.text}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.bottomBar}>
        {paginated ? (
          <Pressable
            onPress={onFirstPage || interactionLocked ? undefined : () => onPageChange(-1)}
            style={[styles.navBtn, onFirstPage && styles.navBtnInactive]}
            accessibilityLabel="previous page"
            accessibilityRole="button"
          >
            <Text style={styles.navText}>{'<'}</Text>
          </Pressable>
        ) : (
          <View style={styles.navBtnSpacer} />
        )}

        <Pressable
          onPress={interactionLocked ? undefined : onDelete}
          style={[styles.deleteBtn, interactionLocked && styles.deleteBtnDisabled]}
          accessibilityLabel="delete"
          accessibilityRole="button"
        >
          <Text style={styles.deleteText}>{'<-'}</Text>
        </Pressable>

        {paginated ? (
          <Pressable
            onPress={onLastPage || interactionLocked ? undefined : () => onPageChange(1)}
            style={[styles.navBtn, onLastPage && styles.navBtnInactive]}
            accessibilityLabel="next page"
            accessibilityRole="button"
          >
            <Text style={styles.navText}>{'>'}</Text>
          </Pressable>
        ) : (
          <View style={styles.navBtnSpacer} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingVertical: 16,
    gap: 16,
  },
  imageWrap: {
    backgroundColor: '#EEEEEE',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: { width: '90%', height: '90%' },
  imageFallback: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  attempt: {
    minHeight: 56,
    minWidth: 200,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attemptText: { fontSize: 32, fontWeight: 'bold', textAlign: 'center' },
  keyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  key: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  keyText: { fontSize: 24, fontWeight: 'bold', color: '#FFFFFF', textAlign: 'center' },
  pressed: { opacity: 0.78, transform: [{ scale: 0.97 }] },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginTop: 8,
  },
  navBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBtnInactive: { backgroundColor: '#A9A9A9' },
  navBtnSpacer: { width: 56, height: 56 },
  navText: { color: '#FFFFFF', fontSize: 28, fontWeight: 'bold' },
  deleteBtn: {
    width: 64,
    height: 56,
    borderRadius: 8,
    backgroundColor: '#E53935',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  deleteBtnDisabled: { backgroundColor: '#A9A9A9' },
  deleteText: { color: '#FFFFFF', fontSize: 22, fontWeight: 'bold' },
});
