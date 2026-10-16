# Tasks

Implement responsive tablet layout via breakpoint hook and container updates.

> **Re-validation (2026-10-16).** Proposal predates current code. Findings:
> - Live door grid is `feature-game-menu/GameMenuScreenModern` (FlatList, 3 cols <600dp / 4 cols ≥600dp, capped at `MAX_GRID_WIDTH = 720`, U19). Already tablet/desktop-aware. `@shared/ui-door-grid` and `@shared/ui-game-board` have **no runtime consumers** (stories only).
> - Proposed 2-col tablet door grid would *shrink* columns vs today (4) → regression. Dropped.
> - Every game screen sizes from `useWindowDimensions()` width, not its container. Capping the shell's board slot at 500dp would clip/overflow games (e.g. Peru: two `(width-32)/2` buttons per row; Malaysia: `root width = window width`). Fixing needs per-game changes (out of scope per spec). → Board slot stays full-width; tablet cap applied to the **chrome button row** instead (bar background/border stay full-width).
> - `useWindowDimensions` replaces `Dimensions.get` + `key` (D5/D6): re-renders on rotation / browser resize, no listener or effect in our code.
> - Web also runs at desktop widths (≥768 → `'tablet'`); all caps use `maxWidth` + `width: '100%'`, so nothing breaks wider.

## 0. Preflight

- [x] Read `proposal.md` and `design.md`.
- [x] Read `libs/shared/util-theme/src/index.ts` to confirm current exports and avoid collisions.
- [x] Read `libs/shared/ui-door-grid/src/` to understand current layout structure. — note: unused at runtime; real grid is `GameMenuScreenModern`.
- [x] Read `libs/alphaTiles/feature-game-shell/src/` to locate `GameShellContainer` and its content `View`. — content `View` lives in presenter `GameShellScreen`.
- [x] Read `libs/shared/ui-game-board/src/` to understand current board constraints.

## 1. useBreakpoint Hook

- [x] Create `libs/shared/util-theme/src/lib/breakpoints.ts` exporting `TABLET_MIN_WIDTH = 768` and `Breakpoint` type. — also pure `breakpointForWidth()`.
- [x] Create `libs/shared/util-theme/src/lib/useBreakpoint.ts` implementing `useBreakpoint()` per design D1. — uses `useWindowDimensions` (reactive) instead of `Dimensions.get` + `useMemo`.
- [x] Export `TABLET_MIN_WIDTH`, `Breakpoint`, and `useBreakpoint` from `libs/shared/util-theme/src/index.ts`.
- [x] Unit test: `width < 768` → returns `'phone'`.
- [x] Unit test: `width === 768` → returns `'tablet'`.
- [x] Unit test: `width > 768` → returns `'tablet'`.

## 2. ui-door-grid Layout

- [x] ~~Import `useBreakpoint` in the door grid component.~~ — obsolete: `UiDoorGrid` unused; live grid (`GameMenuScreenModern`) already responsive (U19).
- [x] ~~Apply tablet container style (`maxWidth: 600`, …).~~ — obsolete/already done: live grid capped at 720dp, centred.
- [x] ~~Set `numColumns={bp === 'tablet' ? 2 : 1}`.~~ — obsolete: live grid uses 4 cols ≥600dp; 2 would regress.
- [x] ~~Add `key={bp}` to the `FlatList`.~~ — already done: live grid uses `key={numColumns}`.
- [x] Verify door card padding/aspect ratio unchanged between breakpoints. — no change made.

## 3. game-shell Column

- [x] Import `useBreakpoint` in `GameShellContainer`. — passed to presenter as `breakpoint` prop (presenter stays hook-free).
- [x] ~~Wrap inner content `View` with tablet column style (`maxWidth: 500`, …, `paddingHorizontal: 24`).~~ — obsolete: games size from window width → would clip. Instead chrome button row capped (`maxWidth: 500`, `alignSelf: 'center'`, `width: '100%'`) on tablet.
- [x] Confirm status bar and tab bar remain full-width (outside the capped `View`). — score bar + chrome bar background full-width; test asserts board slot uncapped.

## 4. ui-game-board Layout

- [x] Import `useBreakpoint` in the game board component.
- [x] Apply `maxWidth: 500`, `alignSelf: 'center'`, `width: '100%'` when `bp === 'tablet'`. — implemented as cell sizing from `min(width, 500)` (board width = cells × columns, already centred). No runtime consumer today; no test target in `ui-game-board`.
- [x] Confirm phone layout is pixel-identical to pre-change behavior. — phone path unchanged (`usableWidth = width`).

## 5. Verification

- [x] Type-check: `npx nx run-many -t typecheck`.
- [x] Lint: `npx nx run-many -t lint`.
- [x] Unit tests pass: `npx nx run-many -t test`.
- [ ] Manual: run on tablet (≥768dp) — door grid 4 cols, centred ≤720dp. — pending: device QA (#57)
- [ ] Manual: run on tablet — game chrome buttons centred in ~500dp row; games unclipped. — pending: device QA (#57)
- [ ] Manual: rotate tablet — layout updates correctly via re-render (no stale breakpoint). — pending: device QA (#57)
- [ ] Manual: run on phone — layouts unchanged from pre-change behavior. — pending: device QA (#57)
- [ ] Manual: web at ≥1440px desktop width — menu + game chrome centred, nothing stretched/clipped. — pending: device QA (#57)
