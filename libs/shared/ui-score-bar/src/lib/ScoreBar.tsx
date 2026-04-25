import React from 'react';
import { Image, ImageSourcePropType, StyleSheet, Text, View } from 'react-native';

function contrastColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.5 ? '#000' : '#fff';
}

export type TrackerState = 'complete' | 'incomplete';

export type ScoreBarProps = {
  gameNumber: number;
  gameColor: string;
  challengeLevel: number;
  trackerStates: TrackerState[]; // always length 12
  score: number;
  scoreLabel: string; // pre-translated
  trackerIcons?: { complete: ImageSourcePropType; incomplete: ImageSourcePropType };
};

export function ScoreBar({
  gameNumber,
  gameColor,
  challengeLevel,
  trackerStates,
  score,
  scoreLabel,
  trackerIcons,
}: ScoreBarProps): React.JSX.Element {
  const textColor = contrastColor(gameColor);
  return (
    <View style={styles.row}>
      {/* Game number badge */}
      <View style={[styles.badge, { backgroundColor: gameColor }]}>
        <Text style={[styles.badgeText, { color: textColor }]} adjustsFontSizeToFit numberOfLines={1}>
          {gameNumber}
        </Text>
      </View>

      {/* Challenge level badge */}
      <View style={styles.levelBadge}>
        <Text style={styles.levelText} adjustsFontSizeToFit numberOfLines={1}>
          {challengeLevel}
        </Text>
      </View>

      {/* 12 tracker dots */}
      <View style={styles.trackers}>
        {trackerStates.map((state, i) => {
          const n = i + 1;
          const total = trackerStates.length;
          const label = `Tracker ${n} of ${total}, ${state}`;
          if (trackerIcons) {
            return (
              <Image
                key={i}
                source={state === 'complete' ? trackerIcons.complete : trackerIcons.incomplete}
                style={styles.dot}
                accessible
                accessibilityLabel={label}
              />
            );
          }
          return (
            <View
              key={i}
              style={[styles.dot, state === 'complete' ? styles.dotComplete : styles.dotIncomplete]}
              accessible
              accessibilityLabel={label}
            />
          );
        })}
      </View>

      {/* Score */}
      <View style={[styles.badge, { backgroundColor: gameColor }]}>
        <Text style={[styles.badgeText, { color: textColor }]} adjustsFontSizeToFit numberOfLines={1}>
          {score}
        </Text>
        <Text style={[styles.scoreLabel, { color: textColor }]} adjustsFontSizeToFit numberOfLines={1}>
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
    gap: 2,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  dotComplete: {
    backgroundColor: '#4CAF50',
  },
  dotIncomplete: {
    backgroundColor: '#BDBDBD',
  },
  scoreLabel: {
    fontSize: 10,
  },
});
