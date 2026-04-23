/**
 * Minimal fallback screen rendered by LangAssetsProvider when boot fails.
 *
 * Deliberately unstyled — pack is broken so theming is unavailable.
 * No i18n — translations can't load if the pack failed.
 * No retry — pack errors are deterministic; fix requires a rebuild.
 *
 * Sets accessibilityLiveRegion="assertive" so screen readers announce the failure.
 *
 * See design.md §D4 and §D8.
 */

import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { LangAssetsBindError } from '@alphaTiles/data-language-pack';
import { LangPackParseError } from '@shared/util-lang-pack-parser';

type Props = {
  error: Error;
};

function formatError(error: Error): string {
  if (error instanceof LangPackParseError) {
    const parts: string[] = [
      `Parse error in ${error.file}, line ${error.line}`,
    ];
    if (error.column !== undefined) parts.push(`column "${error.column}"`);
    if (error.reason !== undefined) parts.push(error.reason);
    return parts.join(' — ');
  }
  if (error instanceof LangAssetsBindError) {
    return (
      `Pack asset missing: ${error.category} — key "${error.key}". ` +
      'This is a build-pipeline bug; the validator should have caught this.'
    );
  }
  return error.message;
}

export function ErrorScreen({ error }: Props): React.JSX.Element {
  return (
    <View
      style={styles.container}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      accessibilityLiveRegion={'assertive' as any}
      accessibilityRole="alert"
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Language pack failed to load</Text>
        <Text style={styles.errorName}>{error.name}</Text>
        <Text style={styles.errorMessage}>{formatError(error)}</Text>
        <Text style={styles.hint}>
          Restart the app after fixing the language pack. If this is a
          production build, contact the app maintainer.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  errorName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#c00',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    fontFamily: 'monospace',
    marginBottom: 16,
  },
  hint: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
});
