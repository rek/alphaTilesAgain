## Context

Storybook is the only mandatory review vehicle for `type:ui` libraries per ADR-010. The rest of the project's testing strategy is unit tests for pure-logic libs — no Detox, no Playwright. That leaves Storybook carrying visual-review weight for every ui component in the design system.

Three `type:ui` libs already exist (`ui-avatar-grid`, `ui-player-card`, `ui-custom-keyboard`) and have stories authored. The `game-engine-base` change adds four more (`ui-tile`, `ui-game-board`, `ui-celebration`, `ui-score-bar`). Over time more will arrive. A per-lib Storybook (`nx g @nx/storybook:configuration` on each lib) is the NX default, but produces one Storybook per lib — a friction tax on the reviewer who wants to eyeball the whole design system at once.

NX documents a "One Storybook For All" pattern: a single Storybook host project aggregates stories from every lib via a glob in `.storybook/main.ts`. That is the target pattern here.

### Required reading for implementers

- `AGENTS.md`
- `openspec/AGENT_PROTOCOL.md`
- `docs/decisions/ADR-010-testing-storybook-plus-unit.md`
- NX Storybook "One Storybook For All" guide (external, https://nx.dev/docs/technologies/test-tools/storybook/guides/one-storybook-for-all)
- Existing `.stories.tsx` files under `libs/shared/ui-*/src/lib/` (3 examples to preserve).
- **Upstream OpenSpec changes**: none that are in-flight. Depends on several archived changes (theme-fonts, i18n-foundation) for the global decorator configuration.
- **Source Java**: none — no Java source ported in this change.
- **Fixtures**: no language-pack fixture needed. Global decorator uses the `MockThemeProvider` from `util-theme/testing` and seeds i18n with `locales/en.json`.

## Goals / Non-Goals

**Goals:**

- A developer runs `./nx storybook storybook-host` and sees every `ui-*` lib's stories in one browser tab.
- A new `ui-*` lib's stories appear automatically without editing the host config.
- RN primitives (`View`, `Text`, `Pressable`, `Image`, `StyleSheet`, `FlatList`, `ScrollView`) render correctly in the browser via `react-native-web`.
- Global decorators provide theme, i18n, and safe-area context — individual story files don't need to duplicate them.
- `./nx build-storybook storybook-host` produces a deployable static bundle.
- CI can run `build-storybook` as a lint-adjacent gate.

**Non-Goals:**

- On-device Storybook (`@storybook/react-native`). Web rendering is sufficient for review; device test coverage comes from manual QA per change.
- Visual regression infrastructure (Chromatic, Percy, loki). Manual review in v1.
- Per-lib Storybook configs. Explicitly rejected.
- Automating the deployment of the built Storybook static bundle.

## Decisions

### D1. Composite host as a library, not an app

The host lives at `libs/shared/storybook-host/`. NX's guide allows either a library or an app; we choose library because:

- It has no runtime exports — no `src/index.ts` public API. A library typing matches.
- Scope is `shared` (cross-app); tagging as `scope:shared,type:other` (we extend the tag vocabulary minimally for this one case — see D10 below).
- NX generator is the same either way; the mental model is "a config-only project that borrows its runtime from Storybook."

### D2. Storybook framework: `@storybook/react-vite`

Rationale:

- `@nx/vite` is already in the workspace.
- Vite startup is faster than Webpack 5 for small-to-medium story counts.
- React Native for Web works w/ Vite via `vite-plugin-react-native-web` or an explicit alias in `.storybook/main.ts`.

Rejected alternatives:

- `@storybook/react-webpack5`: heavier, slower, more config surface.
- `@storybook/react-native`: requires on-device runner. Out of scope.
- `@storybook/html-vite`: wrong framework (React component stories need React renderer).

### D3. React Native → Web rendering

`.storybook/main.ts` sets Vite resolve aliases:

```ts
resolve: {
  alias: {
    'react-native$': 'react-native-web',
    'react-native/Libraries/Image/AssetRegistry': 'react-native-web/dist/modules/AssetRegistry',
  },
},
```

`react-native-web` is already an app dependency (it's required for `nx web-export alphaTiles`). Storybook reuses the same package.

Limitations to document in `AGENTS.md`:

- Native-only APIs (`Haptics`, `DeviceEventEmitter`, some `Animated` features) may not render in Storybook. Stories SHOULD avoid importing those at module load.
- Native-only visual bugs (Android ripple, iOS haptics paired w/ press states) will not surface in Storybook. Manual device QA is the fallback.
- Fonts: the minority-script fonts are per-language-pack and only present after `./nx prebuild-lang alphaTiles` runs. Storybook intentionally falls back to system fonts — reviewers see layout and interaction, not script fidelity. Document this.

### D4. Story discovery glob

`.storybook/main.ts`:

```ts
stories: [
  '../../*/src/**/*.stories.@(ts|tsx|js|jsx|mdx)',
  '../../../libs/**/src/**/*.stories.@(ts|tsx|js|jsx|mdx)',
],
```

Both patterns because the host's own lib dir sits alongside other shared libs; the glob needs to reach up into `libs/` from `.storybook/`.

New `ui-*` libs place `.stories.tsx` files next to their components — no host config edit needed.

### D5. Global decorators

`.storybook/preview.tsx` wraps every story with:

1. `MockThemeProvider` from `@shared/util-theme/testing` — provides a fixture palette + default font family strings so any story that calls `useTheme()` works.
2. `SafeAreaProvider` from `react-native-safe-area-context` — many RN components expect one in the tree.
3. `I18nProvider` from `@shared/util-i18n` — seeded with the committed `locales/en.json` chrome namespace. Stories use English chrome text. Content namespaces (tile/word/etc.) are NOT seeded — stories that need content must provide their own via a local decorator.

Story-level decorators can override these; component-library code SHOULD render without any extra provider.

### D6. Dependencies

Add to root `package.json` devDependencies:

```jsonc
{
  "@nx/storybook": "22.6.1",            // match existing @nx/* version
  "@storybook/react": "^8.6.0",         // latest stable 8.x
  "@storybook/react-vite": "^8.6.0",
  "@storybook/addon-essentials": "^8.6.0",
  "storybook": "^8.6.0",
  "vite-plugin-react-native-web": "^1.0.0"  // or inline alias per D3 — choose at implementation time
}
```

(Exact versions at implementation time — pin to what's current on npm.)

`react-native-web` and `react-native-safe-area-context` are already app deps; Storybook uses them transitively.

### D7. NX targets

`libs/shared/storybook-host/project.json`:

```json
{
  "targets": {
    "storybook": {
      "executor": "@nx/storybook:storybook",
      "options": {
        "port": 4400,
        "configDir": "libs/shared/storybook-host/.storybook"
      },
      "configurations": {
        "ci": { "quiet": true }
      }
    },
    "build-storybook": {
      "executor": "@nx/storybook:build",
      "outputs": ["{options.outputDir}"],
      "options": {
        "outputDir": "dist/storybook/storybook-host",
        "configDir": "libs/shared/storybook-host/.storybook"
      }
    }
  }
}
```

### D8. CI integration (hook, not full implementation)

This change does not add CI itself — no CI config in repo yet. It documents intent: when CI lands, `nx build-storybook storybook-host` runs on every PR touching a `type:ui` lib. The target's `configurations.ci` makes the command quiet. Actual CI wiring is a follow-up change.

### D9. No per-lib Storybook

No `.storybook/` dirs in individual `ui-*` libs. No per-lib `storybook` targets. If a developer runs `nx storybook ui-avatar-grid`, it should fail with a clear message ("Use `nx storybook storybook-host` — see ADR-010 / storybook-host design"). Easiest: just don't register per-lib targets.

### D10. Project-type tag for the host

The host is config-only. It doesn't fit `app`/`feature`/`ui`/`data-access`/`util`. Options:

- (a) Tag `type:tooling,scope:shared` — a new tag value, but honest about the role.
- (b) Tag `type:util,scope:shared` — lies about the semantics.
- (c) Tag `type:ui,scope:shared` — closest but not quite right; ui libs have runtime exports.

**Chosen**: (a) `type:tooling,scope:shared`. Update `docs/PROJECT_ORGANIZATION.md` with the new tag value in the taxonomy table.

## Risks / Trade-offs

- **[Risk]** `react-native-web` alias config can drift from RN version compatibility. **Mitigation**: pin versions in `package.json`; verify `nx build-storybook` in CI catches regressions at upgrade time.
- **[Risk]** Stories importing `expo-*` modules (expo-image, expo-haptics, expo-av, expo-audio) may fail in Storybook because those packages have native-only exports. **Mitigation**: stories for components that use expo modules should mock at story level (`parameters.mocks`) or swap the expo dep with a web-safe alternative. Document in AGENTS.md.
- **[Risk]** Storybook 8 vs 9 — as of 2026-04-23, Storybook 9 is emerging. We pin to 8.x for `@nx/storybook` compatibility; upgrade deferred.
- **[Trade-off]** Composite host couples all `ui-*` libs into one entry. If Storybook breaks for one, it might break the whole review surface. **Accepted**: easier to fix one surface than many.
- **[Trade-off]** Single vendored `.storybook/preview.tsx` means every story inherits the same global providers. If a future lib needs a conflicting provider, it must override at the story level. **Accepted**: uniform defaults > per-lib customization.
- **[Trade-off]** No on-device Storybook means native-only visual differences (e.g. iOS vs Android `Pressable` feedback) aren't reviewable in Storybook. **Accepted**: manual device QA per change fills that gap.

## Migration Plan

1. Land the host library + deps + targets.
2. Verify `./nx storybook storybook-host` picks up the existing 3 `.stories.tsx` files.
3. Update AGENTS.md and docs/TOOLING.md.
4. Rollback strategy: revert the commit. Stories remain as files, nothing else depends on the host.

No data migration, no user-facing impact.

## Open Questions

- Exact Storybook 8.x minor version to pin — resolve at implementation time.
- Whether to use `vite-plugin-react-native-web` or an inline alias — both work; pick the shorter config at implementation.
- Addon-a11y: add now or defer? A11y is an ADR-level concern (per AGENTS.md). Recommend: add now, low cost, high signal. Decide at implementation.
