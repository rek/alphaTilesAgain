/**
 * Pure presenter for the Share screen.
 *
 * Accepts all strings, flags, and callbacks as props.
 * No hooks, no i18n, no asset imports.
 *
 * QR code rendered via react-native-qrcode-svg (SVG, works on iOS/Android/web).
 * Size: 256px default, responsive to screen width via useWindowDimensions.
 *
 * Design decisions: D2 (QR library), D4 (share mechanism), D11 (a11y).
 */

import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';

export interface ShareScreenProps {
  /** Called when user taps the back button */
  onBack: () => void;
  /** Whether the share URL is available (false = render unavailable message) */
  available: boolean;
  /** The share URL to encode in QR code and pass to native share sheet */
  url: string;
  /** Translated instruction text: "Scan this QR code to share this app" */
  instructions: string;
  /** Translated share button label: "Share via..." */
  shareButtonLabel: string;
  /** Translated QR code accessibility label: "QR code linking to the Play Store" */
  qrAltLabel: string;
  /** Translated unavailable message: "Sharing not configured for this pack" */
  unavailableMessage: string;
  /** Called when user taps the share button */
  onShareTap: () => void;
}

const HIT_SLOP = { top: 10, bottom: 10, start: 10, end: 10 };

export function ShareScreen(props: ShareScreenProps): React.JSX.Element {
  const {
    onBack,
    available,
    url,
    instructions,
    shareButtonLabel,
    qrAltLabel,
    unavailableMessage,
    onShareTap,
  } = props;

  const { width } = useWindowDimensions();
  // QR size: 2/3 of screen width, mirroring Java Share.java, clamped 192–320
  const qrSize = Math.min(320, Math.max(192, Math.floor((width * 2) / 3)));

  const backButton = (
    <Pressable onPress={onBack} accessibilityRole="button" style={styles.backButton}>
      <Text style={styles.backArrow}>{'←'}</Text>
    </Pressable>
  );

  if (!available) {
    return (
      <View style={styles.outerContainer}>
        {backButton}
        <View style={styles.centerContainer}>
          <Text style={styles.unavailable}>{unavailableMessage}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.outerContainer}>
      {backButton}
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <Text style={styles.instructions}>{instructions}</Text>

      <View
        accessibilityRole="image"
        accessibilityLabel={qrAltLabel}
        style={styles.qrWrapper}
      >
        <QRCode value={url} size={qrSize} />
      </View>

      <Pressable
        onPress={onShareTap}
        accessibilityRole="button"
        accessibilityLabel={shareButtonLabel}
        hitSlop={HIT_SLOP}
        style={styles.shareButton}
      >
        <Text style={styles.shareButtonText}>{shareButtonLabel}</Text>
      </Pressable>
    </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
  },
  backButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  backArrow: {
    fontSize: 24,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    alignItems: 'center',
    gap: 20,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  unavailable: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  instructions: {
    fontSize: 16,
    textAlign: 'center',
  },
  qrWrapper: {
    padding: 8,
    backgroundColor: '#fff',
  },
  shareButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#0066CC',
    borderRadius: 8,
  },
  shareButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
