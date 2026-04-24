import { useShallow } from 'zustand/react/shallow';
import { useProgressStore } from '@alphaTiles/data-progress';

export function useTrackerCounts(playerId: string | null): Record<string, number> {
  return useProgressStore(
    useShallow((state) => {
      if (!playerId) return {};
      const result: Record<string, number> = {};
      for (const [key, entry] of Object.entries(state.progress)) {
        if (key.includes(playerId)) {
          result[key] = entry.trackerCount;
        }
      }
      return result;
    }),
  );
}
