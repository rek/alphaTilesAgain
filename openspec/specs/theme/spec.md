# theme Specification

## Purpose
TBD - created by archiving change theme-fonts. Update Purpose after archive.
## Requirements
### Requirement: Color palette indexed as a typed array

The theme SHALL expose `Theme.palette: readonly string[]` where entry `i` is the hex string at row `i` of the parsed `aa_colors.txt`. Lookups from `aa_gametiles.txt` (tile color column) and `aa_games.txt` (game color column) MUST use integer indexing into this array.

#### Scenario: Tile references color by index

- **WHEN** a tile's parsed `colorIndex` is `0` and the pack's `aa_colors.txt` has row `0 themePurple #9C27B0`
- **THEN** `theme.palette[0]` equals `'#9C27B0'` and the tile background color is that hex string

#### Scenario: Full palette length matches parsed rows

- **WHEN** `aa_colors.txt` has 13 data rows
- **THEN** `theme.palette.length` equals `13` and each entry is a valid `#RRGGBB` or `#RRGGBBAA` string

### Requirement: Semantic color slots derived from palette

The theme SHALL expose `Theme.colors: { primary, background, text, ... }` where `primary` and `background` are derived from fixed palette indices (`palette[0]` for both per the `aa_colors.txt` convention). Hardcoded non-palette slots (`text = '#000000'`) are allowed where no pack has ever varied the value.

#### Scenario: Primary color slot

- **WHEN** `theme.colors.primary` is read
- **THEN** the value equals `theme.palette[0]`

#### Scenario: Text color slot is hardcoded

- **WHEN** `theme.colors.text` is read
- **THEN** the value equals `'#000000'` regardless of pack

### Requirement: Typography scale with six sizes

The theme SHALL expose `Theme.typography` with exactly six size keys (`xs`, `sm`, `md`, `lg`, `xl`, `2xl`), each containing `{ fontSize: number, lineHeight: number }`. Values MUST be stable pixel-density units across packs.

#### Scenario: Read a typography token

- **WHEN** `theme.typography.lg` is read
- **THEN** it equals `{ fontSize: 20, lineHeight: 28 }`

#### Scenario: Unknown typography token

- **WHEN** code accesses `theme.typography.xxl` (not in the scale)
- **THEN** TypeScript emits a compile-time error

### Requirement: Font families from language manifest

The theme SHALL expose `Theme.fontFamily: { primary, primaryBold }` resolved from `langManifest.fonts.primary` and `langManifest.fonts.primaryBold` at boot. When the pack omits `primaryBold`, `fontFamily.primaryBold` SHALL fall back to `fontFamily.primary`.

#### Scenario: Pack with bold font

- **WHEN** the pack provides both `andikanewbasic_r.ttf` and `andikanewbasic_b.ttf`
- **THEN** `theme.fontFamily.primary` resolves to the regular font and `theme.fontFamily.primaryBold` resolves to the bold font

#### Scenario: Pack without bold font

- **WHEN** the pack provides only the regular font
- **THEN** `theme.fontFamily.primaryBold` equals `theme.fontFamily.primary`

### Requirement: Spacing scale in 4pt units

The theme SHALL expose `Theme.spacing` as a record keyed by integer strings with values in pixels: `{ '0': 0, '1': 4, '2': 8, '3': 12, '4': 16, '5': 20, '6': 24, '8': 32, '10': 40, '12': 48, '16': 64 }`. Keys `7`, `9`, `11`, `13`, `14`, `15` are intentionally absent.

#### Scenario: Spacing value

- **WHEN** `theme.spacing[4]` is read
- **THEN** the value is `16`

#### Scenario: Missing spacing key

- **WHEN** code accesses `theme.spacing[7]`
- **THEN** TypeScript emits a compile-time error

### Requirement: Single `useTheme()` entry point

Every `type:ui` library SHALL obtain theme tokens via `useTheme()`. Direct imports of palette, typography, or spacing constants from `util-theme` internals are allowed only inside `util-theme` itself.

#### Scenario: UI lib uses the hook

- **WHEN** a `type:ui` component renders and calls `useTheme()`
- **THEN** it receives a typed `Theme` object and the component re-uses that for styling

#### Scenario: UI lib imports internal constant

- **WHEN** a `type:ui` component imports `palette` directly from `@alphaTiles/util-theme/internal`
- **THEN** the lint step fails with a boundary-violation error

### Requirement: Font loading gate in app shell

`useFontsReady(fontMap)` SHALL wrap `expo-font.useFonts(fontMap)` and return a `boolean` indicating whether all fonts have finished loading. The app shell (`apps/alphaTiles/src/_layout.tsx`) SHALL render `null` (or a minimal boot splash) until `useFontsReady` returns `true`.

#### Scenario: Fonts still loading

- **WHEN** `apps/alphaTiles/src/_layout.tsx` mounts with fonts not yet loaded
- **THEN** `useFontsReady(langManifest.fonts)` returns `false` and the layout renders no children

#### Scenario: Fonts loaded

- **WHEN** all fonts in `langManifest.fonts` have loaded
- **THEN** `useFontsReady` returns `true` and the layout renders children

#### Scenario: Only `util-theme` imports `expo-font`

- **WHEN** a library other than `util-theme` adds an `import { useFonts } from 'expo-font'`
- **THEN** the lint step fails with a boundary violation

### Requirement: Logical-prop enforcement

Style objects in the codebase SHALL use logical direction props (`marginStart`, `marginEnd`, `paddingStart`, `paddingEnd`, etc.) instead of physical direction props (`marginLeft`, `marginRight`, `paddingLeft`, `paddingRight`). A custom ESLint rule `no-raw-margin-left-right` SHALL fail lint on any style-object property with a banned physical-direction key outside `util-theme` itself.

#### Scenario: Logical prop usage

- **WHEN** a component writes `{ marginStart: 16, paddingEnd: 8 }`
- **THEN** the lint passes

#### Scenario: Physical prop usage

- **WHEN** a component writes `{ marginLeft: 16 }`
- **THEN** the lint step fails with an error identifying the banned key and suggesting `marginStart`

#### Scenario: Physical prop inside util-theme

- **WHEN** `util-theme` internals write a style object using `marginLeft`
- **THEN** the lint passes (the allowlist exempts this library)

### Requirement: ThemeProvider consistency

`<ThemeProvider>` SHALL accept the parsed palette and font manifest as input, build a `Theme` object once, and memoize it. `useTheme()` consumers SHALL receive a reference-stable `Theme` across re-renders as long as the pack has not changed.

#### Scenario: Stable reference

- **WHEN** the same `ThemeProvider` instance wraps a component across ten re-renders with no prop change
- **THEN** `useTheme()` returns the same object reference all ten times

