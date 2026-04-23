/**
 * Presenter — pure props → JSX for the name-entry screen.
 * Renders avatar picker, name display, keyboard (custom or system TextInput),
 * inline error, and submit/cancel buttons.
 * No hooks, no i18n, no navigation.
 * See design.md §D5, §D6.
 */
import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { UiAvatarGrid } from '@shared/ui-avatar-grid';
import { UiCustomKeyboard } from '@shared/ui-custom-keyboard';
import type { KeyEntry } from '@shared/ui-custom-keyboard';

export type SetPlayerNameScreenProps = {
  /** Current name value. */
  name: string;
  /** Validation error string (empty = no error). */
  error: string;
  /** Array of avatar require-ids for the picker. */
  avatars: number[];
  /** 0-based index of the currently-selected avatar. */
  selectedAvatarIndex: number;
  /** Keys from aa_keyboard.txt. Empty array → fall back to TextInput. */
  keys: KeyEntry[];
  placeholder: string;
  submitLabel: string;
  cancelLabel: string;
  /** Called when an avatar is tapped in the picker. */
  onPickAvatar: (index: number) => void;
  /** Custom keyboard: appends a character. */
  onKey: (text: string) => void;
  /** Custom keyboard: removes last character. */
  onBackspace: () => void;
  /** TextInput fallback: full replacement. */
  onChangeText: (text: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  a11y: {
    avatarGrid: (idx: number) => string;
    keyboardDelete: string;
    keyboardNext: string;
    keyboardPrev: string;
  };
};

export function SetPlayerNameScreen({
  name,
  error,
  avatars,
  selectedAvatarIndex,
  keys,
  placeholder,
  submitLabel,
  cancelLabel,
  onPickAvatar,
  onKey,
  onBackspace,
  onChangeText,
  onSubmit,
  onCancel,
  a11y,
}: SetPlayerNameScreenProps): React.JSX.Element {
  const useCustomKeyboard = keys.length > 0;

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      {/* Avatar picker */}
      <UiAvatarGrid
        avatars={avatars}
        selectedIndex={selectedAvatarIndex}
        onPick={onPickAvatar}
        a11yLabel={a11y.avatarGrid}
      />

      {/* Name display / text input */}
      {useCustomKeyboard ? (
        <Text
          style={[styles.nameDisplay, !name && styles.placeholder]}
          accessibilityRole="text"
          accessibilityLabel={name || placeholder}
        >
          {name || placeholder}
        </Text>
      ) : (
        <TextInput
          value={name}
          onChangeText={onChangeText}
          placeholder={placeholder}
          maxLength={20}
          style={styles.textInput}
          accessibilityLabel={placeholder}
          autoFocus
          returnKeyType="done"
          onSubmitEditing={onSubmit}
        />
      )}

      {/* Inline validation error */}
      {error !== '' && (
        <Text style={styles.error} accessibilityRole="alert">
          {error}
        </Text>
      )}

      {/* Custom keyboard */}
      {useCustomKeyboard && (
        <UiCustomKeyboard
          keys={keys}
          onKey={onKey}
          onBackspace={onBackspace}
          a11y={{
            delete: a11y.keyboardDelete,
            next: a11y.keyboardNext,
            prev: a11y.keyboardPrev,
          }}
        />
      )}

      {/* Footer buttons */}
      <View style={styles.footer}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={cancelLabel}
          style={styles.cancelButton}
          onPress={onCancel}
        >
          <Text style={styles.cancelText}>{cancelLabel}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={submitLabel}
          style={styles.submitButton}
          onPress={onSubmit}
        >
          <Text style={styles.submitText}>{submitLabel}</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 12,
  },
  nameDisplay: {
    fontSize: 24,
    textAlign: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#333',
    minHeight: 44,
  },
  placeholder: {
    color: '#999',
  },
  textInput: {
    fontSize: 24,
    textAlign: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#333',
    minHeight: 44,
  },
  error: {
    color: '#cc0000',
    textAlign: 'center',
    fontSize: 14,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#eee',
    borderRadius: 8,
  },
  cancelText: {
    fontSize: 16,
    color: '#333',
  },
  submitButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#333',
    borderRadius: 8,
  },
  submitText: {
    fontSize: 16,
    color: '#fff',
  },
});
