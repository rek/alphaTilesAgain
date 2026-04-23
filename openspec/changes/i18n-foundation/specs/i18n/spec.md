## ADDED Requirements

### Requirement: Single i18next instance with six namespaces

The codebase SHALL expose exactly one i18next instance (from `libs/shared/util-i18n`) configured with namespaces `chrome`, `tile`, `word`, `syllable`, `game`, and `langMeta`. `defaultNS` MUST be `chrome`. `fallbackLng` MUST be `'en'`.

#### Scenario: Namespace list at init

- **WHEN** the i18next instance is initialized
- **THEN** calling `i18n.reportNamespaces.getUsedNamespaces()` (or equivalent) returns the set `{ 'chrome', 'tile', 'word', 'syllable', 'game', 'langMeta' }`

#### Scenario: Only one instance

- **WHEN** any module imports from `i18next` directly (other than `libs/shared/util-i18n` internals)
- **THEN** the lint step fails with a boundary violation — only `util-i18n` may import `i18next`

### Requirement: Chrome resolves against device locale with English fallback

Chrome lookups (`t('chrome:<key>')`) SHALL resolve against the device's primary language subtag (from `expo-localization`) with `'en'` as the fallback. Unrecognized or malformed locales MUST fall through to `'en'` without throwing.

#### Scenario: English device

- **WHEN** `expo-localization.locale` is `'en-US'` and `t('chrome:back')` is called
- **THEN** the value returned is the `en` resource's `chrome.back` value (`'Back'`)

#### Scenario: Unsupported locale falls back to English

- **WHEN** `expo-localization.locale` is `'zh-TW'` and no `zh` resources are registered
- **THEN** `t('chrome:back')` returns the English value (`'Back'`)

#### Scenario: Malformed locale

- **WHEN** `expo-localization.locale` returns `'und'` or `'C'`
- **THEN** the engine initializes without error and `t('chrome:back')` returns the English value

### Requirement: Content namespaces register at boot

`registerContentNamespaces({ tile, word, syllable, game, langMeta })` SHALL accept five flat `Record<string, string>` maps and register each one under the build language (`BUILD_LANG`) via `i18n.addResources`. Calling it a second time (e.g. pack swap during dev) MUST replace the previous bundle for each namespace, not merge.

#### Scenario: First registration

- **WHEN** `registerContentNamespaces({ tile: { 'a': 'a', 'a.upper': 'A' }, word: {...}, syllable: {...}, game: {...}, langMeta: {...} })` is called with `BUILD_LANG = 'eng'`
- **THEN** `t('tile:a', { lng: 'eng' })` returns `'a'` and `t('tile:a.upper', { lng: 'eng' })` returns `'A'`

#### Scenario: Re-registration replaces, does not merge

- **WHEN** `registerContentNamespaces` is called with `{ tile: { 'b': 'b' } }` after a first call that included `{ 'a': 'a' }`
- **THEN** `t('tile:b')` returns `'b'` and `t('tile:a')` misses (does not return the stale value)

### Requirement: `useContentT()` ergonomic hook

`useContentT()` SHALL return a function with the same signature as `t` but with `lng` pre-bound to `BUILD_LANG`. Chrome namespace lookups through this hook MUST still resolve correctly (explicit `lng: BUILD_LANG` doesn't corrupt chrome fallback because chrome resources are keyed under `en` which differs from `BUILD_LANG` by design — this scenario should use regular `useTranslation`).

#### Scenario: Content lookup via useContentT

- **WHEN** a component calls `const tContent = useContentT(); tContent('tile:a')` with `BUILD_LANG = 'eng'`
- **THEN** the returned value is the `eng`-resource tile `a` text

#### Scenario: Call sites choose the right hook

- **WHEN** a container needs both chrome and content strings
- **THEN** it uses `const { t } = useTranslation()` for chrome and `const tContent = useContentT()` for content

### Requirement: `type:ui` libraries are i18n-blind

Libraries tagged `type:ui` SHALL NOT import `react-i18next` or `i18next`. They accept translated strings as props only. Enforcement is via NX tag rule `bannedExternalImports`.

#### Scenario: ui lib imports react-i18next

- **WHEN** a `type:ui` lib adds `import { useTranslation } from 'react-i18next'`
- **THEN** the lint step fails with the specific banned-import error

#### Scenario: Container passes strings to presenter

- **WHEN** a `type:feature` container renders its `type:ui` presenter
- **THEN** all translated strings are passed as props, and the presenter renders them directly without calling any translation API

### Requirement: Missing-key handling — loud in dev, visible in production

In `__DEV__` mode, a call to `t()` with a missing key SHALL throw an `Error` whose message names the namespace and key. In production mode, it SHALL return the key string itself (e.g. `'chrome:back'`) which will render visibly in the UI.

#### Scenario: Dev mode missing key

- **WHEN** `__DEV__` is true and `t('chrome:nonexistent_key')` is called with no such key registered
- **THEN** an Error is thrown with a message containing `'chrome'` and `'nonexistent_key'`

#### Scenario: Production missing key

- **WHEN** `__DEV__` is false and `t('chrome:nonexistent_key')` is called
- **THEN** the return value is `'chrome:nonexistent_key'` (the key literal)

### Requirement: Chrome defaults in `locales/en.json` include minimum key set

`locales/en.json` SHALL exist at the workspace root and contain at least the following chrome keys: `back`, `score` (with `{{points}}`), `choose_player`, `set_player_name`, `home`, `tracker_of_total` (with `{{current}}` and `{{total}}`), and the `a11y` sub-tree with at least `tile`, `word`, `active_word_picture`, `keyboard_key`, `backspace`, `alpha_tiles_logo`, `tracker`.

#### Scenario: Essential chrome keys present

- **WHEN** `locales/en.json` is parsed at boot
- **THEN** `t('chrome:back')`, `t('chrome:score', { points: 42 })`, `t('chrome:choose_player')`, and `t('chrome:a11y.tile', { letter: 'a' })` all return non-empty strings

#### Scenario: Interpolation works

- **WHEN** `t('chrome:score', { points: 42 })` is called
- **THEN** the returned string contains `'42'` (interpolation applied)

### Requirement: `I18nProvider` wraps `react-i18next` provider

`<I18nProvider>` SHALL be the sole `react-i18next` provider in the app, mounted inside `apps/alphaTiles/src/_layout.tsx`. Consumers of `useTranslation` MUST render inside this provider.

#### Scenario: useTranslation outside provider

- **WHEN** a component calls `useTranslation()` without being wrapped in `<I18nProvider>`
- **THEN** an error is surfaced naming the missing provider (standard `react-i18next` behavior)

#### Scenario: Provider wraps the app tree

- **WHEN** `apps/alphaTiles/src/_layout.tsx` mounts
- **THEN** its children render inside `<I18nProvider>` and can call `useTranslation()` successfully
