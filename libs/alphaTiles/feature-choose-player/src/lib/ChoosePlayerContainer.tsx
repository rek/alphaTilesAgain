/**
 * Container — owns hooks, translation, navigation, store subscriptions.
 * Passes only plain data and callbacks to ChoosePlayerScreen (presenter).
 * No direct useEffect — delete confirm state managed by useState handlers.
 * See design.md §D8, §D9, ARCHITECTURE.md §3.
 */
import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from '@shared/util-i18n';
import { useLangAssets } from '@alphaTiles/data-language-assets';
import { usePlayersStore, usePlayers } from '@alphaTiles/data-players';
import { track, identify } from '@shared/util-analytics';
import { ChoosePlayerScreen } from './ChoosePlayerScreen';
import type { PlayerCardData } from './ChoosePlayerScreen';
import type { DeleteState } from '@shared/ui-player-card';

const MAX_AVATARS = 12;
const MIN_AVATARS = 1;

/**
 * Per-player delete state tracked locally (UI concern, not store concern).
 * Map: playerId → DeleteState
 */
type DeleteMap = Map<string, DeleteState>;

export function ChoosePlayerContainer(): React.JSX.Element {
  const router = useRouter();
  const { t } = useTranslation('chrome');
  const assets = useLangAssets();
  const players = usePlayers();
  const { selectPlayer } = usePlayersStore.getState();

  const [deleteMap, setDeleteMap] = useState<DeleteMap>(new Map());

  const rawCount = assets.settings.findInt('Number of avatars', MAX_AVATARS);
  const avatarCount = Math.min(MAX_AVATARS, Math.max(MIN_AVATARS, rawCount));

  // Local name — from langInfo "NAME in local language" or fallback "Player"
  const nameInLocalLang =
    assets.langInfo.find('NAME in local language') ?? t('choose_player');

  const playerCards: PlayerCardData[] = players.map((p) => ({
    id: p.id,
    avatar: assets.images.avataricons[Math.min(p.avatarIndex, assets.images.avataricons.length - 1)] ?? 0,
    name: p.name,
    deleteState: (deleteMap.get(p.id) ?? 'idle') as DeleteState,
  }));

  function handleSelectPlayer(id: string) {
    // Cancel any pending delete before selecting
    setDeleteMap(new Map());
    selectPlayer(id);
    identify(id, { avatarIndex: players.find((p) => p.id === id)?.avatarIndex });
    track('screen_viewed', { screenName: 'menu' });
    router.replace('/menu' as Parameters<typeof router.replace>[0]);
  }

  function handleAddPlayer() {
    track('screen_viewed', { screenName: 'set-player-name' });
    router.push('/set-player-name?mode=create' as Parameters<typeof router.push>[0]);
  }

  function handleRequestDelete(id: string) {
    setDeleteMap((prev) => {
      const next = new Map(prev);
      // Toggle: if already armed or confirm, reset; else arm
      const current = prev.get(id) ?? 'idle';
      next.set(id, current === 'idle' ? 'armed' : 'idle');
      return next;
    });
  }

  function handleConfirmDelete(id: string) {
    const state = deleteMap.get(id) ?? 'idle';
    if (state === 'armed') {
      // First tap → move to confirm
      setDeleteMap((prev) => {
        const next = new Map(prev);
        next.set(id, 'confirm');
        return next;
      });
    } else if (state === 'confirm') {
      // Second tap → delete
      usePlayersStore.getState().deletePlayer(id);
      track('player_deleted', {});
      setDeleteMap((prev) => {
        const next = new Map(prev);
        next.delete(id);
        return next;
      });
    }
  }

  return (
    <ChoosePlayerScreen
      heading={nameInLocalLang}
      players={playerCards}
      avatarCount={avatarCount}
      onSelectPlayer={handleSelectPlayer}
      onAddPlayer={handleAddPlayer}
      onRequestDelete={handleRequestDelete}
      onConfirmDelete={handleConfirmDelete}
      addLabel={t('players.add')}
      a11y={{
        selectPlayer: (name: string) => name,
        delete: t('players.a11y.delete'),
        confirmDelete: t('players.delete_confirm'),
      }}
    />
  );
}
