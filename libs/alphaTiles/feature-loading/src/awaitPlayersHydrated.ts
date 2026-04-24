import { usePlayersStore } from '@alphaTiles/data-players';

export function awaitPlayersHydrated(): Promise<void> {
  if (usePlayersStore.persist.hasHydrated()) return Promise.resolve();
  return new Promise<void>((resolve) => {
    const unsub = usePlayersStore.persist.onFinishHydration(() => {
      unsub();
      resolve();
    });
  });
}
