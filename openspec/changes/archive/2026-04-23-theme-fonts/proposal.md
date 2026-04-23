## Why

The Android original reads `aa_colors.txt` into a color palette keyed by integer index (0 = themePurple, 1 = themeBlue, …) and references those indices from `aa_gametiles.txt` (tile background color) and `aa_games.txt` (per-game color). Fonts are per-pack TTFs named in `aa_langinfo.txt` and dropped into `res/font/`. Our port needs both — a shared theme library that owns colors, typography scale, and spacing tokens; and a font-loading hook that blocks rendering until the pack's TTFs are ready.

Without this change, every feature lib hardcodes hex strings, pixel sizes, and margin constants, and there's no mechanism to swap a pack's primary font. Every UI change (loading screen, game menu, game shell) depends on this.

## What Changes

- Add `libs/shared/util-theme` (`type:util`, `scope:shared`) — token system exposing a typed `Theme` object (colors, typography scale, spacing), a `useTheme()` hook, and logical-prop style helpers.
- Expose `ColorPalette` as a 0-indexed array of hex strings parsed from `aa_colors.txt`. Tile and game color columns reference these by integer.
- Define a typography scale `{ xs, sm, md, lg, xl, 2xl }` with `fontSize` + `lineHeight` pairs; font families resolved from `langManifest.fonts.primary` / `.primaryBold` at boot.
- Define a spacing scale `{ 0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16 }` in 4pt units.
- Expose `useFontsReady(): boolean` wrapping `expo-font`'s `useFonts(langManifest.fonts)`. Called by `apps/alphaTiles/src/_layout.tsx` to gate rendering.
- Expose logical-prop helpers (`marginStart`, `marginEnd`, `paddingStart`, `paddingEnd`) as style-object constants so call sites don't write raw `marginLeft` / `marginRight`.
- Add ESLint rules to `eslint.config.js`: `react-native/no-unused-styles` (standard) + a custom rule `no-raw-margin-left-right` that bans the physical-direction style keys except inside `util-theme` itself.
- Add `expo-font` as a dependency.

## Capabilities

### New Capabilities

- `theme`: centralized color palette (parsed from `aa_colors.txt`), typography scale bound to the pack's primary font, spacing scale, `useTheme()` hook, `useFontsReady()` hook, logical-prop style helpers, ESLint rules that prevent regressions to raw physical-direction properties.

### Modified Capabilities

_None_ — first theme change.

## Impact

- **New lib**: `libs/shared/util-theme/` (source, project.json, unit tests).
- **New dep**: `expo-font` in `apps/alphaTiles/package.json`.
- **App shell edits**: `apps/alphaTiles/src/_layout.tsx` calls `useFontsReady()` and returns `null` (or a bare splash) until true.
- **New ESLint rules**: `eslint.config.js` gains `react-native/no-unused-styles` and a custom `no-raw-margin-left-right` rule (inline AST check — no new package needed).
- **Downstream unblocks**: every `type:ui` lib (tile, button, text) and every screen.
- **No breaking changes** — additive.
- **Risk**: a future dark-mode or user-selectable-theme feature would need to expand the `Theme` shape. Explicitly out of scope for v1 — no source spec exists.
