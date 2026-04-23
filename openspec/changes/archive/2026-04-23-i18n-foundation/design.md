## Context

ADR-006 establishes the "one i18next, two resolution rules" decision: chrome text follows the device locale (with an English fallback); pack content follows the build language. The key insight: a single `t()` API everywhere removes a mental mode-switch at every string site — the namespace prefix tells the reader which resolution rule applies.

ARCHITECTURE.md §10 pins the namespace list (`chrome`, `tile`, `word`, `syllable`, `game`, `langMeta`) and the key conventions (`tile:<id>`, `tile:<id>.upper`, `tile:<id>.alt1`, `word:<id>.lwc`, etc.). This change is the engine that makes those conventions addressable.

The Android source's string table (`res/values/strings.xml`, ~282 keys) plus the hardcoded English strings in Java activities form the seed for `locales/en.json`. A future JSON-schema for those keys is nice-to-have but out of scope — v1 types keys as `string` and accepts the risk of typos until a codegen step lands.

`data-language-assets` (separate change) is the caller of `registerContentNamespaces` after the pack parses. That lib imports `util-i18n` (util → data-access is fine: the dep goes **from** data-access **to** util per ARCHITECTURE.md §3 rules — data-access is below util, no wait, util is below everything else). Re-checking the rules:

> data-access → util, ui → util, util → nothing.

`util-i18n` is `type:util` and must not import data-access. It exposes a function (`registerContentNamespaces`) that the data-access lib calls. That's directionally correct.

### Required reading for implementers

- `AGENTS.md` — entry doc; read first.
- `openspec/AGENT_PROTOCOL.md` — pickup protocol.
- `docs/ARCHITECTURE.md` §3 (library taxonomy — `util-i18n` is `type:util, scope:shared`), §10 (i18n namespaces + key conventions).
- `docs/decisions/ADR-006-i18n-unified-i18next.md`.
- **Upstream OpenSpec changes (must be merged before starting):**
  - `lang-assets-runtime` — supplies parsed `TileList`, `WordList`, `SyllableList`, `GameList`, `LangInfoList` from which content namespaces are derived.
  - Transitively: `port-foundations`, `lang-pack-parser`.
  - Read `openspec/changes/lang-assets-runtime/design.md` in full.
- **Source Java + Android resource files being ported** (absolute paths):
  - `../AlphaTiles/app/src/main/res/values/strings.xml` (~282 keys) — the seed for `locales/en.json`.
  - `../AlphaTiles/app/src/main/java/org/alphatilesapps/alphatiles/` — hardcoded English strings scattered across activities; grep for `getString(R.string.…)` and string literals in `setText(…)` calls.
  - `../AlphaTiles/app/src/main/java/org/alphatilesapps/alphatiles/LangInfoList.java` — the canonical Item labels used for `langMeta:` namespace keys.
- **Fixture paths** (absolute, under `../PublicLanguageAssets/`):
  - `../PublicLanguageAssets/engEnglish4/res/raw/aa_gametiles.txt` — tile id keys.
  - `../PublicLanguageAssets/engEnglish4/res/raw/aa_wordlist.txt` — word id + `lwc` text.
  - `../PublicLanguageAssets/engEnglish4/res/raw/aa_syllables.txt` — syllable id keys.
  - `../PublicLanguageAssets/engEnglish4/res/raw/aa_games.txt` — game id + display label.
  - `../PublicLanguageAssets/engEnglish4/res/raw/aa_langinfo.txt` — `langMeta:` seeds.
  - `../PublicLanguageAssets/tpxTeocuitlapa/res/raw/aa_*.txt` — diacritics parity fixture (verifies Unicode round-trip through i18next).

## Goals / Non-Goals

**Goals:**

- One `t()` call site everywhere a string is rendered. No custom lookup helpers anywhere else.
- Chrome strings default to English, with the door open for future locales via drop-in JSON files.
- Content strings register post-pack-parse via one function call; no engine reconfig per pack.
- `type:ui` libs never see `react-i18next` — enforced by lint.
- Dev-mode missing-key behavior is loud (throws); production is quiet (renders the key).
- A translator can add `locales/es.json` without touching engine code.

**Non-Goals:**

- Generated typed key unions (codegen). Out of scope — v1 types keys as `string`. A later change can add `npx i18next-types` or similar.
- Pluralization authoring. i18next supports it, but v1 chrome keys are all singular forms. If a key needs plurals, we use i18next's built-in `count` interpolation — no extra setup.
- RTL mixed-direction glyph handling. That's a React Native text rendering concern, not an i18n concern.
- Full localization of the chrome into a minority language. v1 ships `en.json` only. Adding a locale is a one-file PR.
- Hot locale swap at runtime. If a user changes device locale mid-session, they rebirth the app — React Native doesn't auto-reload strings anyway.
- A custom `<Trans>` component variant. Standard `react-i18next` `Trans` is sufficient; call sites that need HTML-like interpolation use it directly.

