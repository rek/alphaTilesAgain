/**
 * LoadingScreen — pure presenter.
 * No hooks, no i18n, no router imports.
 */
import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import type { Phase } from './bootSequence';

const RING_SIZE = 80;
const STROKE_WIDTH = 6;
const RADIUS = (RING_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export type LoadingScreenLabels = {
  title: string;
  progress: string;
  tapToBegin: string;
  error: string;
};

export type LoadingScreenProps = {
  phase: Phase;
  audioProgress: number; // 0..1
  error: Error | null;
  onTapToBegin?: () => void;
  labels: LoadingScreenLabels;
};

export function LoadingScreen({
  phase,
  audioProgress,
  error,
  onTapToBegin,
  labels,
}: LoadingScreenProps): React.JSX.Element {
  const progress = phase === 'audio' ? audioProgress : phase === 'done' ? 1 : 0;
  const strokeDashoffset = CIRCUMFERENCE * (1 - progress);
  const isIndeterminate = phase !== 'audio' && phase !== 'done';
  const showTapButton = phase === 'web-gate' && onTapToBegin !== undefined;

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>{labels.title}</Text>

      {error ? (
        <Text style={styles.error}>{labels.error}</Text>
      ) : showTapButton ? (
        <Pressable
          style={styles.tapButton}
          onPress={onTapToBegin}
          accessibilityRole="button"
          accessibilityLabel={labels.tapToBegin}
        >
          <Text style={styles.tapLabel}>{labels.tapToBegin}</Text>
        </Pressable>
      ) : (
        <View style={styles.ring}>
          <Svg width={RING_SIZE} height={RING_SIZE}>
            {/* Track */}
            <Circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RADIUS}
              stroke="#e0e0e0"
              strokeWidth={STROKE_WIDTH}
              fill="none"
            />
            {/* Progress arc — full circle for indeterminate phases */}
            <Circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RADIUS}
              stroke="#2196F3"
              strokeWidth={STROKE_WIDTH}
              fill="none"
              strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
              strokeDashoffset={isIndeterminate ? 0 : strokeDashoffset}
              strokeLinecap="round"
              transform={`rotate(-90, ${RING_SIZE / 2}, ${RING_SIZE / 2})`}
              opacity={isIndeterminate ? 0.4 : 1}
            />
          </Svg>
        </View>
      )}

      <Text
        style={styles.progressLabel}
        accessibilityLiveRegion="polite"
        accessibilityRole="text"
      >
        {labels.progress}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    gap: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#212121',
  },
  ring: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tapButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 8,
  },
  tapLabel: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  progressLabel: {
    fontSize: 14,
    color: '#757575',
  },
  error: {
    fontSize: 14,
    color: '#f44336',
    textAlign: 'center',
    paddingHorizontal: 24,
  },
});
