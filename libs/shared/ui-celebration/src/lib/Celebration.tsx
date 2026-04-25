import React, { useEffect, useRef } from 'react';
import { BackHandler, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import LottieView from 'lottie-react-native';
import type { AnimationObject } from 'lottie-react-native';

export type CelebrationProps = {
  animationSource: string | { uri: string } | AnimationObject;
  onBackPress: () => void;
  backLabel: string; // pre-translated
  onMount?: () => void;
};

export function Celebration({
  animationSource,
  onBackPress,
  backLabel,
  onMount,
}: CelebrationProps): React.JSX.Element {
  const called = useRef(false);

  useEffect(() => {
    if (!called.current) {
      called.current = true;
      onMount?.();
    }
  }, [onMount]);

  // Suppress Android hardware-back during celebration (mirrors Celebration.java:25-30).
  useEffect(() => {
    if (Platform.OS === 'web') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, []);

  return (
    <View style={styles.screen}>
      <LottieView
        source={animationSource}
        style={styles.animation}
        autoPlay
        loop={false}
      />
      <Pressable
        style={styles.backButton}
        onPress={onBackPress}
        accessibilityLabel={backLabel}
        accessibilityRole="button"
      >
        <Text style={styles.backText}>{backLabel}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  animation: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  backButton: {
    position: 'absolute',
    bottom: 48,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 8,
  },
  backText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
