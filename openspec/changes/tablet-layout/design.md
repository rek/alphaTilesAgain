## Context

All layouts are currently phone-first with no responsive breakpoints. Tablets receive the same single-column layout stretched to full width. The fix is additive: a breakpoint hook drives conditional styles at the container level only.

### Required reading for implementers

- `AGENTS.md`
- `openspec/AGENT_PROTOCOL.md`
- `docs/ARCHITECTURE.md` §3 (taxonomy), §11 (container/presenter)
- `docs/CODE_STYLE.md`
- `docs/PROJECT_ORGANIZATION.md` — `type:util` rules (no React imports beyond hooks; no `feature` imports)
- `libs/shared/util-theme/` — existing `buildTheme`, typography, spacing exports
- `libs/shared/ui-door-grid/` — door grid layout and props
- `libs/alphaTiles/feature-game-shell/` — `GameShellContainer` implementation
- RN Dimensions docs: https://reactnative.dev/docs/dimensions

## Goals / Non-Goals

**Goals:**
- Single `useBreakpoint()` hook, derived from window width with `useMemo`.
- `'phone' | 'tablet'` return type; callers use the string directly.
- Door grid two-column layout + max-width on tablet.
- Game shell centered column on tablet.
- No per-game UI changes.

**Non-Goals:**
- Dynamic rotation listener (rotation re-renders via `key` pattern are acceptable for v1).
- Landscape-specific layouts.
- Breakpoints beyond `phone` / `tablet`.
- Custom hooks in each game lib.

## Decisions

### D1. `useBreakpoint()` API

```ts
// libs/shared/util-theme/src/lib/useBreakpoint.ts
export type Breakpoint = 'phone' | 'tablet';

export function useBreakpoint(): Breakpoint;
```

Implementation sketch:

```ts
import { Dimensions } from 'react-native';
import { useMemo } from 'react';
import { TABLET_MIN_WIDTH } from './breakpoints';

export function useBreakpoint(): Breakpoint {
  const width = Dimensions.get('window').width;
  return useMemo(
    () => (width >= TABLET_MIN_WIDTH ? 'tablet' : 'phone'),
    [width],
  );
}
```

### D2. Breakpoint constant

```ts
// libs/shared/util-theme/src/lib/breakpoints.ts
export const TABLET_MIN_WIDTH = 768;
```

Single source of truth. Any future breakpoints (e.g., `desktop`) are added here. Callers should import the constant, not magic numbers.

### D3. `ui-door-grid` responsive layout

On tablet the grid switches to two columns and is capped at 600dp, centered via auto margin.

```tsx
const bp = useBreakpoint();

const containerStyle = bp === 'tablet'
  ? { maxWidth: 600, alignSelf: 'center' as const, width: '100%' }
  : {};

const numColumns = bp === 'tablet' ? 2 : 1;

return (
  <View style={[styles.root, containerStyle]}>
    <FlatList numColumns={numColumns} ... />
  </View>
);
```

Door card aspect ratio and padding are unchanged; the grid simply flows into two columns.

### D4. `GameShellContainer` column wrapping

The outermost content `View` inside `GameShellContainer` gains tablet styles:

```tsx
const bp = useBreakpoint();

const columnStyle = bp === 'tablet'
  ? { maxWidth: 500, alignSelf: 'center' as const, width: '100%', paddingHorizontal: 24 }
  : {};
```

Wraps only the inner content area — status bar and tab bar remain full-width.

### D5. Rotation handling — `key` pattern

`useBreakpoint` reads `Dimensions.get('window')` once per render. Because `useMemo` depends on `width`, a component that re-renders will pick up the new dimension. Components that don't normally re-render on rotation should be keyed on the breakpoint so they remount:

```tsx
<DoorGrid key={bp} ... />
```

This is consistent with the project's no-`useEffect` rule.

### D6. No `Dimensions` event listener

Adding a listener requires a `useEffect` or `addEventListener`/`removeEventListener` lifecycle, which is forbidden by project rules. For v1 the `key` pattern is sufficient. If jank-free rotation is needed in v2, add a context provider with a listener in `util-theme`.

## Unresolved Questions

- Should `ui-game-board` apply a max-width on tablet, or is `GameShellContainer`'s outer column sufficient? Tentatively yes — apply constraints at both layers to avoid game boards expanding past 500dp inside the shell.
- 500dp vs 560dp for `GameShellContainer` max-width? Validate on an iPad mini sim (768dp) before shipping.
