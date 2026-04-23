/**
 * Zustand store for player identity — the single source of truth for
 * who is playing. Persisted via AsyncStorage (ADR-005).
 *
 * Persist key: 'alphatiles:players-v1' (versioned per ADR-005).
 * Version: 1 — no migration needed in v1 (no prior data model).
 *
 * See design.md §D2 for surface decisions.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Player } from './Player';
import { rnStorage } from './rnStorage';

type PlayersState = {
  players: Player[];
  activePlayerId: string | null;
};

type PlayersActions = {
  /** Create a new player; returns the new Player so callers can immediately selectPlayer. */
  createPlayer: (input: { name: string; avatarIndex: number }) => Player;
  renamePlayer: (id: string, name: string) => void;
  deletePlayer: (id: string) => void;
  /** Sets activePlayerId and stamps lastPlayedAt = Date.now(). */
  selectPlayer: (id: string) => void;
  clearActivePlayer: () => void;
};

export const usePlayersStore = create<PlayersState & PlayersActions>()(
  persist(
    (set) => ({
      players: [],
      activePlayerId: null,

      createPlayer({ name, avatarIndex }) {
        const newPlayer: Player = {
          id: crypto.randomUUID(),
          name,
          avatarIndex,
          createdAt: Date.now(),
          lastPlayedAt: null,
        };
        set((state) => ({ players: [...state.players, newPlayer] }));
        return newPlayer;
      },

      renamePlayer(id, name) {
        set((state) => ({
          players: state.players.map((p) =>
            p.id === id ? { ...p, name } : p,
          ),
        }));
      },

      deletePlayer(id) {
        set((state) => ({
          players: state.players.filter((p) => p.id !== id),
          activePlayerId:
            state.activePlayerId === id ? null : state.activePlayerId,
        }));
      },

      selectPlayer(id) {
        const now = Date.now();
        set((state) => ({
          activePlayerId: id,
          players: state.players.map((p) =>
            p.id === id ? { ...p, lastPlayedAt: now } : p,
          ),
        }));
      },

      clearActivePlayer() {
        set({ activePlayerId: null });
      },
    }),
    {
      name: 'alphatiles:players-v1',
      storage: rnStorage,
      version: 1,
    },
  ),
);

/**
 * Returns the currently active Player, or null if none selected or the id
 * is stale (player was deleted). Stale ids do NOT auto-clear here — the
 * entry-route logic in _layout.tsx calls clearActivePlayer() on navigation.
 */
export function useActivePlayer(): Player | null {
  return usePlayersStore((state) =>
    state.activePlayerId
      ? (state.players.find((p) => p.id === state.activePlayerId) ?? null)
      : null,
  );
}

/** All players in insertion order. */
export function usePlayers(): Player[] {
  return usePlayersStore((state) => state.players);
}

/** True if any player has been created. */
export function useHasAnyPlayer(): boolean {
  return usePlayersStore((state) => state.players.length > 0);
}
