import { usePlayersStore } from '@alphaTiles/data-players';

// zustand `persist` never fires onFinishHydration when storage getItem rejects
// (e.g. native AsyncStorage module missing). Cap the wait so boot can't hang forever.
// Generous: a slow (not failed) low-end Android cold start must hydrate before
// boot routes, or a late merge overwrites a player created on choose-player.
const HYDRATION_TIMEOUT_MS = 15_000;

export function awaitPlayersHydrated(timeoutMs = HYDRATION_TIMEOUT_MS): Promise<void> {
  if (usePlayersStore.persist.hasHydrated()) return Promise.resolve();
  return new Promise<void>((resolve) => {
    const finish = () => {
      clearTimeout(timer);
      unsub();
      resolve();
    };
    const timer = setTimeout(() => {
      console.warn(`[loading] players store not hydrated after ${timeoutMs}ms; continuing`);
      finish();
    }, timeoutMs);
    const unsub = usePlayersStore.persist.onFinishHydration(finish);
  });
}
