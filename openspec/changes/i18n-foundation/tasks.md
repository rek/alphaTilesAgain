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

- [x] 1.1 Generate `libs/shared/util-i18n` via `nx g @nx/js:lib util-i18n --directory=libs/shared/util-i18n --tags='type:util,scope:shared'`
- [x] 1.2 Add `i18next`, `react-i18next`, `expo-localization` to `apps/alphaTiles/package.json`
- [x] 1.3 Add `@nx/enforce-module-boundaries` rule restricting `i18next` / `react-i18next` imports to `util-i18n` only
- [x] 1.4 Add NX tag rule: `type:ui` libs have `bannedExternalImports: ['react-i18next', 'i18next']`

## 2. i18next engine init

- [x] 2.1 Implement `initI18n()` — idempotent setup that:
  - [x] 2.1.1 Reads device locale via `expo-localization.locale`, extracts primary subtag, falls back to `'en'` on malformed input
  - [x] 2.1.2 Reads `BUILD_LANG` from `Constants.expoConfig.extra.appLang`
  - [x] 2.1.3 Calls `i18n.use(initReactI18next).init({ lng, fallbackLng: 'en', ns, defaultNS: 'chrome', resources: { en: { chrome: enChrome } }, missingKeyHandler })`
  - [x] 2.1.4 `missingKeyHandler` throws in `__DEV__`, logs-to-console in production (default i18next key-fallback still fires)
- [x] 2.2 Unit tests:
  - [x] 2.2.1 Init with `en-US` → chrome lookups resolve to English
  - [x] 2.2.2 Init with `zh-TW` (no zh bundle) → chrome lookups fall through to English
  - [x] 2.2.3 Init with `'und'` → init succeeds, English still resolves
  - [x] 2.2.4 `__DEV__` missing chrome key → throws; production missing key → returns key literal

## 3. Seed `locales/en.json`

- [x] 3.1 Create `locales/en.json` at workspace root
- [x] 3.2 Grep `../AlphaTiles/app/src/main/res/values/strings.xml` — copy non-"to be overwritten" strings under `chrome.*`
- [x] 3.3 Grep `../AlphaTiles/app/src/main/java/**/*.java` for hardcoded English in `setText(` / `.setTitle(` / `setContentDescription(` — add any missed keys
- [x] 3.4 Required minimum set (document in comment at top of file, validate in test):
  - [x] 3.4.1 `chrome.back`, `chrome.home`, `chrome.score` (with `{{points}}`)
  - [x] 3.4.2 `chrome.choose_player`, `chrome.set_player_name`
  - [x] 3.4.3 `chrome.tracker_of_total` (with `{{current}}`, `{{total}}`)
  - [x] 3.4.4 `chrome.a11y.tile` (with `{{letter}}`), `chrome.a11y.word` (with `{{word}}`)
  - [x] 3.4.5 `chrome.a11y.active_word_picture`, `chrome.a11y.keyboard_key` (with `{{key}}`), `chrome.a11y.backspace`, `chrome.a11y.alpha_tiles_logo`, `chrome.a11y.tracker` (with `{{current}}`, `{{total}}`)
- [x] 3.5 Unit test that all keys in the required minimum set resolve to non-empty strings
- [x] 3.6 Strings like `localAppName`, `langsAndCountry`, `audioAndPhoto` (marked "to be overwritten" in Android) are NOT copied into `chrome` — they become `langMeta` keys, registered at pack boot

## 4. `registerContentNamespaces`

- [x] 4.1 Implement `registerContentNamespaces({ tile, word, syllable, game, langMeta })`:
  - [x] 4.1.1 For each namespace, first call `i18n.removeResourceBundle(BUILD_LANG, ns)` (clean slate)
  - [x] 4.1.2 Then `i18n.addResources(BUILD_LANG, ns, bundle)`
- [x] 4.2 Unit tests:
  - [x] 4.2.1 After registration, `t('tile:a', { lng: BUILD_LANG })` returns the registered string
  - [x] 4.2.2 Second call replaces — previously-registered ids no longer resolve
  - [x] 4.2.3 Nested keys (`tile:a.upper`) resolve correctly (i18next nests by `.`)

## 5. React bindings

- [x] 5.1 Export `<I18nProvider>` — thin wrapper over `react-i18next`'s `I18nextProvider` that pre-binds the singleton instance
- [x] 5.2 Re-export `useTranslation` from `react-i18next` (for call-site import stability — no one imports `react-i18next` directly outside `util-i18n`)
- [x] 5.3 Implement `useContentT()` — hook returning a callback that wraps `t(key, { lng: BUILD_LANG, ...opts })`
- [x] 5.4 Wire `apps/alphaTiles/src/_layout.tsx` to call `initI18n()` at module load and wrap the tree in `<I18nProvider>`
- [x] 5.5 Unit tests:
  - [x] 5.5.1 `useTranslation` inside `<I18nProvider>` returns a `t` that resolves chrome keys
  - [x] 5.5.2 `useContentT` returns a function that appends `lng: BUILD_LANG` — verified via spy on the underlying `t`

## 6. Lint enforcement

- [x] 6.1 Add ui-lib ban rule; verify by adding a test fixture `ui` lib that imports `react-i18next` → lint fails
- [x] 6.2 Add i18next-source-only rule; verify a `data-access` lib importing `i18next` directly → lint fails

## 7. Validation

- [x] 7.1 `openspec validate i18n-foundation` passes
- [x] 7.2 `npx tsc --noEmit` passes across workspace
- [x] 7.3 `nx run-many -t lint` passes (util-i18n clean; pre-existing alphaTiles react-native lint issue not caused by this change)
- [x] 7.4 Manual: `APP_LANG=eng nx start alphaTiles` boots, `useTranslation()` in a throwaway screen renders `'Back'` for `chrome:back`
- [x] 7.5 Manual: deliberately misspell a chrome key → dev-mode throws with the expected message
