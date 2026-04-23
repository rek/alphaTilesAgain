# ADR-004: State Management — Context + Zustand Hybrid

**Date**: 2026-04-23
**Status**: Accepted

## Context

AlphaTiles runtime state has two distinct shapes:

1. **Boot-immutable data** — everything loaded once from the language pack at startup. Tile / word / syllable lists, language metadata, settings, colors, pre-resolved audio handles, image `require()` refs, fonts, precompute outputs. Never mutated after boot. Consumed by nearly every screen.

2. **Mutable runtime state** — active player, per-game progress, in-flight game state (current round, score, tracker counts, answer history). Changes frequently during gameplay. Subset persists across launches.

These two shapes have different update patterns, different re-render sensitivities, and different persistence requirements. A single state primitive forces tradeoffs that hurt one or the other.

## Decision

- **React Context providers** for boot-immutable data — `LangAssetsProvider` exposes the pack data, audio handles, image requires, fonts, precompute cache. Value is set once after boot; never updated.
- **Zustand stores** for mutable state — one store per domain (`playerStore`, `progressStore`, `activeGameStore`, …). Each owns its slice, its own selectors, its own persist config (see ADR-005).

Rule of thumb: **if it can change at runtime, it's in Zustand. If it's fixed at boot, it's in Context.**

## Rationale

Context is ideal for rarely-changing wide-fan-out data — exactly the boot-immutable profile. Zustand is ideal for high-frequency mutations with granular subscription — exactly the game-state profile. Using each where it shines avoids Context's re-render pitfall on mutation and avoids Zustand's boilerplate for data that never changes.

### Pros

- Context value is stable (set once), so every consumer re-render is a genuine consumer change — no provider-triggered re-renders.
- Zustand's selector-based subscriptions mean a score update re-renders the score HUD and nothing else.
- Clear mental model: "is this mutable?" answers "where does it live?"
- Domain-sliced Zustand stores keep each concern local — no god-store.
- Persist per store (ADR-005), not per blob — easier to reason about migrations later.

### Cons

- Two primitives, two import styles, two test-setup patterns.
- Newcomers must learn the rule to place state correctly.
- Crossing the boundary (e.g. mutable state that reads immutable config) requires a selector that pulls from both — slight ceremony.

## Alternatives Considered

### Alternative 1: Pure Context (everything, mutable and immutable)

Wrap every stateful slice in a Context; use `useReducer` inside.

- **Why not**: Every setState in a Context re-renders every consumer. For a per-frame game-state slice that dozens of components read, that's a performance cliff. Granular context-splitting solves it but at the cost of extreme provider-tree depth.

### Alternative 2: Pure Zustand (everything, mutable and immutable)

One store for pack assets, one for player, one for game, all Zustand.

- **Why not**: Overkill for read-only boot data. The pack-asset store would have a single action (`init`) called once at boot, then every consumer uses selectors to pick off static values. That's a Context with extra steps. Also awkward that the asset store can't be safely used until hydration completes — Context's "provider renders children when ready" pattern is cleaner.

### Alternative 3: Redux Toolkit

Single global store, slice reducers, RTK Query for async.

- **Why not**: We don't have server state (no backend) so RTK Query's core value is absent. The reducer/action boilerplate per slice is higher than Zustand's `create()` API. No async thunks needed. Not chosen for verbosity without corresponding benefit.

### Alternative 4: Jotai

Atomic state with derived atoms, suspense-friendly.

- **Why not**: Atoms are an elegant fit for fine-grained reactivity, but the ecosystem is smaller and persistence is less ergonomic than Zustand's `persist` middleware. Zustand's domain-store model maps more cleanly to the Android original's `RefAct.java` / `Util` globals we're porting from.

## Consequences

### Positive

- `LangAssetsProvider` is a boot gate — the tree renders only once assets are resolved, eliminating "is this loaded yet?" branches in feature code.
- Each Zustand store is independently testable: import the hook, run actions, assert state.
- Persistence (ADR-005) attaches to Zustand stores cleanly; Context has no persistence concern.

### Negative

- Contributors must internalize the rule. Code review catches violations (mutable-in-context, static-in-zustand).
- A cross-boundary selector (e.g. "current word's audio handle") reads Zustand for the active word id and Context for the handle map. Two hooks in one component is fine but adds a line.

### Neutral

- `libs/alphaTiles/data-lang-assets` (type: `data-access`) owns `LangAssetsProvider`.
- `libs/alphaTiles/data-<domain>` owns each Zustand store.
- ESLint boundary rules apply unchanged — `type:ui` can consume either, but cannot own one.

## Implementation Notes

- Provider order: `LangAssetsProvider` wraps everything (all downstream code assumes assets are present). Zustand stores require no provider.
- Every Zustand store exports:
  - A `useXStore` hook
  - Typed selectors (`useActivePlayer`, `useScore`) that wrap `useXStore(state => state.x)`
  - An `actions` object for dispatch-like calls that don't need component subscription
- Context value is `null` during boot; children are not rendered until it resolves. A loading screen sits above it.
- No `useEffect` sync between Context and Zustand. If mutable state needs a pack value, the component reads both directly.
- Tests for Zustand stores import the hook and call actions — no mock providers needed.
- Tests for Context-consuming components wrap in a minimal `LangAssetsProvider` with a fixture manifest.

## References

- `docs/ARCHITECTURE.md` §6 (runtime data flow), §7 (state management rules)
- ADR-005 (persistence) — Zustand `persist` middleware
- Zustand docs — selector-based subscriptions
- React docs — Context re-render semantics
