import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Tile } from './Tile';
import type { TileProps } from './Tile';

export type AudioButtonTileProps = TileProps;

export function AudioButtonTile(props: AudioButtonTileProps): React.JSX.Element {
  return (
    <View style={styles.wrapper}>
      <Tile {...props} />
      <View style={styles.speakerBadge} pointerEvents="none">
        <Text style={styles.speakerIcon}>🔊</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    aspectRatio: 1,
  },
  speakerBadge: {
    position: 'absolute',
    bottom: 4,
    end: 4,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: 4,
    paddingHorizontal: 2,
  },
  speakerIcon: {
    fontSize: 10,
  },
});
