import { useCallback } from 'react';
import { useActivePlayer, usePlayerPreferencesStore } from '@alphaTiles/data-players';
import type { PlayerPreferences } from '@alphaTiles/data-players';

/** Setter for the active player's preferences; no-op without an active player. */
export function useSetPreference() {
  const playerId = useActivePlayer()?.id ?? null;
  return useCallback(
    (patch: PlayerPreferences) => {
      if (playerId === null) return;
      usePlayerPreferencesStore.getState().setPreference(playerId, patch);
    },
    [playerId],
  );
}
