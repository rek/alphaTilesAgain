/**
 * Zustand store for per-player preferences (settings screen, #44).
 * Persisted via AsyncStorage (ADR-005), one entry per player id.
 *
 * Preferences are SPARSE: an unset field means "use the pack default".
 * Never read this store to decide behaviour directly — go through
 * `useEffectiveSettings` (@alphaTiles/data-settings), which layers these
 * over the pack's aa_settings.txt values.
 *
 * Persist key: 'alphatiles:player-preferences-v1'.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { rnStorage } from './rnStorage';

/** Player-overridable settings. Add a field here + in effectiveSettingsOf. */
export type PlayerPreferences = {
  /** Show game names on menu doors (off = colour-only doors for younger learners). */
  showGameNames?: boolean;
};

type PreferencesState = {
  byPlayer: Record<string, PlayerPreferences>;
};

type PreferencesActions = {
  /** Merge `patch` into the player's preferences. */
  setPreference: (playerId: string, patch: PlayerPreferences) => void;
  /** Forget every preference of the player (called on deletePlayer). */
  clearPlayer: (playerId: string) => void;
};

export const usePlayerPreferencesStore = create<PreferencesState & PreferencesActions>()(
  persist(
    (set) => ({
      byPlayer: {},

      setPreference(playerId, patch) {
        set((state) => ({
          byPlayer: {
            ...state.byPlayer,
            [playerId]: { ...state.byPlayer[playerId], ...patch },
          },
        }));
      },

      clearPlayer(playerId) {
        set((state) => {
          const rest = { ...state.byPlayer };
          delete rest[playerId];
          return { byPlayer: rest };
        });
      },
    }),
    {
      name: 'alphatiles:player-preferences-v1',
      storage: rnStorage,
      version: 1,
    },
  ),
);
