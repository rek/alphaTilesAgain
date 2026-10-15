import { useSyncExternalStore } from 'react';
import { useProgressStore } from './useProgressStore';

const subscribe = (onChange: () => void) =>
  useProgressStore.persist.onFinishHydration(onChange);
const snapshot = () => useProgressStore.persist.hasHydrated();

/**
 * True once the progress store has rehydrated from storage. Read persisted
 * progress at mount (e.g. a resume cursor) only after this — before it, the
 * store is empty and a write would be clobbered by the hydration merge.
 */
export function useProgressHydrated(): boolean {
  return useSyncExternalStore(subscribe, snapshot, snapshot);
}
