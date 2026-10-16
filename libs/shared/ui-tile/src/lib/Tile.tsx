import React from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
} from 'react-native';
import type { ImageSourcePropType } from 'react-native';
import { readableTextColor, useScaledStyles } from '@shared/util-theme';

export type TileProps = {
  text?: string;
  imageSource?: ImageSourcePropType;
  color: string;
  /** Defaults to black / white, whichever is readable on `color` (WCAG AA large). */
  fontColor?: string;
  pressed?: boolean;
  onPress?: () => void;
  accessibilityLabel: string;
  accessibilityRole?: 'button' | 'none';
};

export function Tile({
  text,
  imageSource,
  color,
  fontColor,
  pressed = false,
  onPress,
  accessibilityLabel,
  accessibilityRole = 'button',
}: TileProps): React.JSX.Element {
  const styles = useScaledStyles(stylesFor);
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityRole}
      style={({ pressed: nativePressed }) => [
        styles.tile,
        { backgroundColor: color },
        (pressed || nativePressed) && styles.pressed,
      ]}
    >
      {imageSource ? (
        <Image
          source={imageSource}
          style={styles.image}
          resizeMode="contain"
          accessibilityElementsHidden
          importantForAccessibility="no"
        />
      ) : (
        <Text style={[styles.label, { color: fontColor ?? readableTextColor(color) }]} numberOfLines={1} adjustsFontSizeToFit>
          {text}
        </Text>
      )}
    </Pressable>
  );
}

const stylesFor = (fs: number) => StyleSheet.create({
  tile: {
    flex: 1,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    margin: 2,
    overflow: 'hidden',
  },
  label: {
    fontSize: 28 * fs,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  image: {
    width: '80%',
    height: '80%',
  },
  pressed: {
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
  },
});
