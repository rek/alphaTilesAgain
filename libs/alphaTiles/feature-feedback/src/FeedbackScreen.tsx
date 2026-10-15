/**
 * Pure presenter for the Feedback screen (#41).
 * Strings and callbacks come from FeedbackContainer.
 */
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export type FeedbackScreenProps = {
  title: string;
  backLabel: string;
  onBack: () => void;
  intro: string;
  buttonLabel: string;
  onSend: () => void;
  /** Contact address, shown (selectable) so it can be copied. */
  email: string;
  addressLabel: string;
  /** True when the mail app could not be opened; shows `noMailAppMessage`. */
  mailFailed: boolean;
  noMailAppMessage: string;
};

const HIT_SLOP = { top: 10, bottom: 10, start: 10, end: 10 };

export function FeedbackScreen({
  title,
  backLabel,
  onBack,
  intro,
  buttonLabel,
  onSend,
  email,
  addressLabel,
  mailFailed,
  noMailAppMessage,
}: FeedbackScreenProps): React.JSX.Element {
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
        <Text style={styles.intro}>{intro}</Text>

        <Pressable
          onPress={onSend}
          accessibilityRole="button"
          accessibilityLabel={buttonLabel}
          style={styles.button}
        >
          <Text style={styles.buttonText}>{buttonLabel}</Text>
        </Pressable>

        {mailFailed ? (
          <Text style={styles.error} accessibilityRole="alert">
            {noMailAppMessage}
          </Text>
        ) : null}

        <Text style={styles.addressLabel}>{addressLabel}</Text>
        <Text style={styles.address} selectable>
          {email}
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#D1D5DB',
  },
  backButton: { padding: 4, marginEnd: 8 },
  title: { fontSize: 20, fontWeight: '700', color: '#1F2937' },
  content: { padding: 20, gap: 16 },
  intro: { fontSize: 16, lineHeight: 24, color: '#1F2937' },
  button: {
    minHeight: 48,
    borderRadius: 8,
    backgroundColor: '#0066CC',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  buttonText: { fontSize: 17, fontWeight: '600', color: '#FFFFFF' },
  error: { fontSize: 15, lineHeight: 22, color: '#B91C1C' },
  addressLabel: { fontSize: 14, color: '#6B7280' },
  address: { fontSize: 17, fontWeight: '600', color: '#1F2937' },
});
