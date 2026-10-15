import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

export type PlacementGuidanceStrings = {
  title: string;
  intro: string;
  bands: { title: string; body: string }[];
  tip: string;
  close: string;
};

/**
 * "Where to start" explainer for the difficulty ladder (placement-guidance).
 * Static reference text in level bands; no "seen" flag — reopens unchanged
 * every time. Pure presenter: strings pre-translated by the container.
 */
export function PlacementGuidanceSheet({
  visible,
  strings,
  onClose,
}: {
  visible: boolean;
  strings: PlacementGuidanceStrings;
  onClose: () => void;
}): React.JSX.Element {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet} accessibilityViewIsModal>
          <ScrollView contentContainerStyle={styles.content}>
            <Text style={styles.title} accessibilityRole="header">
              {strings.title}
            </Text>
            <Text style={styles.body}>{strings.intro}</Text>
            {strings.bands.map((band) => (
              <View key={band.title} style={styles.band}>
                <Text style={styles.bandTitle}>{band.title}</Text>
                <Text style={styles.body}>{band.body}</Text>
              </View>
            ))}
            <Text style={styles.tip}>{strings.tip}</Text>
          </ScrollView>
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel={strings.close}
            style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
          >
            <Text style={styles.closeLabel}>{strings.close}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  sheet: {
    width: '100%',
    maxWidth: 520,
    maxHeight: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
  },
  content: {
    padding: 20,
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  band: {
    borderStartWidth: 4,
    borderStartColor: '#2563EB',
    paddingStart: 10,
    gap: 2,
  },
  bandTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  body: {
    fontSize: 15,
    lineHeight: 21,
    color: '#374151',
  },
  tip: {
    fontSize: 14,
    lineHeight: 20,
    color: '#4B5563',
    fontStyle: 'italic',
  },
  closeButton: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#D1D5DB',
  },
  closeLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2563EB',
  },
  pressed: {
    opacity: 0.55,
  },
});