## Decisions

### D1. Two-language scheme

i18next is configured with:

```ts
i18n.init({
  lng: deviceLocale,                         // from expo-localization
  fallbackLng: 'en',
  ns: ['chrome', 'tile', 'word', 'syllable', 'game', 'langMeta'],
  defaultNS: 'chrome',
  resources: {
    en: { chrome: en_chrome_bundle },
    // content namespaces registered later via registerContentNamespaces
  },
});
```

Chrome lookups (`t('chrome:back')`) resolve against `deviceLocale` with `en` fallback. Content lookups (`t('tile:a')`) must specify `lng: BUILD_LANG` — or use the `useContentT()` hook which pre-binds it.

`BUILD_LANG` comes from `Constants.expoConfig.extra.appLang` (set by `app.config.ts` from the `APP_LANG` env var).

### D2. Namespace list and key conventions

Per ARCHITECTURE.md §10:

- `chrome` — UI strings. Sourced from `locales/en.json` (device-locale fallback chain).
- `tile` — tile display text. Keys: `<id>`, `<id>.upper`, `<id>.alt1`, `<id>.alt2`, `<id>.alt3`. Source: `aa_gametiles.txt` columns.
- `word` — word display text. Keys: `<id>`, `<id>.lwc`. Source: `aa_wordlist.txt` columns (LOP and LWC).
- `syllable` — syllable display text. Keys: `<id>`. Source: `aa_syllables.txt`.
- `game` — game instruction text. Keys: `<doorNumber>.instruction`. Source: `aa_games.txt`.
- `langMeta` — language metadata. Keys: `name_local`, `name_english`, `player_word`, etc. Source: `aa_langinfo.txt`.

Ids for content:

