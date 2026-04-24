import React from 'react';
import {
  Image,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { ImageSourcePropType } from 'react-native';

export type TrackerState = 'complete' | 'incomplete';

export type ScoreBarProps = {
  gameNumber: number;
  gameColor: string;
  challengeLevel: number;
  trackerStates: TrackerState[]; // always length 12
  score: number;
  scoreLabel: string; // pre-translated
  completeSource: ImageSourcePropType;
  incompleteSource: ImageSourcePropType;
};

export function ScoreBar({
  gameNumber,
  gameColor,
  challengeLevel,
  trackerStates,
  score,
  scoreLabel,
  completeSource,
  incompleteSource,
}: ScoreBarProps): React.JSX.Element {
  return (
    <View style={styles.row}>
      {/* Game number badge */}
      <View style={[styles.badge, { backgroundColor: gameColor }]}>
        <Text style={styles.badgeText} adjustsFontSizeToFit numberOfLines={1}>
          {gameNumber}
        </Text>
      </View>

      {/* Challenge level badge */}
      <View style={styles.levelBadge}>
        <Text style={styles.levelText} adjustsFontSizeToFit numberOfLines={1}>
          {challengeLevel}
        </Text>
      </View>

      {/* 12 tracker icons */}
      <View style={styles.trackers}>
        {trackerStates.map((state, i) => (
          <Image
            key={i}
            source={state === 'complete' ? completeSource : incompleteSource}
            style={styles.tracker}
            accessibilityElementsHidden
            importantForAccessibility="no"
          />
        ))}
      </View>

      {/* Score */}
      <View style={[styles.badge, { backgroundColor: gameColor }]}>
        <Text style={styles.badgeText} adjustsFontSizeToFit numberOfLines={1}>
          {score}
        </Text>
        <Text style={styles.scoreLabel} adjustsFontSizeToFit numberOfLines={1}>
          {scoreLabel}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 4,
    backgroundColor: '#f5f5f5',
  },
  badge: {
    minWidth: 36,
    height: 36,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    marginHorizontal: 2,
  },
  badgeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  levelBadge: {
    minWidth: 36,
    height: 36,
    borderRadius: 4,
    backgroundColor: '#FFC107',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    marginHorizontal: 2,
  },
  levelText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
  },
  trackers: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tracker: {
    width: 18,
    height: 18,
    margin: 1,
  },
  scoreLabel: {
    color: '#fff',
    fontSize: 10,
  },
});
