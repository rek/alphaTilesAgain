/**
 * Presenter — pure props → JSX. No hooks, no i18n, no navigation.
 * Renders the player selection grid: existing players + an "add" slot.
 * See design.md §D8 (container/presenter split).
 */
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { UiPlayerCard } from '@shared/ui-player-card';
import type { DeleteState } from '@shared/ui-player-card';

export type PlayerCardData = {
  id: string;
  avatar: number;
  name: string;
  deleteState: DeleteState;
};

export type ChoosePlayerScreenProps = {
  /** Heading string from langInfo (nameInLocalLang). */
  heading: string;
  players: PlayerCardData[];
  /** Total slot count (avatarCount clamped 1-12). */
  avatarCount: number;
  onSelectPlayer: (id: string) => void;
  onAddPlayer: () => void;
  onRequestDelete: (id: string) => void;
  onConfirmDelete: (id: string) => void;
  /** Label for the "add new player" slot. */
  addLabel: string;
  a11y: {
    selectPlayer: (name: string) => string;
    delete: string;
    confirmDelete: string;
  };
};

export function ChoosePlayerScreen({
  heading,
  players,
  avatarCount,
  onSelectPlayer,
  onAddPlayer,
  onRequestDelete,
  onConfirmDelete,
  addLabel,
  a11y,
}: ChoosePlayerScreenProps): React.JSX.Element {
  const emptySlots = Math.max(0, avatarCount - players.length - 1);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>{heading}</Text>
      <View style={styles.grid}>
        {players.map((p) => (
          <UiPlayerCard
            key={p.id}
            avatar={p.avatar}
            name={p.name}
            deleteState={p.deleteState}
            onSelect={() => onSelectPlayer(p.id)}
            onRequestDelete={() => onRequestDelete(p.id)}
            onDeletePress={() => onConfirmDelete(p.id)}
            a11y={{
              select: a11y.selectPlayer(p.name),
              delete: a11y.delete,
              confirmDelete: a11y.confirmDelete,
            }}
          />
        ))}
        {/* Add player slot */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={addLabel}
          style={styles.addSlot}
          onPress={onAddPlayer}
        >
          <Text style={styles.addIcon}>{'+'}</Text>
          <Text style={styles.addLabel}>{addLabel}</Text>
        </Pressable>
        {/* Empty disabled slots */}
        {Array.from({ length: emptySlots }).map((_, i) => (
          <View key={`empty-${i}`} style={styles.emptySlot} />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  addSlot: {
    width: '25%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#999',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 8,
  },
  addIcon: {
    fontSize: 28,
    color: '#666',
  },
  addLabel: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
  },
  emptySlot: {
    width: '25%',
    aspectRatio: 1,
    opacity: 0.2,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    margin: 2,
  },
});
