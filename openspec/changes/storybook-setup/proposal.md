## Why

ADR-010 commits the project to Storybook as the review surface for every `type:ui` library. Three UI libs already ship `.stories.tsx` files (`ui-avatar-grid`, `ui-player-card`, `ui-custom-keyboard`) and more are coming with `game-engine-base` (`ui-tile`, `ui-game-board`, `ui-celebration`, `ui-score-bar`). Nothing loads those stories today — no `.storybook/` config, no `@nx/storybook` plugin, no `storybook` nx target. The stories are inert. This change fills the gap before the design-system surface area doubles, and before more UI libs arrive without a runnable review target.

## What Changes

- Add `libs/shared/storybook-host` — single composite Storybook host aggregating stories from every `type:ui` library (the "One Storybook For All" pattern from the NX Storybook guide).
- Add `@nx/storybook`, `@storybook/react-vite`, `storybook`, `@storybook/addon-essentials`, `@storybook/react` devDependencies.
- Configure Storybook w/ `react-native-web` alias so RN primitives (`View`, `Text`, `Pressable`, `Image`, `StyleSheet`) render in a browser.
- Add NX targets `storybook` + `build-storybook` on the host library, plus a dev-server shortcut at workspace root scripts (`nx storybook storybook-host`).
- Stories discovered via glob: `../../libs/**/src/**/*.stories.@(ts|tsx|js|jsx)`.
- Add minimal global decorators: theme provider fixture (the `MockThemeProvider` from `util-theme/testing`), safe-area context provider, i18n provider bound to English chrome.
- Update `AGENTS.md`, `docs/TOOLING.md` with the Storybook commands + rules (run before merging any `ui-*` change).
- Update `docs/decisions/ADR-010-testing-storybook-plus-unit.md` with an implementation note pointing at the host library.

## Capabilities

### New Capabilities

- `storybook-host`: the composite Storybook setup — host library, framework choice, story discovery rules, global decorators, CI behavior.

### Modified Capabilities

_None_ — this does not change any prior requirement; it adds the capability ADR-010 already committed to.

## Impact

- **New lib**: `libs/shared/storybook-host/` (Storybook config only — no runtime exports).
- **New devDependencies**: `@nx/storybook`, `@storybook/react-vite`, `storybook`, `@storybook/addon-essentials`, `@storybook/react`, plus `vite`-peer deps (`@nx/vite` is already present).
- **New NX targets**: `storybook`, `build-storybook` on the host library.
- **Modified files**: `package.json` (devDeps + scripts), `AGENTS.md` (§known gotchas — web rendering caveats), `docs/TOOLING.md` (Storybook section), `docs/decisions/ADR-010-testing-storybook-plus-unit.md` (impl note).
- **No changes to existing `.stories.tsx` files** — glob discovery picks them up as-is.
- **CI impact**: add `nx build-storybook storybook-host` as a check on PRs touching `type:ui` libs. Deferred to a future CI change; document intent now.
- **Risk**: `react-native-web` does not 100% match native rendering — Storybook is a component-review surface, not a device test. Document in AGENTS.md that native-only visual regressions must be caught by manual device QA per change.

## Out of Scope

- On-device Storybook for React Native (`@storybook/react-native`) — web-rendered stories suffice for review per ADR-010.
- Chromatic / visual regression testing — manual review in v1.
- Per-lib Storybook configs — explicitly rejected in favor of the composite host.
- Automated Storybook deployment (GitHub Pages / Vercel) — deferred.
