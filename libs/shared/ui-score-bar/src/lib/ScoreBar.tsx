import React from 'react';
import { Image, ImageSourcePropType, StyleSheet, Text, View } from 'react-native';
import { readableTextColor } from '@shared/util-theme';

export type TrackerState = 'complete' | 'incomplete';

export type ScoreBarProps = {
  gameNumber: number;
  gameColor: string;
  challengeLevel: number;
  trackerStates: TrackerState[]; // always length 12
  score: number;
  scoreLabel: string; // pre-translated
  /** Pre-translated screen-reader summary of the 12 trackers, e.g. "3 of 12 trackers complete". */
  trackersLabel: string;
  trackerIcons?: { complete: ImageSourcePropType; incomplete: ImageSourcePropType };
};

export function ScoreBar({
  gameNumber,
  gameColor,
  challengeLevel,
  trackerStates,
  score,
  scoreLabel,
  trackersLabel,
  trackerIcons,
}: ScoreBarProps): React.JSX.Element {
  const textColor = readableTextColor(gameColor);
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

      {/* 12 tracker dots — one summary label, dots hidden from screen readers */}
      <View
        style={styles.trackers}
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel={trackersLabel}
        accessibilityValue={{
          min: 0,
          max: trackerStates.length,
          now: trackerStates.filter((s) => s === 'complete').length,
        }}
      >
        {trackerStates.map((state, i) =>
          trackerIcons ? (
            <Image
              key={i}
              source={state === 'complete' ? trackerIcons.complete : trackerIcons.incomplete}
              style={styles.dot}
              accessibilityElementsHidden
              importantForAccessibility="no"
            />
          ) : (
            <View
              key={i}
              style={[styles.dot, state === 'complete' ? styles.dotComplete : styles.dotIncomplete]}
              accessibilityElementsHidden
              importantForAccessibility="no"
            />
          ),
        )}
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
    // minHeight, not height: the score badge stacks number + label and must
    // grow rather than clip when the label wraps/scales (#47).
    minHeight: 36,
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
    minHeight: 36,
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
