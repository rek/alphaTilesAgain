# ADR-005: Persistence via Zustand `persist` + AsyncStorage

**Date**: 2026-04-23
**Status**: Accepted

## Context

Mutable runtime state (ADR-004) includes slices that must survive app restart — player list, per-player progress, last-played game, settings toggles. We need a persistence layer that:

- Works identically on iOS, Android, and web (the app targets all three).
- Handles small (KB-range) key-value blobs — we are not storing content, only progress.
- Survives app upgrades without ceremony.
- Integrates with Zustand stores (ADR-004) with minimal glue.
- Has no server / sync component (no backend, ADR-001).

## Decision

Zustand `persist` middleware, backed by `@react-native-async-storage/async-storage`.

- One `persist` config per store — not one monolithic blob. `playerStore`, `progressStore`, each `activeGameStore` slice (if persisted) each have their own storage key.
- AsyncStorage is the single storage driver across native + web.
- No migration code in v1 (no existing users). Future migrations use Zustand's `version` + `migrate` hooks.

## Rationale

Zustand `persist` is the natural fit for Zustand stores — zero boilerplate. AsyncStorage has a uniform cross-platform API (web polyfill uses `localStorage`). The pair gives us one code path that works everywhere with no conditional imports.

### Pros

- Same code on iOS, Android, web. No `.native.ts` / `.web.ts` split.
- Tiny glue: `persist(storeCreator, { name, storage: createJSONStorage(() => AsyncStorage) })`.
- Per-store persist key makes storage inspection trivial — one blob per domain.
- Hydration is awaited by Zustand internally; UI gates on `hasHydrated()`.
- Future migrations have a first-class API (`version`, `migrate`).

### Cons

- AsyncStorage is slower than MMKV (string-serialized JSON vs. native KV). For our data sizes (KB, not MB) this is imperceptible.
- AsyncStorage has a per-key size limit (~6 MB on Android by default). We are orders of magnitude below this.
- No encryption. Player scores aren't secrets; if we ever need encrypted storage, it's a driver swap.

## Alternatives Considered

### Alternative 1: `react-native-mmkv`

Native-only, memory-mapped storage. Substantially faster than AsyncStorage.

- **Why not**: No web support. We would need a web fallback (localStorage wrapper) and a conditional storage driver. Two code paths for KB of data is a bad tradeoff. The perf win is invisible at our scale.

### Alternative 2: `expo-sqlite`

Full SQL database.

- **Why not**: Massive overkill for key-value data. Schema management, migrations, query code — all for a few dozen keys. Reserved for if we ever need relational data (unlikely).

### Alternative 3: Manual AsyncStorage wrappers + `useEffect` hydration

Write our own persistence layer per store.

- **Why not**: Reimplements Zustand `persist`. Introduces `useEffect` we would otherwise avoid (see `docs/CODE_STYLE.md`). Every store becomes a boilerplate copy.

### Alternative 4: Redux Persist

Widely-used, battle-tested.

- **Why not**: Only relevant if we were using Redux. We aren't (ADR-004). The Zustand equivalent is first-class and lighter.

## Consequences

### Positive

- A new persisted store is a three-line diff (wrap in `persist`, add `name`, add `storage`).
- Storage keys live next to the store — discoverable by source search.
- Web build ships with web-storage-backed persistence for free (AsyncStorage uses `localStorage` under the hood on web).

### Negative

- Hydration is async; the initial render may see pre-hydration state. Components that care must check `useStore.persist.hasHydrated()` or block render via the loading screen.
- Write amplification for large stores (entire slice is re-serialized on change). Keep persisted slices small — compute derived state on read, not store it.

### Neutral

- `@react-native-async-storage/async-storage` is added as a dependency. No native linking required under Expo managed workflow.
- Storage can be cleared for dev via `AsyncStorage.clear()` in a dev-only button or script.

## Implementation Notes

- Storage driver (one place, shared):
  ```ts
  import AsyncStorage from '@react-native-async-storage/async-storage';
  import { createJSONStorage } from 'zustand/middleware';
  export const rnStorage = createJSONStorage(() => AsyncStorage);
  ```
- Per-store usage:
  ```ts
  export const usePlayerStore = create<PlayerState>()(
    persist(storeCreator, { name: 'alphatiles:player', storage: rnStorage }),
  );
  ```
- Keys namespaced with `alphatiles:` prefix to avoid collisions if the app ever ships alongside another app on web.
- The root app waits for `useXStore.persist.hasHydrated()` on every persisted store before rendering past the loading screen. Keep this list small and colocated.
- No migration code in v1. When we add one, bump `version` and supply `migrate(persistedState, version) => newState`.
- Clearing persistence in dev: a hidden dev-only button in the debug panel calls `Promise.all(stores.map(s => s.persist.clearStorage()))`.

## References

- `docs/ARCHITECTURE.md` §14 (persistence)
- Zustand `persist` middleware docs
- `@react-native-async-storage/async-storage` docs
- ADR-004 (state management hybrid) — what gets persisted
