/**
 * Pure presenter for the Resources screen.
 *
 * Accepts all strings, flags, and callbacks as props.
 * No hooks, no i18n, no asset imports.
 *
 * Renders a scrollable FlatList of tappable resource entries (no pagination).
 * Empty state shows the chrome:resources.empty string centered.
 *
 * Design decisions: D11 (a11y — all links have role+label+hitSlop).
 * Out of scope: thumbnail images (stored on row model, not rendered in v1).
 */

import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

export interface ResourceRow {
  name: string;
  link: string;
  /** Stored for future use; not rendered in v1 */
  image: string;
}

export interface ResourcesScreenProps {
  /** Called when user taps the back button */
  onBack: () => void;
  /** Whether the resources list is empty */
  isEmpty: boolean;
  /** Parsed resource rows (name + link; image stored but not rendered) */
  resources: ResourceRow[];
  /** Translated empty-state message: "No resources available" */
  emptyMessage: string;
  /** Called when user taps a resource entry; receives the entry's URL */
  onResourceTap: (url: string) => void;
}

const HIT_SLOP = { top: 10, bottom: 10, start: 10, end: 10 };

export function ResourcesScreen(props: ResourcesScreenProps): React.JSX.Element {
  const { onBack, isEmpty, resources, emptyMessage, onResourceTap } = props;

  const backButton = (
    <Pressable onPress={onBack} accessibilityRole="button" style={styles.backButton}>
      <Text style={styles.backArrow}>{'←'}</Text>
    </Pressable>
  );

  if (isEmpty) {
    return (
      <View style={styles.container}>
        {backButton}
        <View style={styles.centerContainer}>
          <Text style={styles.emptyMessage}>{emptyMessage}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {backButton}
    <FlatList
      data={resources}
      keyExtractor={(item, index) => `${index}-${item.link}`}
      contentContainerStyle={styles.listContent}
      renderItem={({ item }) => (
        <Pressable
          onPress={() => { onResourceTap(item.link); }}
          accessibilityRole="link"
          accessibilityLabel={item.name}
          hitSlop={HIT_SLOP}
          style={styles.resourceItem}
        >
          <Text style={styles.resourceText}>{item.name}</Text>
        </Pressable>
      )}
    />
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
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  listContent: {
    padding: 16,
    gap: 8,
  },
  resourceItem: {
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ccc',
  },
  resourceText: {
    fontSize: 16,
    color: '#0066CC',
    textDecorationLine: 'underline',
  },
});
