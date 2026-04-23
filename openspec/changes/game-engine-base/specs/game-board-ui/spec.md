## ADDED Requirements

### Requirement: Generic N-cell board layout

`libs/shared/ui-game-board` SHALL export a `<GameBoard>` component that lays out `children` in a portrait-constrained grid. It accepts `columns`, optional `rows`, and `children`. The component MUST be presentational — no hooks beyond `useWindowDimensions`, no data-access or i18n imports.

Props contract:

```ts
type GameBoardProps = {
  columns: number;
  rows?: number;               // default: derived from children count / columns
  children: React.ReactNode;   // tiles, word-image tiles, or any cell content
  accessibilityLabel?: string;
};
```

#### Scenario: 4x4 grid (China)

- **WHEN** `<GameBoard columns={4}>{sixteenTiles}</GameBoard>` renders
- **THEN** the 16 tiles lay out in a 4-column, 4-row grid, each cell square (1:1 aspect)

#### Scenario: 4x1 grid (word-image row)

- **WHEN** `<GameBoard columns={1} rows={4}>{fourWordImages}</GameBoard>` renders
- **THEN** the 4 images stack vertically, each square

#### Scenario: Adaptive row count

- **WHEN** `<GameBoard columns={3}>{sixItems}</GameBoard>` renders with `rows` omitted
- **THEN** the board derives 2 rows automatically

### Requirement: Logical-prop layout (RTL-safe)

The component SHALL use logical flex props (`flexDirection: 'row'`, `marginStart`, `marginEnd`) exclusively. It MUST NOT use `marginLeft` / `marginRight` / `flexDirection: 'row-reverse'`. This ensures correct layout under both LTR and RTL script direction without mirror-flipping logic.

#### Scenario: RTL pack

- **WHEN** the app is running in RTL mode (`I18nManager.isRTL === true`)
- **THEN** `<GameBoard columns={4}>` lays tiles out right-to-left automatically (native RN behavior given logical props)

#### Scenario: Source audit

- **WHEN** `grep -rE "(marginLeft|marginRight|row-reverse)" libs/shared/ui-game-board/src/` runs
- **THEN** zero matches

### Requirement: Portrait orientation

The board SHALL constrain itself to portrait aspect ratios (not allowing rows wider than the screen). If `rows * cellHeight` would exceed the viewport height, cell size shrinks to fit. This matches `GameActivity`'s `setRequestedOrientation(SCREEN_ORIENTATION_PORTRAIT)` at `GameActivity.java:205`.

#### Scenario: Small viewport

- **WHEN** the board renders on a 320×480 device with a 4x4 grid
- **THEN** cells shrink uniformly so the full grid fits above the bottom-row system controls

### Requirement: `type:ui` purity

`ui-game-board` SHALL NOT import `react-i18next`, Zustand, data-access, or feature libs. Enforced by `@nx/enforce-module-boundaries`.

#### Scenario: Dependency audit

- **WHEN** `nx graph` inspects `ui-game-board`
- **THEN** the only outgoing edges are to `react-native` and (optionally) the shared `util-theme` lib

### Requirement: Storybook documentation

The library SHALL ship Storybook stories covering: 4x4 grid, 2x3 grid, 1x4 vertical strip, portrait-constrained small-viewport layout.

#### Scenario: Story coverage

- **WHEN** Storybook launches
- **THEN** the `ui-game-board` section lists at least four stories covering the configurations above
