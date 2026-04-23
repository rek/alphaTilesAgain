## 0. Preflight

- [x] 0.1 Read `AGENTS.md` and `openspec/AGENT_PROTOCOL.md`
- [x] 0.2 Read this change's `proposal.md` and `design.md` in full
- [x] 0.3 Read `docs/decisions/ADR-010-testing-storybook-plus-unit.md`
- [x] 0.4 Read the NX "One Storybook For All" guide referenced in `design.md → ## Context`
- [x] 0.5 (No Java source ported in this change — skip)
- [x] 0.6 (No pack fixture relevant to this change — skip)
- [x] 0.7 Confirm upstream changes are merged (`openspec status --all`); `theme-fonts` and `i18n-foundation` must be archived so `MockThemeProvider` and `I18nProvider` exist
- [x] 0.8 Confirm `APP_LANG` is set only if planning to test prebuild integration (not required for Storybook itself)
- [x] 0.9 Confirm `nx graph` shows no existing `storybook-host` library

## 1. Library scaffold

- [x] 1.1 Scaffold `libs/shared/storybook-host/` via `./nx g @nx/js:lib storybook-host --directory=libs/shared/storybook-host --tags='type:tooling,scope:shared' --importPath=@shared/storybook-host`
- [x] 1.2 Delete the auto-generated `src/` contents — this lib has no runtime exports; replace `src/index.ts` with a one-line comment stub
- [x] 1.3 Verify `tsconfig.base.json` did NOT add a runtime path alias (the lib is config-only). If it did, remove it manually.
- [x] 1.4 Update `docs/PROJECT_ORGANIZATION.md` taxonomy table to include `type:tooling` (describe: "config-only projects; no runtime exports; cannot be imported")
- [x] 1.5 Add a lint rule or note preventing `type:tooling` from being imported by any other lib

## 2. Dependencies

- [x] 2.1 Add dev deps to root `package.json`:
  - `@nx/storybook` (match existing `@nx/*` version)
  - `@storybook/react` (latest stable 8.x)
  - `@storybook/react-vite` (same minor as `@storybook/react`)
  - `@storybook/addon-essentials` (same)
  - `@storybook/addon-a11y` (same — per design D7 open question, defaulting to include)
  - `storybook` (the CLI)
- [x] 2.2 Run `npm install` (or `bun install` per TOOLING.md); resolve lockfile conflicts
- [x] 2.3 Verify `react-native-web` and `react-native-safe-area-context` are already installed (both should be via `apps/alphaTiles/package.json`); if Storybook needs them at host level, add to `libs/shared/storybook-host/package.json` too

## 3. Storybook config

- [x] 3.1 Create `libs/shared/storybook-host/.storybook/main.ts`:
  - Framework: `@storybook/react-vite`
  - Stories glob: `['../../../libs/**/src/**/*.stories.@(ts|tsx|js|jsx|mdx)']` (verify the right relative depth)
  - Addons: `@storybook/addon-essentials`, `@storybook/addon-a11y`
  - Vite config hook: set `resolve.alias` with `react-native$ → react-native-web` + `react-native/Libraries/Image/AssetRegistry → react-native-web/dist/modules/AssetRegistry`
  - `typescript.reactDocgen: 'react-docgen-typescript'`
- [x] 3.2 Create `libs/shared/storybook-host/.storybook/preview.tsx`:
  - Wrap `decorators` array with:
    - `SafeAreaProvider` from `react-native-safe-area-context`
    - `MockThemeProvider` from `@shared/util-theme/testing`
    - `I18nProvider` from `@shared/util-i18n` — pre-initialized with `deviceLocale: 'en'` and the imported `locales/en.json` chrome namespace
  - Set default `parameters`: background (light / dark swatch), `controls.expanded: true`, `a11y`: { config: { rules: [] } }
