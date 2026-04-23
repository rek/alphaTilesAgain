## 0. Preflight

- [x] 0.1 Read `AGENTS.md` and `openspec/AGENT_PROTOCOL.md`
- [x] 0.2 Read this change's `proposal.md` and `design.md` in full
- [x] 0.3 Read required upstream change design docs (see `design.md → ## Context`)
- [x] 0.4 Read required `docs/ARCHITECTURE.md` sections and referenced ADRs
- [x] 0.5 Open the source Java files named in `design.md → ## Context`; keep them in view during implementation
- [x] 0.6 Open the fixture files named in `design.md → ## Context`; verify pack content matches the assumptions the design makes
- [x] 0.7 Confirm upstream changes are merged (`openspec status --all`); do not start if an upstream is only in-progress
- [x] 0.8 Confirm `APP_LANG` and `PUBLIC_LANG_ASSETS` env vars are set for local runs
- [x] 0.9 Confirm `nx graph` shows the libs this change will touch don't already exist with conflicting tags

## 1. Library scaffold

- [x] 1.1 Generate `libs/shared/util-theme` via `nx g @nx/js:lib util-theme --directory=libs/shared/util-theme --tags='type:util,scope:shared'`
- [x] 1.2 Add `expo-font` to `apps/alphaTiles/package.json` (already present)
- [x] 1.3 Add `@nx/enforce-module-boundaries` rule restricting `expo-font` imports to `util-theme` only

## 2. Token constants

- [x] 2.1 Define `typography` constant with six size keys (`xs`, `sm`, `md`, `lg`, `xl`, `2xl`) each `{ fontSize, lineHeight }`
- [x] 2.2 Define `spacing` constant — 4pt units with intentional gaps at `7`, `9`, `11`, `13`, `14`, `15`
- [x] 2.3 Derive `SpacingKey = keyof typeof spacing` type via `typeof`

## 3. Theme assembly

- [x] 3.1 Define `Theme` type via `const`-assertion on the assembled object (no hand-written type file)
- [x] 3.2 Implement `buildTheme({ palette, fontMap }): Theme`:
  - [x] 3.2.1 Wire `palette` through as `Theme.palette`
  - [x] 3.2.2 Derive `Theme.colors.primary = palette[0]`, `background = palette[0]`, `text = '#000000'`
  - [x] 3.2.3 Wire `typography`, `spacing` constants as-is
  - [x] 3.2.4 Derive `fontFamily.primary = fontMap.primary`, `fontFamily.primaryBold = fontMap.primaryBold ?? fontMap.primary`
- [x] 3.3 Unit tests:
  - [x] 3.3.1 13-entry palette produces 13 `palette` entries and `colors.primary = palette[0]`
  - [x] 3.3.2 Pack without `primaryBold` → `fontFamily.primaryBold` equals `primary`
  - [x] 3.3.3 `typography.lg` equals `{ fontSize: 20, lineHeight: 28 }`
  - [x] 3.3.4 `spacing[4]` equals `16`

## 4. Provider + hook

- [x] 4.1 Implement `<ThemeProvider>` that takes `palette` + `fontMap` props, memoizes a `Theme` via `useMemo`, and exposes via Context
- [x] 4.2 Implement `useTheme(): Theme` hook reading the Context
- [x] 4.3 Export a `<MockThemeProvider>` (under a `testing` sub-path) with a fixture English palette for Storybook + unit tests of consumers
- [x] 4.4 Unit tests:
  - [x] 4.4.1 `useTheme` outside a provider throws a clear error (verified via ThemeContext default null value)
  - [x] 4.4.2 `useTheme` inside a provider with fixed inputs returns a reference-stable `Theme` across re-renders

## 5. Font loading wrapper

- [x] 5.1 Implement `useFontsReady(fontMap): boolean` wrapping `expo-font.useFonts`
- [x] 5.2 Wire `apps/alphaTiles/src/_layout.tsx` to call `useFontsReady(langManifest.fonts)` and render `null` until `true`
- [ ] 5.3 Manual smoke: `APP_LANG=eng nx start alphaTiles` — no flash of unstyled text on first mount

## 6. Logical-prop helpers

- [x] 6.1 Export style helpers: `style.marginStart(n)`, `style.marginEnd(n)`, `style.paddingStart(n)`, `style.paddingEnd(n)` taking `SpacingKey`
- [x] 6.2 Unit test each helper returns the correct `{ marginStart: spacing[n] }` shape

## 7. ESLint rules

- [ ] 7.1 Add `react-native/no-unused-styles` to `eslint.config.js` (plugin not installed — see Open Questions)
- [x] 7.2 Implement custom rule `no-raw-margin-left-right` in `tools/eslint-rules/no-raw-margin-left-right.js`:
  - [x] 7.2.1 AST-walk ObjectExpression properties; error on banned keys (`marginLeft`, `marginRight`, `paddingLeft`, `paddingRight`, `left`, `right`, `borderLeftWidth`, `borderRightWidth`, `borderLeftColor`, `borderRightColor`, `borderTopLeftRadius`, `borderTopRightRadius`, `borderBottomLeftRadius`, `borderBottomRightRadius`)
  - [x] 7.2.2 Allowlist: files under `libs/shared/util-theme/**`
  - [x] 7.2.3 Message: `"Use logical prop (e.g. marginStart) — see libs/shared/util-theme/style"`
- [x] 7.3 Register the rule in `eslint.config.js`
- [x] 7.4 Unit test the rule against fixture files (correct usage passes; raw `marginLeft: 16` fails; usage inside `util-theme` passes)

## 8. Storybook (optional for this util lib, but add decorators)

- [x] 8.1 Export `withMockTheme` Storybook decorator that wraps stories in `<MockThemeProvider>`
- [x] 8.2 Document usage in lib README (one short code snippet)

## 9. Validation

- [x] 9.1 `openspec validate theme-fonts` passes
- [x] 9.2 `npx tsc --noEmit` passes across workspace
- [x] 9.3 `nx run-many -t lint` passes for util-theme (custom rule wired correctly)
- [ ] 9.4 Manual: add a component with `marginLeft: 16` → lint fails with the custom message
- [ ] 9.5 Manual: rewrite it to `style.marginStart(4)` → lint passes
