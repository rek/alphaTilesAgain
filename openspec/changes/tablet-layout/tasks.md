# Tasks

Implement responsive tablet layout via breakpoint hook and container updates.

## 0. Preflight

- [ ] Read `proposal.md` and `design.md`.
- [ ] Read `libs/shared/util-theme/src/index.ts` to confirm current exports and avoid collisions.
- [ ] Read `libs/shared/ui-door-grid/src/` to understand current layout structure.
- [ ] Read `libs/alphaTiles/feature-game-shell/src/` to locate `GameShellContainer` and its content `View`.
- [ ] Read `libs/shared/ui-game-board/src/` to understand current board constraints.

## 1. useBreakpoint Hook

- [ ] Create `libs/shared/util-theme/src/lib/breakpoints.ts` exporting `TABLET_MIN_WIDTH = 768` and `Breakpoint` type.
- [ ] Create `libs/shared/util-theme/src/lib/useBreakpoint.ts` implementing `useBreakpoint()` per design D1.
- [ ] Export `TABLET_MIN_WIDTH`, `Breakpoint`, and `useBreakpoint` from `libs/shared/util-theme/src/index.ts`.
- [ ] Unit test: `width < 768` → returns `'phone'`.
- [ ] Unit test: `width === 768` → returns `'tablet'`.
- [ ] Unit test: `width > 768` → returns `'tablet'`.

## 2. ui-door-grid Layout

- [ ] Import `useBreakpoint` in the door grid component.
- [ ] Apply tablet container style (`maxWidth: 600`, `alignSelf: 'center'`, `width: '100%'`) when `bp === 'tablet'`.
- [ ] Set `numColumns={bp === 'tablet' ? 2 : 1}` on `FlatList` (or equivalent grid).
- [ ] Add `key={bp}` to the `FlatList` so column count change forces remount.
- [ ] Verify door card padding/aspect ratio unchanged between breakpoints.

## 3. game-shell Column

- [ ] Import `useBreakpoint` in `GameShellContainer`.
- [ ] Wrap inner content `View` with tablet column style (`maxWidth: 500`, `alignSelf: 'center'`, `width: '100%'`, `paddingHorizontal: 24`) when `bp === 'tablet'`.
- [ ] Confirm status bar and tab bar remain full-width (outside the capped `View`).

## 4. ui-game-board Layout

- [ ] Import `useBreakpoint` in the game board component.
- [ ] Apply `maxWidth: 500`, `alignSelf: 'center'`, `width: '100%'` when `bp === 'tablet'`.
- [ ] Confirm phone layout is pixel-identical to pre-change behavior.

## 5. Verification

- [ ] Type-check: `npx tsc --noEmit -p libs/shared/util-theme/tsconfig.lib.json`.
- [ ] Lint: `nx lint shared-util-theme`.
- [ ] Unit tests pass: `nx test shared-util-theme`.
- [ ] Manual: run on iPad sim (≥768dp) — door grid shows two columns, centered.
- [ ] Manual: run on iPad sim — game shell content centered in ~500dp column with side padding.
- [ ] Manual: rotate iPad sim — layout updates correctly via re-render (no stale breakpoint).
- [ ] Manual: run on phone sim — layouts unchanged from pre-change behavior.
