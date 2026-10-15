import { useMemo } from 'react';
import { useLangAssets } from '@alphaTiles/data-language-assets';
import { useActivePlayer, usePlayerPreferences } from '@alphaTiles/data-players';
import { effectiveSettingsOf } from './effectiveSettingsOf';

/**
 * Effective settings for the active player: pack aa_settings.txt + the
 * player's preferences (see `effectiveSettingsOf`). Without an active player,
 * pack values only. Re-renders when the player changes a preference.
 */
export function useEffectiveSettings() {
  const { settings } = useLangAssets();
  const player = useActivePlayer();
  const preferences = usePlayerPreferences(player?.id ?? null);
  return useMemo(() => effectiveSettingsOf({ settings, preferences }), [settings, preferences]);
}
