import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { rnStorage } from './rnStorage';

export type ProgressKey = string;

export type ProgressEntry = {
  points: number;
  trackerCount: number;
  checked12Trackers: boolean;
  lastPlayed: number; // epoch ms
};

const DEFAULT_ENTRY: ProgressEntry = {
  points: 0,
  trackerCount: 0,
  checked12Trackers: false,
  lastPlayed: 0,
};

type ProgressState = {
  progress: Record<ProgressKey, ProgressEntry>;
};

type ProgressActions = {
  incrementPoints: (key: ProgressKey, delta: number) => void;
  incrementTracker: (key: ProgressKey) => void;
  markChecked12: (key: ProgressKey) => void;
  resetGame: (key: ProgressKey) => void;
};

function getEntry(
  progress: Record<ProgressKey, ProgressEntry>,
  key: ProgressKey,
): ProgressEntry {
  return progress[key] ?? { ...DEFAULT_ENTRY };
}

export const useProgressStore = create<ProgressState & ProgressActions>()(
  persist(
    (set) => ({
      progress: {},

      incrementPoints(key, delta) {
        set((state) => {
          const entry = getEntry(state.progress, key);
          return {
            progress: {
              ...state.progress,
              [key]: {
                ...entry,
                points: Math.max(0, entry.points + delta),
                lastPlayed: Date.now(),
              },
            },
          };
        });
      },

      incrementTracker(key) {
        set((state) => {
          const entry = getEntry(state.progress, key);
          return {
            progress: {
              ...state.progress,
              [key]: {
                ...entry,
                trackerCount: entry.trackerCount + 1,
                lastPlayed: Date.now(),
              },
            },
          };
        });
      },

      markChecked12(key) {
        set((state) => {
          const entry = getEntry(state.progress, key);
          return {
            progress: {
              ...state.progress,
              [key]: {
                ...entry,
                checked12Trackers: true,
                lastPlayed: Date.now(),
              },
            },
          };
        });
      },

      resetGame(key) {
        set((state) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { [key]: _removed, ...rest } = state.progress;
          return { progress: rest };
        });
      },
    }),
    {
      name: 'alphaTiles.progress.v1',
      storage: rnStorage,
      version: 1,
    },
  ),
);

export function useProgressEntry(key: ProgressKey): ProgressEntry {
  return useProgressStore(
    (state) => state.progress[key] ?? { ...DEFAULT_ENTRY },
  );
}

export function useTotalPoints(playerId: string): number {
  return useProgressStore((state) =>
    Object.entries(state.progress)
      .filter(([k]) => k.includes(playerId))
      .reduce((sum, [, entry]) => sum + entry.points, 0),
  );
}
