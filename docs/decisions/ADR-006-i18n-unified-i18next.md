# ADR-006: Unified i18n — i18next for Chrome and Pack Content

**Date**: 2026-04-23
**Status**: Accepted

## Context

The app has two kinds of display strings:

1. **Chrome strings** — UI text around gameplay. Buttons ("Back", "Score: 42"), labels, a11y hints. These should resolve to the **device locale** (an English-speaking user in a Cantonese build still reads "Back" in English; a Spanish-speaking user sees "Atrás").

2. **Pack-content strings** — tile text, word text, syllable text, game instructions in the target language. These resolve to the **build language** (always Cantonese in a Cantonese build, regardless of device locale).

Two different resolution rules, same app, same components. A naïve split (i18next for chrome, custom map for content) creates two lookup APIs and a cross-cutting worry every time a component needs a string. A single system with namespaces elegantly supports both.

Non-string pack data (audio handles, image `require()`s, fonts, stages, settings) is **not** a localization concern — it's asset data. It lives in the `LangAssetsProvider` Context (ADR-004), not in i18next.

## Decision

i18next handles **both** chrome and pack content via separate namespaces. One library, one `t()` API, two resolution rules keyed by namespace.

- **Chrome namespace** (`chrome`) — loaded from committed JSON (`locales/en.json`, future `locales/es.json`, …). Resolved against the **device locale**. English fallback.
- **Content namespaces** (`tile`, `word`, `syllable`, `game`, `langMeta`) — registered at boot from the parsed language pack via `i18n.addResources(BUILD_LANG, ns, data)`. Resolved against the **build language** (`APP_LANG`).

Non-string pack data stays in `LangAssetsProvider` and is **never** routed through i18next.

## Rationale

A unified lookup API means every display-string site in the codebase is `t('<ns>:<key>', { params })`. No mental mode-switch between "is this chrome or content?" at call sites — the namespace prefix says it. Future full localization (chrome translated to the local language of wider communication) is a matter of adding JSON files, not rearchitecting.

### Pros

- One `t()` API everywhere. Feature code is uniform.
- Namespace prefix self-documents resolution rule.
- Interpolation, pluralization, a11y-label formatting — all free from i18next.
- `locales/` JSON is git-tracked and translator-friendly.
- Adding a chrome locale = drop a JSON file. No engine change.
- Content namespaces are wiped + re-registered per language pack at boot — clean seam.

### Cons

- i18next has nontrivial boot config (namespace list, fallback lang, resource loader). One-time cost.
- Newcomers must learn the namespace convention.
- Two resolution languages in one library is slightly unusual — requires explicit `lng:` override on content lookups. Mitigated by convention: `t('tile:a')` implicitly means content-lang.

## Alternatives Considered

### Alternative 1: Two systems — i18next for chrome, custom map for content

i18next owns UI strings; a plain `Record<string, string>` inside `LangAssetsProvider` owns content strings. Component calls `t('back')` for chrome and `assets.tiles['a'].text` for content.

- **Why not**: Inconsistent lookup API. Every feature component either reads two APIs or wraps them. Accessibility labels that mix chrome and content ("Tile {letter}") need manual string glue. Future "translate the UI into the pack's language" requires rebuilding the custom layer.

### Alternative 2: Pure custom lookup for everything

No i18next. A tiny `t(key)` function over a merged Record.

- **Why not**: Reinvents interpolation, pluralization, namespacing, fallback, and locale detection. All solved problems that i18next handles.

### Alternative 3: i18next for everything, no split

One namespace, treat device-locale chrome and build-lang content as the same.

- **Why not**: Mixes resolution rules — a user's device locale would suddenly matter for tile rendering. Breaks the per-language-build promise.

### Alternative 4: Platform native i18n APIs (Intl / ICU)

Use `Intl.MessageFormat` directly.

- **Why not**: React Native support is patchy (Hermes Intl is partial on Android). i18next wraps this cleanly with a cross-platform fallback.

## Consequences

### Positive

- Every display string in the app is `t(…)`. Grepping for hardcoded English strings (see `docs/ARCHITECTURE.md` §10 invariants) is mechanical.
- A11y labels unify: `accessibilityLabel={t('chrome:a11y.tile', { letter: t('tile:a') })}`.
- The "UI chrome in the community's own language" feature drops in later as a JSON contribution, no engine change.
- Storybook stories for `type:ui` libs pass raw strings — no i18n provider in those stories (ADR-010).

### Negative

- Content namespaces need an explicit lang override in the `t()` call (or a pre-configured per-namespace `lng` map). Document the convention.
- Missing content key during boot (pack missing a tile) — validator catches most of these (ADR-008); runtime has a fallback-to-key default.

### Neutral

- `libs/alphaTiles/data-i18n` owns boot wiring: namespace list, locale detection, content-namespace registration from parsed pack.
- `type:ui` libraries remain i18n-blind (`docs/ARCHITECTURE.md` §10) — they accept strings as props. Containers call `t()`.

## Implementation Notes

- Boot order: detect device locale → init i18next with chrome namespace loaded from JSON → parse pack → `i18n.addResources(BUILD_LANG, 'tile', tileMap)` and same for `word`, `syllable`, `game`, `langMeta` → signal ready → mount app.
- Per-namespace lng convention:
  ```ts
  // chrome uses device locale (i18next default)
  t('chrome:back');
  // content uses build lang (explicit lng override or namespace-scoped default)
  t('tile:a', { lng: BUILD_LANG });
  ```
  Consider wrapping `t` in a `useContentT()` hook that defaults `lng` to `BUILD_LANG` for ergonomics.
- Content keys follow `docs/ARCHITECTURE.md` §10 conventions (`tile:<id>`, `tile:<id>.upper`, `word:<id>`, `word:<id>.lwc`, `syllable:<id>`, `game:<doorNumber>.instruction`, `langMeta:<field>`).
- Chrome defaults in `apps/alphaTiles/locales/en.json`. Additional locales are drop-in.
- Missing-key handling: dev mode throws; production falls back to the key (`'chrome:back'` rendering in-place is a visible bug).
- ESLint rule (future): flag JSX string literals that aren't obviously constant, nudging toward `t()`.

## References

- `docs/ARCHITECTURE.md` §6 (runtime data flow), §10 (i18n conventions)
- i18next docs (namespaces, resource loading, lng override)
- ADR-003 (asset bundling) — non-string pack data in the manifest
- ADR-004 (state management) — `LangAssetsProvider` vs. i18next boundary
- ADR-010 (testing) — `type:ui` stories pass raw strings (no i18n)
