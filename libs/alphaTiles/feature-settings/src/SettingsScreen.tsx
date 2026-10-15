/**
 * Pure presenter for the Settings screen (#44).
 * Strings, values and callbacks come from SettingsContainer.
 */
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export type SettingsScreenProps = {
  title: string;
  backLabel: string;
  onBack: () => void;
  /** "Show game names on doors" toggle. */
  showGameNames: boolean;
  showGameNamesLabel: string;
  showGameNamesHint: string;
  onShowGameNamesChange: (value: boolean) => void;
  /** "Send feedback" row (#41); only when the pack has a real contact email. */
  showFeedback: boolean;
  feedbackLabel: string;
  feedbackHint: string;
  onFeedback: () => void;
};

const HIT_SLOP = { top: 10, bottom: 10, start: 10, end: 10 };

export function SettingsScreen({
  title,
  backLabel,
  onBack,
  showGameNames,
  showGameNamesLabel,
  showGameNamesHint,
  onShowGameNamesChange,
  showFeedback,
  feedbackLabel,
  feedbackHint,
  onFeedback,
}: SettingsScreenProps): React.JSX.Element {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel={backLabel}
          hitSlop={HIT_SLOP}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={28} color="#1F2937" />
        </Pressable>
        <Text style={styles.title} accessibilityRole="header">
          {title}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Pressable
          onPress={() => onShowGameNamesChange(!showGameNames)}
          accessibilityRole="switch"
          accessibilityLabel={showGameNamesLabel}
          accessibilityHint={showGameNamesHint}
          accessibilityState={{ checked: showGameNames }}
          style={styles.row}
        >
          <View style={styles.rowText}>
            <Text style={styles.rowLabel}>{showGameNamesLabel}</Text>
            <Text style={styles.rowHint}>{showGameNamesHint}</Text>
          </View>
          <Switch
            value={showGameNames}
            onValueChange={onShowGameNamesChange}
            accessibilityElementsHidden
            importantForAccessibility="no"
            testID="toggle-show-game-names"
          />
        </Pressable>

        {showFeedback ? (
          <Pressable
            onPress={onFeedback}
            accessibilityRole="link"
            accessibilityLabel={feedbackLabel}
            accessibilityHint={feedbackHint}
            style={styles.row}
          >
            <View style={styles.rowText}>
              <Text style={styles.rowLabel}>{feedbackLabel}</Text>
              <Text style={styles.rowHint}>{feedbackHint}</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color="#6B7280" />
          </Pressable>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#D1D5DB',
  },
  backButton: {
    padding: 4,
    marginEnd: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  content: {
    paddingVertical: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 64,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  rowText: {
    flex: 1,
    marginEnd: 12,
  },
  rowLabel: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1F2937',
  },
  rowHint: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
});
