## Why

ARCHITECTURE.md §6, §10 and ADR-006 lock in a two-language scheme: **chrome** UI strings resolve against the device locale (so an English-speaker in a Cantonese build sees "Back" in English), while **pack content** (tile/word/syllable/game/langMeta) resolves against the build language regardless of device. Both are served by a single i18next instance with namespaces. No other lib can be built correctly until this foundation exists — every screen, every game, every `type:feature` container calls `t(...)`.

Without this change, screens hardcode English strings; pack content has no registration seam; a future translator contributing a chrome locale file has nowhere to drop it. The 282 `<string name=…>` entries in the Android `strings.xml` plus the hardcoded strings sprinkled through `MainActivity.java` and its 17 game activities need a single destination (`locales/en.json`) before any screen port can begin.

## What Changes

- Add `libs/shared/util-i18n` (`type:util`, `scope:shared`) — i18next instance, namespace registry, React bindings via `react-i18next`.
- Initialize i18next with namespaces `chrome`, `tile`, `word`, `syllable`, `game`, `langMeta`. English is the chrome fallback; `BUILD_LANG` (from `APP_LANG` env) is the content language.
- Add `expo-localization` dep to detect the device locale.
- Add `locales/en.json` at the workspace root — chrome defaults seeded from the Android `strings.xml` and the hardcoded English strings in major activities. Schema matches ARCHITECTURE.md §10.
- Expose `registerContentNamespaces({ tile, word, syllable, game, langMeta })` — a function that calls `i18n.addResources(BUILD_LANG, ns, data)` for each content namespace. Called at boot by `data-language-assets` (downstream change) once the pack is parsed.
- Expose `<I18nProvider>` wrapping `react-i18next`'s provider — keeps the `react-i18next` import contained here.
- Expose `useTranslation()` re-export from `react-i18next` (to keep the dep single-sourced).
- Expose `useContentT()` hook — wrapper over `useTranslation` that defaults `lng` to `BUILD_LANG` so call sites write `t('tile:a')` without the `{ lng: … }` override every time.
- `type:ui` libraries are prohibited from importing `react-i18next` (per ARCHITECTURE.md §10) — enforced via NX tag rules.

## Capabilities

### New Capabilities

- `i18n`: a single i18next instance configured with a device-locale → English-fallback chrome namespace and a build-language-scoped set of content namespaces; a seeded `locales/en.json`; a `registerContentNamespaces` seam for the pack loader; `useTranslation` + `useContentT` hooks; enforcement that `type:ui` libs stay i18n-blind.

### Modified Capabilities

_None_ — first i18n change.

## Impact

- **New lib**: `libs/shared/util-i18n/` (source, project.json, unit tests).
- **New deps**: `i18next`, `react-i18next`, `expo-localization` in `apps/alphaTiles/package.json`.
- **New file**: `locales/en.json` at workspace root — seeded chrome strings.
- **App shell edit**: `apps/alphaTiles/src/_layout.tsx` wraps the tree in `<I18nProvider>`.
- **Downstream unblocks**: `data-language-assets` (calls `registerContentNamespaces` after parse), `loading-screen`, every `type:feature` container.
- **No breaking changes** — additive.
- **Risk**: missing chrome key at runtime renders the key literal (e.g. `chrome:back`) which is a visible bug; dev mode `throws` on miss.
