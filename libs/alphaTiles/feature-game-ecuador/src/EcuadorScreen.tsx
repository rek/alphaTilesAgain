/**
 * Pure presenter for the Ecuador 8-tile scatter word-match game.
 * Prompt image + label at top (tappable to repeat audio); 8 absolutely-positioned
 * word tiles below.
 *
 * Zero hooks except useWindowDimensions; zero i18n imports.
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

const GRAYED_BG = '#A9A9A9';
const GRAYED_TEXT = '#000000';
const TILE_TEXT = '#FFFFFF';

export type EcuadorTile = {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  bgColor: string;
  grayed: boolean;
};

export type EcuadorScreenProps = {
  promptImage: ImageSourcePropType | undefined;
  /** Stripped LOP text shown above/with the prompt image. */
  promptLabel: string;
  tiles: EcuadorTile[];
  interactionLocked: boolean;
  onTilePress: (slot: number) => void;
  onImagePress: () => void;
};

export function EcuadorScreen({
  promptImage,
  promptLabel,
  tiles,
  interactionLocked,
  onTilePress,
  onImagePress,
}: EcuadorScreenProps): React.JSX.Element {
  const { width, height } = useWindowDimensions();
  const imageSize = Math.min(Math.floor(width * 0.4), Math.floor(height * 0.18));

  return (
    <View style={styles.root}>
      <View style={styles.promptRow}>
        <Pressable
          onPress={interactionLocked ? undefined : onImagePress}
          style={[styles.imageWrap, { width: imageSize, height: imageSize }]}
          accessibilityLabel={promptLabel}
          accessibilityRole="button"
        >
          {promptImage ? (
            <Image
              source={promptImage}
              style={styles.image}
              resizeMode="contain"
              accessibilityElementsHidden
              importantForAccessibility="no"
            />
          ) : (
            <Text style={styles.imageFallback} numberOfLines={2} adjustsFontSizeToFit>
              {promptLabel}
            </Text>
          )}
        </Pressable>
        <Text style={styles.promptLabel} numberOfLines={1} adjustsFontSizeToFit>
          {promptLabel}
        </Text>
      </View>

      <View style={styles.field} pointerEvents="box-none">
        {tiles.map((tile, i) => {
          const bg = tile.grayed ? GRAYED_BG : tile.bgColor;
          const fg = tile.grayed ? GRAYED_TEXT : TILE_TEXT;
          return (
            <Pressable
              key={i}
              onPress={
                interactionLocked || tile.grayed ? undefined : () => onTilePress(i)
              }
              style={({ pressed }) => [
                styles.tile,
                {
                  start: tile.x,
                  top: tile.y,
                  width: tile.width,
                  height: tile.height,
                  backgroundColor: bg,
                },
                pressed && !tile.grayed && styles.pressed,
              ]}
              accessibilityLabel={tile.text}
              accessibilityRole="button"
              accessibilityState={{ disabled: tile.grayed || interactionLocked }}
            >
              <Text
                style={[styles.tileText, { color: fg }]}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {tile.text}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  promptRow: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  imageWrap: {
    backgroundColor: '#EEEEEE',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    width: '90%',
    height: '90%',
  },
  imageFallback: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  promptLabel: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#222',
    textAlign: 'center',
  },
  field: {
    flex: 1,
    position: 'relative',
  },
  tile: {
    position: 'absolute',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  tileText: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.97 }],
  },
});
