import { usePlayerPreferencesStore } from './usePlayerPreferencesStore';
import type { PlayerPreferences } from './usePlayerPreferencesStore';

const NONE: PlayerPreferences = {};

/** The player's sparse preferences (`{}` when none set or no player). */
export function usePlayerPreferences(playerId: string | null) {
  return usePlayerPreferencesStore((state) =>
    playerId === null ? NONE : (state.byPlayer[playerId] ?? NONE),
  );
}
