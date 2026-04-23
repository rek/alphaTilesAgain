/**
 * Container — owns hooks, translation, navigation, validation, store writes.
 * Reads query params to determine create vs edit mode.
 * No direct useEffect — all state managed via useState handlers.
 * See design.md §D4, §D5, §D6, §D8.
 */
import React, { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from '@shared/util-i18n';
import { useLangAssets } from '@alphaTiles/data-language-assets';
import { usePlayersStore, usePlayers } from '@alphaTiles/data-players';
import { track } from '@shared/util-analytics';
import { SetPlayerNameScreen } from './SetPlayerNameScreen';
import type { KeyEntry } from '@shared/ui-custom-keyboard';

const MAX_NAME_LENGTH = 20;

export function SetPlayerNameContainer(): React.JSX.Element {
  const router = useRouter();
  const { t } = useTranslation('chrome');
  const assets = useLangAssets();
  const players = usePlayers();
  const { createPlayer, renamePlayer, selectPlayer } = usePlayersStore.getState();

  // Query params: mode=create|edit, id=<uuid> (edit only), avatarIndex=<n> (create default)
  const params = useLocalSearchParams<{
    mode?: string;
    id?: string;
    avatarIndex?: string;
  }>();

  const mode = params.mode === 'edit' ? 'edit' : 'create';
  const editingPlayer =
    mode === 'edit' && params.id
      ? players.find((p) => p.id === params.id)
      : undefined;

  // Avatar initial value: edit → player's current avatar; create → query param or 0
  const initialAvatarIndex = editingPlayer?.avatarIndex
    ?? (params.avatarIndex !== undefined ? parseInt(params.avatarIndex, 10) : 0);

  // Name initial value: edit → existing name; create with custom → first unused name; else empty
  function getInitialName(): string {
    if (mode === 'edit' && editingPlayer) return editingPlayer.name;
    const nameInLocalLang = assets.langInfo.find('NAME in local language') ?? '';
    if (nameInLocalLang.toLowerCase() === 'custom') {
      const usedNames = new Set(players.map((p) => p.name));
      const unusedName = assets.names.rows.find((r) => !usedNames.has(r.name));
      return unusedName?.name ?? '';
    }
    return '';
  }

  const [name, setName] = useState(getInitialName);
  const [selectedAvatarIndex, setSelectedAvatarIndex] = useState(initialAvatarIndex);
  const [error, setError] = useState('');

  // Build keys array from keyboard + colors
  const keys: KeyEntry[] = assets.keys.rows.map((k) => ({
    text: k.key,
    colorHex: assets.colors.hexByIndex[parseInt(k.color, 10)] ?? '#e0e0e0',
  }));

  function handleKey(char: string) {
    if (name.length < MAX_NAME_LENGTH) {
      setName((prev) => prev + char);
      setError('');
    }
  }

  function handleBackspace() {
    setName((prev) => (prev.length > 0 ? prev.slice(0, -1) : prev));
    setError('');
  }

  function handleChangeText(text: string) {
    setName(text.slice(0, MAX_NAME_LENGTH));
    setError('');
  }

  function handleSubmit() {
    const trimmed = name.trim();

    if (trimmed.length < 1) {
      setError(t('players.validation.too_short'));
      return;
    }
    if (trimmed.length > MAX_NAME_LENGTH) {
      setError(t('players.validation.too_long'));
      return;
    }

    // Duplicate check — exclude the editing player from the comparison
    const duplicate = players.some(
      (p) =>
        p.name === trimmed &&
        (mode === 'create' || p.id !== editingPlayer?.id),
    );
    if (duplicate) {
      setError(t('players.validation.duplicate'));
      return;
    }

    if (mode === 'create') {
      const newPlayer = createPlayer({ name: trimmed, avatarIndex: selectedAvatarIndex });
      track('player_created', { avatarIndex: selectedAvatarIndex });
      selectPlayer(newPlayer.id);
    } else if (editingPlayer) {
      renamePlayer(editingPlayer.id, trimmed);
      track('player_renamed', {});
      selectPlayer(editingPlayer.id);
    }

    router.replace('/menu' as Parameters<typeof router.replace>[0]);
  }

  function handleCancel() {
    router.back();
  }

  const rawCount = assets.settings.findInt('Number of avatars', 12);
  const avatarCount = Math.min(12, Math.max(1, rawCount));
  const avatars = assets.images.avataricons.slice(0, avatarCount);

  return (
    <SetPlayerNameScreen
      name={name}
      error={error}
      avatars={avatars}
      selectedAvatarIndex={selectedAvatarIndex}
      keys={keys}
      placeholder={t('players.name_placeholder')}
      submitLabel={t('players.name_submit')}
      cancelLabel={t('back')}
      onPickAvatar={setSelectedAvatarIndex}
      onKey={handleKey}
      onBackspace={handleBackspace}
      onChangeText={handleChangeText}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      a11y={{
        avatarGrid: (idx: number) => t('players.a11y.avatar', { index: idx + 1 }),
        keyboardDelete: t('players.a11y.keyboard_delete'),
        keyboardNext: t('players.a11y.keyboard_next'),
        keyboardPrev: t('players.a11y.keyboard_prev'),
      }}
    />
  );
}
