/**
 * Pure presenter for the About screen.
 *
 * Accepts all strings, flags, and callbacks as props.
 * No hooks, no i18n, no asset imports — independently testable.
 *
 * Container/presenter split per CLAUDE.md and design.md §D8.
 */

import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

export interface AboutScreenProps {
  /** Called when user taps the back button */
  onBack: () => void;
  /** Translated label: "Version {{version}}" (version already interpolated) */
  versionLabel: string;
  /** Local-language app name (aa_langinfo item 1) */
  localName: string;
  /** Language name + country string, pre-formatted per same/different name logic */
  langPlusCountry: string;
  /** Translated heading: "Credits" */
  creditsHeading: string;
  /** Primary credits text (aa_langinfo item 9) */
  credits: string;
  /** Whether to show the secondary credits block */
  showSecondaryCredits: boolean;
  /** Secondary credits text (aa_langinfo item 14); only rendered when showSecondaryCredits */
  secondaryCredits: string;
  /** Whether to show the email link */
  showEmail: boolean;
  /** Email label text (from chrome:about.email or pack email) */
  emailLabel: string;
  /** Whether to show the privacy policy link */
  showPrivacy: boolean;
  /** Translated label: "Privacy Policy" */
  privacyLabel: string;
  /** Called when user taps the email link */
  onEmailTap: () => void;
  /** Called when user taps the privacy policy link */
  onPrivacyTap: () => void;
}

const HIT_SLOP = { top: 10, bottom: 10, start: 10, end: 10 };

export function AboutScreen(props: AboutScreenProps): React.JSX.Element {
  const {
    onBack,
    versionLabel,
    localName,
    langPlusCountry,
    creditsHeading,
    credits,
    showSecondaryCredits,
    secondaryCredits,
    showEmail,
    emailLabel,
    showPrivacy,
    privacyLabel,
    onEmailTap,
    onPrivacyTap,
  } = props;

  return (
    <View style={styles.container}>
      <Pressable onPress={onBack} accessibilityRole="button" style={styles.backButton}>
        <Text style={styles.backArrow}>{'←'}</Text>
      </Pressable>
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
    >
      <Text style={styles.appName}>{localName}</Text>
      <Text style={styles.langPlusCountry}>{langPlusCountry}</Text>
      <Text style={styles.version}>{versionLabel}</Text>

      <Text style={styles.creditsHeading}>{creditsHeading}</Text>
      <Text
        style={styles.credits}
        accessibilityRole="text"
      >
        {credits}
      </Text>

      {showSecondaryCredits ? (
        <Text
          style={styles.credits}
          accessibilityRole="text"
        >
          {secondaryCredits}
        </Text>
      ) : null}

      {showEmail ? (
        <Pressable
          onPress={onEmailTap}
          accessibilityRole="link"
          accessibilityLabel={emailLabel}
          hitSlop={HIT_SLOP}
        >
          <Text style={styles.link}>{emailLabel}</Text>
        </Pressable>
      ) : null}

      {showPrivacy ? (
        <Pressable
          onPress={onPrivacyTap}
          accessibilityRole="link"
          accessibilityLabel={privacyLabel}
          hitSlop={HIT_SLOP}
        >
          <Text style={styles.link}>{privacyLabel}</Text>
        </Pressable>
      ) : null}
    </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  backArrow: {
    fontSize: 24,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 20,
    gap: 12,
  },
  appName: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  langPlusCountry: {
    fontSize: 16,
    color: '#555',
  },
  version: {
    fontSize: 14,
    color: '#888',
  },
  creditsHeading: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 12,
  },
  credits: {
    fontSize: 14,
    lineHeight: 20,
  },
  link: {
    fontSize: 16,
    color: '#0066CC',
    textDecorationLine: 'underline',
  },
});
