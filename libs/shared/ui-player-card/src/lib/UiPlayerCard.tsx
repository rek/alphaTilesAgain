/**
 * Pure presentational player card.
 * Three visual states: idle, armed (trash visible), confirm (red check visible).
 * Long-press → onRequestDelete arms. Tap trash → onConfirmDelete flow starts.
 * No i18n dependency — accepts pre-translated a11y strings.
 * See design.md §D7.
 */
import React from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
} from 'react-native';

export type DeleteState = 'idle' | 'armed' | 'confirm';

export type UiPlayerCardProps = {
  /** Metro require-id for the avatar image. */
  avatar: number;
  /** Player display name. */
  name: string;
  /** Normal tap selects the player. */
  onSelect: () => void;
  /** Long-press fires this; parent moves deleteState from idle→armed. */
  onRequestDelete?: () => void;
  /** Tap on trash/check icon fires this; parent handles state transitions. */
  onDeletePress?: () => void;
  /** Current delete UI state. */
  deleteState: DeleteState;
  a11y: {
    select: string;
    delete: string;
    confirmDelete: string;
  };
};

export function UiPlayerCard({
  avatar,
  name,
  onSelect,
  onRequestDelete,
  onDeletePress,
  deleteState,
  a11y,
}: UiPlayerCardProps): React.JSX.Element {
  const showDeleteIcon = deleteState === 'armed' || deleteState === 'confirm';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={a11y.select}
      style={styles.card}
      onPress={onSelect}
      onLongPress={onRequestDelete}
    >
      <Image
        source={avatar}
        style={styles.avatar}
        accessibilityElementsHidden
        importantForAccessibility="no"
        resizeMode="contain"
      />
      <Text
        style={styles.name}
        numberOfLines={1}
        ellipsizeMode="tail"
        accessibilityElementsHidden
        importantForAccessibility="no"
      >
        {name}
      </Text>
      {showDeleteIcon && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            deleteState === 'confirm' ? a11y.confirmDelete : a11y.delete
          }
          style={[
            styles.deleteButton,
            deleteState === 'confirm' && styles.deleteButtonConfirm,
          ]}
          onPress={(e) => {
            e.stopPropagation?.();
            onDeletePress?.();
          }}
          hitSlop={8}
        >
          <Text
            style={styles.deleteIcon}
            accessibilityElementsHidden
            importantForAccessibility="no"
          >
            {deleteState === 'confirm' ? '✓' : '🗑'}
          </Text>
        </Pressable>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    padding: 8,
    position: 'relative',
  },
  avatar: {
    width: 72,
    height: 72,
  },
  name: {
    marginTop: 4,
    fontSize: 14,
    textAlign: 'center',
    maxWidth: 80,
  },
  deleteButton: {
    position: 'absolute',
    top: 4,
    insetInlineEnd: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonConfirm: {
    backgroundColor: '#cc0000',
  },
  deleteIcon: {
    color: '#fff',
    fontSize: 13,
    lineHeight: 16,
  },
});