- [ ] 3.3 Create `libs/shared/storybook-host/.storybook/manager.ts` (optional — theme the Storybook UI w/ the app's brand if trivial; skip if not)
- [x] 3.4 Create `libs/shared/storybook-host/tsconfig.json` that extends the workspace tsconfig and includes `.storybook/*.ts`, `.storybook/*.tsx`
- [x] 3.5 Verify `./nx storybook storybook-host` boots without errors against the 3 existing `.stories.tsx` files

## 4. NX targets

- [x] 4.1 Add `storybook` and `build-storybook` targets to `libs/shared/storybook-host/project.json` per design D7
- [x] 4.2 Do NOT add per-lib Storybook targets to `ui-avatar-grid`, `ui-player-card`, or `ui-custom-keyboard`
- [x] 4.3 Add CI configuration variant: `storybook:ci` (quiet output, fail fast on render error)
- [x] 4.4 Verify `./nx build-storybook storybook-host` produces a static bundle at `dist/storybook/storybook-host/index.html`

## 5. Smoke test existing stories

- [ ] 5.1 Start `./nx storybook storybook-host`; navigate to each of the 3 UI libs in the sidebar
- [ ] 5.2 Confirm `UiAvatarGrid` stories (4 variants) render without runtime errors
- [ ] 5.3 Confirm `UiPlayerCard` stories (idle / armed / confirm / long name) render and the confirm-flow works on mouse click
- [ ] 5.4 Confirm `UiCustomKeyboard` stories (small / medium / large / RTL) render; verify the RTL story flips layout correctly
- [ ] 5.5 Verify the a11y panel shows zero critical errors on the rendered stories (warnings are OK)

## 6. Documentation

- [x] 6.1 Update `AGENTS.md`:
  - Add a "Storybook" bullet under "Required reading" pointing at `docs/TOOLING.md` Storybook section
  - Add to "Known gotchas": react-native-web limitations, expo-* native imports
  - Update "Definition of Done — per change" for `type:ui` changes to mention "story added + visible in storybook-host"
- [x] 6.2 Update `docs/TOOLING.md` Storybook section to name `storybook-host` explicitly:
  - `./nx storybook storybook-host`
  - `./nx build-storybook storybook-host`
  - Delete the old per-lib Storybook example (`./nx storybook <lib>`)
- [x] 6.3 Update `docs/decisions/ADR-010-testing-storybook-plus-unit.md`:
  - Add an "Implementation" section at bottom pointing at `libs/shared/storybook-host/`
  - Note the decision to use the composite pattern + link the NX guide
- [x] 6.4 Update `docs/PROJECT_ORGANIZATION.md`:
  - Add `type:tooling` to the taxonomy table
  - Note: `type:tooling` libs MUST NOT be imported by other libs (enforce via `@nx/enforce-module-boundaries`)
- [x] 6.5 Update `docs/ARCHITECTURE.md` §15 (Testing) to name Storybook-host as the review surface for `ui-*` libs

## 7. Hygiene

- [x] 7.1 Add `dist/storybook/` to root `.gitignore`
- [ ] 7.2 Verify `openspec validate storybook-setup` passes
- [x] 7.3 Verify `npx tsc --noEmit` clean across workspace
- [x] 7.4 Verify `nx affected:lint` clean

## 8. Verification

- [x] 8.1 Cold start: delete `node_modules/.cache/` and run `./nx storybook storybook-host` — confirm a clean boot completes in < 60s
- [x] 8.2 Build: `./nx build-storybook storybook-host` exits 0 and produces `dist/storybook/storybook-host/index.html`
- [ ] 8.3 Serve the static bundle (`npx http-server dist/storybook/storybook-host`) and open in a browser; confirm all stories load
- [x] 8.4 `./nx show project storybook-host` lists `storybook` + `build-storybook` + `lint` targets (plus whatever the generator added)
- [x] 8.5 `./nx show project ui-avatar-grid` does NOT list `storybook` as a target (composite-only pattern enforced)
