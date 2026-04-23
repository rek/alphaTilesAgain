## ADDED Requirements

### Requirement: Single composite Storybook host

The project SHALL provide exactly one Storybook host library (`libs/shared/storybook-host/`) that aggregates stories from every `type:ui` library in the workspace. Individual `type:ui` libraries MUST NOT have their own Storybook configuration directories or `storybook`/`build-storybook` NX targets.

#### Scenario: Developer starts Storybook

- **WHEN** a developer runs `./nx storybook storybook-host`
- **THEN** a Storybook dev server starts at port 4400
- **AND** the "Stories" sidebar lists every `.stories.tsx` file discovered under `libs/**/src/**/*.stories.@(ts|tsx|js|jsx|mdx)`

#### Scenario: Developer attempts per-lib Storybook

- **WHEN** a developer runs `./nx storybook ui-avatar-grid`
- **THEN** the command fails because no `storybook` target exists on the library project
- **AND** the error message directs the developer to `nx storybook storybook-host`

### Requirement: React Native components render via react-native-web

The Storybook host SHALL render React Native primitives (`View`, `Text`, `Pressable`, `Image`, `StyleSheet`, `FlatList`, `ScrollView`) in the browser via the `react-native-web` alias. Story authors MUST NOT write browser-specific fallback code in `.stories.tsx` files; the host provides the aliasing.

#### Scenario: Component uses `Pressable`

- **WHEN** a `ui-*` component story imports `Pressable` from `react-native`
- **AND** renders it in a story
- **THEN** the rendered output is a browser-native `<div>` element wrapped by `react-native-web`'s `Pressable` implementation
- **AND** a mouse click fires the component's `onPress` callback

#### Scenario: Component uses `StyleSheet.create`

- **WHEN** a `ui-*` component applies `StyleSheet.create`-generated styles
- **THEN** those styles render as CSS rules in the browser matching the declared RN style properties

### Requirement: Story discovery by glob

The host's `.storybook/main.ts` SHALL discover stories via a glob that covers every lib in the workspace. Adding a new `.stories.tsx` file anywhere under `libs/**/src/` MUST NOT require editing the host config.

#### Scenario: New story file

- **WHEN** a developer creates `libs/shared/ui-tile/src/lib/UiTile.stories.tsx`
- **AND** restarts `./nx storybook storybook-host`
- **THEN** the new stories appear in the sidebar without any other change

### Requirement: Global decorators for theme, i18n, safe area

Every story SHALL render inside a provider tree that includes `MockThemeProvider` (from `@shared/util-theme/testing`), `I18nProvider` seeded with `locales/en.json` chrome namespace, and `SafeAreaProvider` from `react-native-safe-area-context`. Story authors MUST NOT duplicate these providers in individual story files.

#### Scenario: Story calls `useTheme`

- **WHEN** a story renders a component that calls `useTheme()`
- **THEN** the hook resolves to the mock theme provided by `MockThemeProvider` without additional setup

#### Scenario: Story needs content i18n namespace

- **WHEN** a story renders a component that calls `t('tile:a')`
- **AND** no story-level decorator registers the content namespace
- **THEN** the lookup fails in dev mode (consistent with i18n-foundation's missing-content-key policy)
- **AND** the story author receives a clear error directing them to add a local decorator registering the needed namespace

### Requirement: Static build output

`./nx build-storybook storybook-host` SHALL produce a static bundle under `dist/storybook/storybook-host/` suitable for deployment. The bundle MUST be self-contained (no references to workspace-local paths at runtime).

#### Scenario: Static build

- **WHEN** `./nx build-storybook storybook-host` runs to completion
- **THEN** `dist/storybook/storybook-host/index.html` exists
- **AND** opening that file in a browser (via a static file server) loads Storybook with every story discoverable

#### Scenario: CI consumption

- **WHEN** a future CI pipeline invokes `nx build-storybook storybook-host --configuration=ci`
- **THEN** the build runs quietly (no interactive output) and exits non-zero on any story render error

### Requirement: Documentation updated

The change SHALL update `AGENTS.md`, `docs/TOOLING.md`, `docs/PROJECT_ORGANIZATION.md`, and `docs/decisions/ADR-010-testing-storybook-plus-unit.md` to reflect the new Storybook workflow. Anyone onboarding after this change MUST find the Storybook run command in `docs/TOOLING.md` and the architecture rules in `AGENTS.md`.

#### Scenario: Fresh agent reads AGENTS.md

- **WHEN** a fresh agent reads `AGENTS.md`
- **THEN** the agent learns that Storybook is run from `storybook-host`, not per-lib
- **AND** the agent learns that native-only visual regressions are NOT caught by Storybook (manual QA needed)

#### Scenario: Fresh agent reads TOOLING.md

- **WHEN** a fresh agent reads `docs/TOOLING.md`
- **THEN** the agent finds `./nx storybook storybook-host` and `./nx build-storybook storybook-host` listed under a Storybook section
