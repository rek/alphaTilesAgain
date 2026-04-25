## Why

Layouts target ~390dp phone screens. On iPad and Android tablets (768dp+) UI elements stretch awkwardly across the full width, looking unpolished and reducing readability. A centered-column treatment with a defined max-width is the standard mobile-to-tablet adaptation pattern and requires no per-game redesign.

## What Changes

- Add `TABLET_MIN_WIDTH = 768` constant and `useBreakpoint()` hook to `libs/shared/util-theme`.
- Update `ui-door-grid` to render a two-column door grid centered in a max-width 600dp column on tablet.
- Update `GameShellContainer` in `feature-game-shell` to wrap game content in a max-width 500dp centered column on tablet.
- Update `ui-game-board` to apply tablet-aware width constraints.

## Capabilities

### Modified Capabilities

- `ui-door-grid` — tablet: two-column grid, max-width 600dp centered; phone: unchanged single-column layout.
- `ui-game-board` — tablet: constrained max-width with centered alignment; phone: unchanged.
- `feature-game-shell` (GameShellContainer) — tablet: game content wrapped in max-width 500dp centered column with side padding; phone: unchanged.

### New Capabilities

- `util-theme` breakpoint — exports `TABLET_MIN_WIDTH` constant and `useBreakpoint()` hook returning `'phone' | 'tablet'` derived from `Dimensions.get('window').width` via `useMemo`.

## Impact

- No new libraries; `util-theme` gains one hook + one constant.
- No breaking changes to game UIs — only shell chrome and door grid are affected.
- No lang-pack changes required.
- Rotation causes a re-render via `key` pattern; no persistent listener.

## Out of Scope

- Per-game UI redesign (tile grids, answer boards, etc.).
- Landscape-specific layouts.
- Dynamic `Dimensions` event listener (deferred to v2).
- Desktop / web breakpoints beyond tablet.

## Unresolved Questions

- Should `ui-game-board` also cap max-width on tablet, or only `GameShellContainer`? Defaulting to yes (constraints applied at both layers) but open.
- Is 500dp the right max-width for `GameShellContainer`? Needs visual validation on 1024dp tablet sim.
