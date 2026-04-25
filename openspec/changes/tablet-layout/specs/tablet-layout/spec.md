## ADDED Requirements

### Requirement: useBreakpoint returns 'phone' for widths below 768dp

`libs/shared/util-theme` SHALL export a `useBreakpoint()` hook that returns the string `'phone'` when `Dimensions.get('window').width` is strictly less than `TABLET_MIN_WIDTH` (768).

#### Scenario: Narrow screen returns phone

- **GIVEN** the device window width is less than 768dp
- **WHEN** a component calls `useBreakpoint()`
- **THEN** the hook returns `'phone'`

### Requirement: useBreakpoint returns 'tablet' for widths at or above 768dp

`useBreakpoint()` SHALL return the string `'tablet'` when `Dimensions.get('window').width` is greater than or equal to `TABLET_MIN_WIDTH` (768).

#### Scenario: Width exactly at threshold returns tablet

- **GIVEN** the device window width is exactly 768dp
- **WHEN** a component calls `useBreakpoint()`
- **THEN** the hook returns `'tablet'`

#### Scenario: Width above threshold returns tablet

- **GIVEN** the device window width is greater than 768dp (e.g., 1024dp)
- **WHEN** a component calls `useBreakpoint()`
- **THEN** the hook returns `'tablet'`

### Requirement: ui-door-grid renders two-column grid with max-width on tablet

`ui-door-grid` SHALL render a two-column door grid constrained to a max-width of 600dp and centered horizontally when `useBreakpoint()` returns `'tablet'`.

#### Scenario: Tablet — two columns

- **GIVEN** `useBreakpoint()` returns `'tablet'`
- **WHEN** `ui-door-grid` renders
- **THEN** the door list uses two columns
- **AND** the container has `maxWidth: 600` and `alignSelf: 'center'`

#### Scenario: Phone — single column unchanged

- **GIVEN** `useBreakpoint()` returns `'phone'`
- **WHEN** `ui-door-grid` renders
- **THEN** the door list uses one column
- **AND** no max-width constraint is applied

### Requirement: ui-door-grid remounts when breakpoint changes

`ui-door-grid` SHALL include a `key` prop derived from the current breakpoint on its list component so that a breakpoint change forces a remount and avoids stale column counts.

#### Scenario: Breakpoint change triggers list remount

- **GIVEN** `useBreakpoint()` previously returned `'phone'`
- **WHEN** `useBreakpoint()` returns `'tablet'` on the next render
- **THEN** the door list component remounts (key changes)

### Requirement: GameShellContainer wraps content in max-width column on tablet

`GameShellContainer` in `feature-game-shell` SHALL wrap its game content in a `View` with `maxWidth: 500`, `alignSelf: 'center'`, `width: '100%'`, and `paddingHorizontal: 24` when `useBreakpoint()` returns `'tablet'`.

#### Scenario: Tablet — content column constrained

- **GIVEN** `useBreakpoint()` returns `'tablet'`
- **WHEN** `GameShellContainer` renders
- **THEN** the inner content view has `maxWidth: 500` and is centered (`alignSelf: 'center'`)
- **AND** the content view has `paddingHorizontal: 24`

#### Scenario: Phone — content layout unchanged

- **GIVEN** `useBreakpoint()` returns `'phone'`
- **WHEN** `GameShellContainer` renders
- **THEN** no max-width or extra padding is applied to the content view

#### Scenario: Status bar and tab bar remain full-width

- **GIVEN** any breakpoint value
- **WHEN** `GameShellContainer` renders
- **THEN** the status bar and tab bar components are outside the max-width content column and remain full-width

### Requirement: Rotation re-renders breakpoint correctly

A component that re-renders after device rotation SHALL reflect the updated `Dimensions.get('window').width` in its `useBreakpoint()` return value.

#### Scenario: Portrait-to-landscape re-render updates breakpoint

- **GIVEN** a component rendered with `useBreakpoint()` returning `'phone'` in portrait
- **WHEN** the device rotates to landscape and the component re-renders (e.g., via `key` change)
- **THEN** `useBreakpoint()` returns the breakpoint corresponding to the new width

### Requirement: Per-game UIs are unchanged

Individual game UI components (tile grids, answer boards, match cards, etc.) SHALL NOT be modified as part of this change. Only `ui-door-grid`, `ui-game-board`, and `GameShellContainer` receive tablet treatment.

#### Scenario: Game UI not affected

- **GIVEN** any breakpoint value
- **WHEN** a game-specific UI component (e.g., a tile grid in `game-china`) renders
- **THEN** its layout is identical to the pre-change behavior
