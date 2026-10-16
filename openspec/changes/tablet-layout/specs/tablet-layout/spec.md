## ADDED Requirements

### Requirement: useBreakpoint returns 'phone' for widths below 768dp

`libs/shared/util-theme` SHALL export a `useBreakpoint()` hook that returns the string `'phone'` when the window width (`useWindowDimensions().width`) is strictly less than `TABLET_MIN_WIDTH` (768).

#### Scenario: Narrow screen returns phone

- **GIVEN** the device window width is less than 768dp
- **WHEN** a component calls `useBreakpoint()`
- **THEN** the hook returns `'phone'`

### Requirement: useBreakpoint returns 'tablet' for widths at or above 768dp

`useBreakpoint()` SHALL return the string `'tablet'` when the window width (`useWindowDimensions().width`) is greater than or equal to `TABLET_MIN_WIDTH` (768).

#### Scenario: Width exactly at threshold returns tablet

- **GIVEN** the device window width is exactly 768dp
- **WHEN** a component calls `useBreakpoint()`
- **THEN** the hook returns `'tablet'`

#### Scenario: Width above threshold returns tablet

- **GIVEN** the device window width is greater than 768dp (e.g., 1024dp)
- **WHEN** a component calls `useBreakpoint()`
- **THEN** the hook returns `'tablet'`

### Requirement: Game menu door grid stays capped and centred on wide screens

The live door grid (`feature-game-menu` `GameMenuScreenModern`) SHALL keep its existing wide-screen treatment: 4 columns when the grid is at least 600dp wide (3 below), grid capped at 720dp and centred. This change SHALL NOT reduce its column count on tablet. (`@shared/ui-door-grid` has no runtime consumer and is unchanged.)

#### Scenario: Tablet — grid unchanged

- **GIVEN** the window is at least 768dp wide
- **WHEN** the game menu renders
- **THEN** the door list uses 4 columns within a centred grid of at most 720dp

### Requirement: GameShellScreen centres the chrome buttons on tablet

`GameShellContainer` SHALL pass `useBreakpoint()` to `GameShellScreen` as `breakpoint`. When `breakpoint` is `'tablet'`, the chrome button row SHALL have `maxWidth: 500`, `alignSelf: 'center'` and `width: '100%'`; the chrome bar background and border SHALL stay full-width. The board slot SHALL NOT be width-capped, because game screens size themselves from the window width and a narrower slot would clip them.

#### Scenario: Tablet — chrome row constrained

- **GIVEN** `breakpoint` is `'tablet'`
- **WHEN** `GameShellScreen` renders
- **THEN** the chrome button row has `maxWidth: 500` and `alignSelf: 'center'`

#### Scenario: Phone — layout unchanged

- **GIVEN** `breakpoint` is `'phone'` or absent
- **WHEN** `GameShellScreen` renders
- **THEN** no max-width is applied to the chrome row

#### Scenario: Board slot never capped

- **GIVEN** any breakpoint value
- **WHEN** `GameShellScreen` renders
- **THEN** neither the board slot nor any ancestor of the board has a `maxWidth`

### Requirement: ui-game-board caps cell sizing on tablet

`GameBoard` SHALL size cells from `min(windowWidth, 500)` when `useBreakpoint()` returns `'tablet'`, and from the full window width on phone (unchanged).

#### Scenario: Tablet — board at most 500dp

- **GIVEN** `useBreakpoint()` returns `'tablet'`
- **WHEN** `GameBoard` renders
- **THEN** its width is at most 500dp and it is centred

### Requirement: Rotation re-renders breakpoint correctly

`useBreakpoint()` SHALL derive from `useWindowDimensions()`, so a component re-renders with the updated breakpoint after device rotation or a browser resize, with no listener or effect in project code.

#### Scenario: Portrait-to-landscape re-render updates breakpoint

- **GIVEN** a component rendered with `useBreakpoint()` returning `'phone'` in portrait
- **WHEN** the device rotates to landscape (window width changes)
- **THEN** `useBreakpoint()` returns the breakpoint corresponding to the new width

### Requirement: Per-game UIs are unchanged

Individual game UI components (tile grids, answer boards, match cards, etc.) SHALL NOT be modified as part of this change. Only `ui-game-board` and the game shell chrome receive tablet treatment.

#### Scenario: Game UI not affected

- **GIVEN** any breakpoint value
- **WHEN** a game-specific UI component (e.g., a tile grid in `game-china`) renders
- **THEN** its layout is identical to the pre-change behavior