- Tile id = `aa_gametiles.txt` column 0 (the `tiles` field — the display text itself, used as id since it's unique within a pack).
- Word id = `aa_wordlist.txt` LOP column (Language of Play — the primary word text).
- Syllable id = its text (same logic as tile).
- Game id = door number (`aa_games.txt` door number column, stringified).

Collision policy: ids are strings from pack columns. If two rows of `aa_gametiles.txt` have the same `tiles` text, the validator (ADR-008) flags it before we get here.

### D3. Seed `locales/en.json` from Android source

The seeding task grep's two sources:

1. `../AlphaTiles/app/src/main/res/values/strings.xml` — 282 keyed strings. Flatten into `chrome.<camelCaseKey>`.
2. Hardcoded English strings in major activities via `grep 'setText(' ../AlphaTiles/app/src/main/java/**/*.java`. Extract literals, assign semantic chrome keys by manual review.

Not everything in `strings.xml` becomes a chrome key — some of those are meant to be overwritten at runtime by pack data (`localAppName`, `langsAndCountry`, `audioAndPhoto`). Those stay in `langMeta`, not `chrome`. The seeding task distinguishes by reading the value: strings that look like "To be overwritten …" are `langMeta` keys, real chrome text goes to `chrome`.

Required keys at minimum (ARCHITECTURE.md §10 examples + `strings.xml` essentials):

- `chrome.back`
- `chrome.score` (with `{{points}}` interpolation)
- `chrome.choose_player`
- `chrome.set_player_name`
- `chrome.home`
- `chrome.tracker_of_total` (with `{{current}}`, `{{total}}`)
- `chrome.a11y.tile` (with `{{letter}}`)
- `chrome.a11y.word` (with `{{word}}`)
- `chrome.a11y.active_word_picture`
- `chrome.a11y.keyboard_key` (with `{{key}}`)
- `chrome.a11y.backspace`
- `chrome.a11y.alpha_tiles_logo`
- `chrome.a11y.tracker` (with `{{current}}`, `{{total}}`)
- `chrome.keyboard_01`–`chrome.keyboard_25` OR a single interpolated variant (decision: single variant — `chrome.a11y.keyboard_key` with `{{key}}`. The tracker-of-12 set follows the same pattern.)

Naming: snake_case. i18next supports deep keys via `.` separators; we use them freely (`chrome.a11y.tile`).

### D4. `registerContentNamespaces` seam

```ts
export function registerContentNamespaces(input: {
  tile: Record<string, string>;            // flat — e.g. { 'a': 'a', 'a.upper': 'A' }
  word: Record<string, string>;
  syllable: Record<string, string>;
  game: Record<string, string>;
  langMeta: Record<string, string>;
}): void;
```

Each param is a flat `Record<string, string>` where the key is already the fully-qualified sub-key (`'a.upper'`) and the value is the display text. Internally:

```ts
i18n.addResources(BUILD_LANG, 'tile', input.tile);
i18n.addResources(BUILD_LANG, 'word', input.word);
// ...
```

Called once per pack boot. If called twice (e.g. dev hot-reload), the second call replaces the first — `addResources` merges by default but we want clean replacement on pack swap. Implementation: call `i18n.removeResourceBundle(BUILD_LANG, ns)` first, then `addResources`.

Alternative: expose the parsed content as a single Provider Context rather than through i18next. **Rejected** per ADR-006 — splits the lookup API.

### D5. `useContentT()` ergonomic wrapper

```ts
export function useContentT() {
  const { t } = useTranslation();
  return useCallback(
    (key: string, opts?: TOptions) => t(key, { lng: BUILD_LANG, ...opts }),
    [t]
  );
}
```

Call sites: `const tContent = useContentT(); tContent('tile:a');` versus the verbose `t('tile:a', { lng: BUILD_LANG })`. Feature containers adopt this hook for any content lookup; chrome lookups use plain `useTranslation`.

### D6. `type:ui` libs can't import `react-i18next`

ARCHITECTURE.md §10 mandates ui libs are i18n-blind. Enforcement: NX tag rule in `eslint.config.js`:

```js
{
  sourceTag: 'type:ui',
  onlyDependOnLibsWithTags: ['type:util'],
  bannedExternalImports: ['react-i18next', 'i18next'],
}
```

Storybook stories pass raw strings as props — no i18n provider needed (ADR-010).

### D7. Missing-key behavior

- **Dev mode**: `i18n.init({ missingKeyHandler: (lngs, ns, key) => { throw new Error(`Missing i18n key: ${ns}:${key}`); } })`. Crashes loudly, catches typos early.
- **Production**: i18next's default fallback to the key string. `chrome:back` renders as `chrome:back` in the UI — a visible bug. We don't ship this; the dev-mode throw catches it first.

Content namespaces have no fallback — the validator ensures every referenced id exists.

### D8. Device locale detection

`expo-localization.locale` returns e.g. `en-US` or `zh-TW`. We use the primary language subtag (`en`) for lookup since our chrome resources are per-primary-language only. Region-specific variants are out of scope (`en-GB` would resolve to `en` via fallback).

### D9. `locales/` lives at workspace root

`locales/en.json` at the repo root, not inside `libs/shared/util-i18n/` or `apps/alphaTiles/`. Rationale:

- Translators don't care about NX layout — `locales/` is where contributions go, full stop.
- The file is cross-app should a second app exist (scope:shared).
- Metro needs an explicit bundler-friendly `require('../../../locales/en.json')` from inside `util-i18n` — acceptable, JSON files bundle cleanly.

### D10. Typed-t deferred

A type-safe `t()` signature requires a generated union of all `chrome.*` keys. Generation is out of scope here — v1 types `t(key: string, opts?: TOptions): string`. If a chrome key is misspelled at the call site, runtime throws in dev (D7). Revisit when call-site volume justifies codegen.

## Risks / Trade-offs

- **[Risk]** Seeded `en.json` misses a chrome key used by a screen that hasn't been ported yet. **Mitigation**: dev-mode throw catches it at first render; add the key, done. No blocker.
- **[Risk]** Pack content id collision (two tiles named "a"). **Mitigation**: validator (ADR-008) catches it. Not this change's problem.
- **[Risk]** `expo-localization` returns an unexpected locale format (`und`, `C`). **Mitigation**: fallback to `en` immediately — we only consume the primary subtag anyway.
- **[Risk]** Dev-mode missing-key throw fires during hot-reload if a newly-added key hasn't been saved to `en.json` yet. **Accepted**: 5-second annoyance, caught at dev time — exactly the point.
- **[Trade-off]** `useContentT()` vs. expecting call sites to write `t('tile:a', { lng: BUILD_LANG })`. **Hook wins** — less repetition, less chance of forgetting the `lng`.
- **[Trade-off]** One i18next instance for two scopes vs two instances. **One instance** — simpler boot, single provider, namespace prefix as the mental switch per ADR-006.
- **[Trade-off]** No codegen typed-t in v1. **Accepted** — call-site count in v1 is low; typo risk is caught in dev.

## Open Questions

- Should `chrome.a11y.*` keys use a nested `a11y` subtree or a flat `a11y_` prefix? **Nested** — i18next handles nested objects natively. Decided.
- What's the final list of chrome keys? The seeding task walks the Android source; exact count TBD during task 3. **Defer** — task is "seed, then review." 40–60 keys expected.
- A future ESLint rule to ban string-literal JSX children in `type:feature` files (nudge toward `t()`). **Out of scope** for this change — possibly a follow-up after real usage patterns settle.
