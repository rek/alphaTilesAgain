/**
 * WebAudioUnlockGatePresenter — full-screen "tap to start" surface.
 *
 * Pure props → JSX. Rendered by data-audio's AudioGate (via feature-loading
 * TapToBegin) INSTEAD of the app while audio is locked (#47). The whole
 * surface is the press target (click or touch). Pressing is disabled until
 * `isReady` (audio preloaded) so the gesture can prime every clip.
 */
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useScaledStyles } from '@shared/util-theme';

export function WebAudioUnlockGatePresenter({
  isReady,
  label,
  title,
  onUnlock,
}: {
  isReady: boolean;
  /** Pre-translated: "Tap to start" when ready, progress text while loading. */
  label: string;
  /** Pre-translated heading, e.g. the app title. */
  title: string;
  onUnlock: () => void;
}) {
  const styles = useScaledStyles(stylesFor);
  return (
    <Pressable
      style={styles.overlay}
      onPress={isReady ? onUnlock : undefined}
      disabled={!isReady}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !isReady, busy: !isReady }}
      testID="web-audio-unlock-gate"
    >
      <Text style={styles.title}>{title}</Text>
      <View style={[styles.button, !isReady && styles.buttonBusy]}>
        <Text style={styles.label}>{label}</Text>
      </View>
    </Pressable>
  );
}

const stylesFor = (fs: number) => StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    gap: 24,
  },
  title: {
    fontSize: 22 * fs,
    fontWeight: 'bold',
    color: '#212121',
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 8,
    maxWidth: '100%',
  },
  buttonBusy: {
    backgroundColor: '#90CAF9',
  },
  label: {
    color: '#ffffff',
    fontSize: 16 * fs,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
