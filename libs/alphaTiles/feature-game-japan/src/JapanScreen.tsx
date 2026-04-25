/**
 * JapanScreen — pure presenter for the Japan syllable-segmentation game.
 *
 * Renders a horizontal row of tile groups interleaved with link buttons.
 * No hooks, no i18n — all data passed as props.
 *
 * Port of Japan.java layout logic.
 */
import React from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { ImageSourcePropType } from 'react-native';

const TILE_BG = '#607D8B';
const TILE_LOCKED_BG = '#4CAF50';
const TILE_TEXT_COLOR = '#FFFFFF';
const LINK_BTN_SIZE = 24;
const LINK_BTN_BG = '#90A4AE';
const LINK_BTN_HIT = 32;

export type BoundaryInfo = {
  /** Index between groups[index] and groups[index+1] */
  index: number;
  /** Whether the link button is visible/tappable */
  visible: boolean;
};

export type JapanScreenProps = {
  groups: Array<{ tiles: string[]; isLocked: boolean }>;
  boundaries: BoundaryInfo[];
  onJoin: (boundaryIndex: number) => void;
  onSeparate: (groupIndex: number) => void;
  wordText: string;
  wordImage?: ImageSourcePropType;
};

function TileBox({
  text,
  isLocked,
  onPress,
}: {
  text: string;
  isLocked: boolean;
  onPress: () => void;
}): React.JSX.Element {
  return (
    <Pressable
      onPress={isLocked ? undefined : onPress}
      style={({ pressed }) => [
        styles.tileBox,
        isLocked ? styles.tileBoxLocked : styles.tileBoxDefault,
        pressed && !isLocked && styles.pressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={text}
      accessibilityState={{ disabled: isLocked }}
    >
      <Text style={styles.tileText} numberOfLines={1} adjustsFontSizeToFit>
        {text}
      </Text>
    </Pressable>
  );
}

function LinkButton({
  visible,
  onPress,
}: {
  visible: boolean;
  onPress: () => void;
}): React.JSX.Element {
  if (!visible) {
    return <View style={styles.linkButtonSpacer} />;
  }

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.linkButton, pressed && styles.pressed]}
      hitSlop={LINK_BTN_HIT}
      accessibilityRole="button"
      accessibilityLabel="join tiles"
    >
      <View style={styles.linkButtonDot} />
    </Pressable>
  );
}

export function JapanScreen({
  groups,
  boundaries,
  onJoin,
  onSeparate,
  wordText,
  wordImage,
}: JapanScreenProps): React.JSX.Element {
  return (
    <View style={styles.root}>
      {/* Word reference row */}
      <View style={styles.wordRow}>
        {wordImage ? (
          <Image
            source={wordImage}
            style={styles.wordImage}
            resizeMode="contain"
            accessibilityLabel={wordText}
          />
        ) : null}
        {wordText ? (
          <Text style={styles.wordText} numberOfLines={1} adjustsFontSizeToFit>
            {wordText}
          </Text>
        ) : null}
      </View>

      {/* Tile row */}
      <ScrollView
        horizontal
        contentContainerStyle={styles.tileRow}
        showsHorizontalScrollIndicator={false}
      >
        {groups.map((group, gi) => {
          const groupLabel = group.tiles.join('');
          const boundary = boundaries.find((b) => b.index === gi - 1);
          const showLink = boundary ? boundary.visible : false;

          return (
            <React.Fragment key={gi}>
              {gi > 0 && (
                <LinkButton
                  visible={showLink}
                  onPress={() => onJoin(gi - 1)}
                />
              )}
              <TileBox
                text={groupLabel}
                isLocked={group.isLocked}
                onPress={() => onSeparate(gi)}
              />
            </React.Fragment>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    paddingHorizontal: 16,
  },
  wordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 80,
  },
  wordImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  wordText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#212121',
    textAlign: 'center',
  },
  tileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'nowrap',
    paddingHorizontal: 8,
    gap: 4,
  },
  tileBox: {
    minWidth: 52,
    height: 60,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  tileBoxDefault: {
    backgroundColor: TILE_BG,
  },
  tileBoxLocked: {
    backgroundColor: TILE_LOCKED_BG,
  },
  tileText: {
    color: TILE_TEXT_COLOR,
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  linkButton: {
    width: LINK_BTN_SIZE,
    height: LINK_BTN_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkButtonSpacer: {
    width: LINK_BTN_SIZE,
    height: LINK_BTN_SIZE,
  },
  linkButtonDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: LINK_BTN_BG,
  },
  pressed: {
    opacity: 0.7,
    transform: [{ scale: 0.94 }],
  },
});
