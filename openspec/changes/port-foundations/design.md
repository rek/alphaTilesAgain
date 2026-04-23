## Context

The AlphaTiles port must produce **per-language binaries** (one APK / IPA / web bundle per language pack) from a **single codebase**, with **language content sourced from an external repository** (`PublicLanguageAssets`, sibling to this one) that has an independent release cadence owned by the content team. The build pipeline is therefore the first architectural surface that must be right — every downstream change (parser, validator, audio, engine, games) assumes that by the time it runs:

1. A language pack has been materialized at `languages/<APP_LANG>/`.
2. That pack has been structurally validated.
3. A typed TS manifest has been emitted that exposes every asset via statically-analyzable `require()` calls.
4. `app.config.ts` has resolved the build-time identity (appId suffix, display name, RTL flag, icon/splash) from the pack.

This change establishes that pipeline. It also writes the overview architecture doc (`docs/ARCHITECTURE.md`) and the ten foundational ADRs that govern the port.

### Required reading for implementers

- `AGENTS.md` — entry doc; read first.
- `docs/ARCHITECTURE.md` §2 (monorepo layout), §4 (per-language build pipeline), §5 (language pack shape).
- ADRs 001–010 (this change writes them; read any in-flight drafts under `docs/decisions/`).
- **Upstream OpenSpec changes:** none (batch 1, no deps).
- **Source Java files being ported** (absolute paths):
  - `../AlphaTiles/app/build.gradle` — Android flavor config (one flavor per language); the source-of-truth for bundle-id suffixes.
  - `../AlphaTiles/app/src/main/res/raw/aa_gametiles.txt` (reference layout — per-pack copy).
  - `../AlphaTiles/app/src/main/java/org/alphatilesapps/alphatiles/Start.java` — asset-loading entry point; skim to understand runtime expectations.
- **Fixture paths** (absolute, under `../PublicLanguageAssets/`):
  - `../PublicLanguageAssets/engEnglish4/res/raw/aa_*.txt` — primary dev fixture.
  - `../PublicLanguageAssets/tpxTeocuitlapa/res/raw/aa_*.txt` — faithfulness fixture (Roman+diacritics).
  - `../PublicLanguageAssets/templateTemplate/` — empty template fixture used by the placeholder validator.
  - `../PublicLanguageAssets/engEnglish4/res/font/*.ttf`, `res/drawable-xxxhdpi/`, `res/drawable/` — shape reference for rsync classification.

## Goals / Non-Goals

**Goals:**

- A developer can run `APP_LANG=eng nx start alphaTiles` and get a working Metro server against the English pack.
- CI can run `APP_LANG=eng eas build --profile eng` and produce a build.
- The `PublicLanguageAssets` repo remains the content team's workspace — no asset files are ever committed to this repo.
- Every future change has a single source-of-truth architecture doc (`docs/ARCHITECTURE.md`) and a clear decision record (`docs/decisions/ADR-*`) to reference.
- The prebuild pipeline fails fast and loud on any malformed input.
- The `langManifest.ts` emitted by the generator is Metro-friendly (static `require()` literals) and TypeScript-friendly (typed, one concrete type per asset category).
- The pipeline is reproducible — same inputs always produce the same manifest.

**Non-Goals:**

- Writing the validator (it's a multi-week port; `lang-pack-validator` change handles it). This change wires a placeholder call that succeeds trivially for now.
- Writing the parser (`lang-pack-parser`). The manifest generator only emits `require()` calls and raw-string imports of the `aa_*.txt` files; actual parsing is downstream.
- Any runtime code in `apps/alphaTiles/`. The app shell stays empty (blank screen) until the `lang-assets-runtime` and `loading-screen` changes populate it.
- Hot-reload of a language pack change. Pack-swap during dev requires a Metro restart — acceptable because language switching is build-time only anyway.

## Decisions

### D1. `tools/rsync-lang-packs.ts` — directory normalization at copy time

Source packs live at `$PUBLIC_LANG_ASSETS/<pack>/res/` in Android-layout form (`raw/`, `font/`, `drawable-hdpi/`, `drawable-xxxhdpi/`, …). Target layout is the flat shape in `ARCHITECTURE.md §5`. Rather than preserve Android structure at runtime, normalize at copy time:

- `res/raw/aa_*.txt` → `languages/<code>/aa_*.txt`
- `res/raw/<tile>.mp3` → `languages/<code>/audio/tiles/<tile>.mp3` (key from `aa_gametiles.txt`)
- `res/raw/<word>.mp3` → `languages/<code>/audio/words/<word>.mp3` (key from `aa_wordlist.txt`)
- `res/raw/<syll>.mp3` → `languages/<code>/audio/syllables/<syll>.mp3` (key from `aa_syllables.txt`)
- `res/raw/zzz_*.mp3` (instruction audio) → `languages/<code>/audio/instructions/*.mp3`
- `res/font/*.ttf` → `languages/<code>/fonts/*.ttf`
- `res/drawable-xxxhdpi/zz_avatar*.png` → `languages/<code>/images/avatars/*.png`
- `res/drawable-xxxhdpi/zz_avataricon*.png` → `languages/<code>/images/avataricons/*.png`
- `res/drawable/<word>.png`, `res/drawable/<word>2.png` → `languages/<code>/images/words/*.png`
- `res/drawable/<tile>.png` (if present) → `languages/<code>/images/tiles/*.png`

Decision: **use the highest-density (`drawable-xxxhdpi`) source for avatars and icons**, drop the lower-density variants. React Native scales a single high-resolution source down. Density duplication on Android is obsolete on RN.

Decision: **classify audio files by examining `aa_gametiles.txt` / `aa_wordlist.txt` / `aa_syllables.txt`**, not by filename heuristics. A file named `bat.mp3` could be a word ("bat") in one pack and a tile ("b" whose `audioName` is `bat`) in another. The parser that reads those three files tells us where each mp3 belongs. This implies: the rsync tool depends on a minimal parser helper (just enough to read tab-delim headers + one column) before the full parser exists. That helper lives at `tools/_lang-pack-mini-parser.ts` and is deliberately a tiny subset.

Alternatives considered:

- **Preserve Android layout verbatim**, classify at runtime. Rejected: forces every runtime consumer to know Android directory conventions; no upside.
- **Classify by filename prefix**. Rejected: fragile, packs don't follow a strict convention.
- **Copy everything into one flat `files/` dir**. Rejected: runtime wants keyed access (`audio.tiles[tileId]`), and category inference at consumption time is wasted work.

### D2. `tools/generate-lang-manifest.ts` — emit a single typed TS module

The manifest file at `apps/alphaTiles/src/generated/langManifest.ts` exports:

```ts
export const langManifest = {
  code: 'eng',
  rawFiles: {
    'aa_colors': '...\n...',          // raw string contents of aa_colors.txt
    'aa_games': '...\n...',
    // ... one entry per aa_*.txt
  },
  fonts: {
    primary: require('../../../../languages/eng/fonts/andikanewbasic_r.ttf'),
    primaryBold: require('../../../../languages/eng/fonts/andikanewbasic_b.ttf'),
  },
  images: {
    avatars: [
      require('../../../../languages/eng/images/avatars/zz_avatar01.png'),
      // ...12 entries
    ],
    avataricons: [ /* 12 entries */ ],
    tiles: { 'a': require('...'), 'b': require('...'), /* ... */ },
    words: {
      'act': require('...'),
      'act2': require('...'),
      // ...
    },
    icon: require('...'),              // per-pack if present, else app default
    splash: require('...'),            // per-pack if present, else app default
  },
  audio: {
    tiles: { 'a': require('...'), /* ... */ },
    words: { 'act': require('...'), /* ... */ },
    syllables: { /* ... */ },
    instructions: { 'zzz_english_intro': require('...'), /* ... */ },
  },
} as const;

export type LangManifest = typeof langManifest;
```

Decision: **raw `.txt` contents are inlined as string literals**, not `require()`d. Reasons:

- Metro's default `.txt` handling is not built in; adding a custom transformer for a dozen small text files is more plumbing than it's worth.
- The files are tiny (kilobytes) — inlining adds trivial bundle weight.
- Parsing is a pure function of the string — having the string literally available keeps the parser testable against a plain `string` input.

Decision: **`const` assertion + `typeof` for the manifest type** — no hand-maintained type definition. Every other file imports `LangManifest` from this module. If the pack shape evolves, the type follows automatically.

Decision: **keys come from the `aa_*.txt` index files**, not from filesystem scanning. This is the same principle as D1 — the pack's own index is authoritative. If `aa_wordlist.txt` lists 328 words but `audio/words/` has 400 mp3s, the 72 extras are orphaned and the validator will flag them; the manifest only binds the 328 referenced ones.

### D3. `apps/alphaTiles/app.config.ts` — dynamic Expo config

Replaces the current static `app.json`. Signature:

```ts
import type { ExpoConfig } from 'expo/config';
import { readLangInfo } from '../../tools/_lang-pack-mini-parser';

export default (): ExpoConfig => {
  const lang = process.env.APP_LANG;
  if (!lang) throw new Error('APP_LANG env var is required');
  const info = readLangInfo(`languages/${lang}/aa_langinfo.txt`);
  return {
    name: info.nameInLocalLang,
    slug: `alphatiles-${lang}`,
    // versionName from info? no — versioning is app-level not pack-level
    ios: { /* ... */ bundleIdentifier: `org.alphatilesapps.alphatiles.blue.${lang}` },
    android: { /* ... */ package: `org.alphatilesapps.alphatiles.blue.${lang}` },
    // RTL handled in entry via I18nManager.forceRTL — not in ExpoConfig
    extra: {
      appLang: lang,
      scriptDirection: info.scriptDirection,    // consumed at runtime for I18nManager.forceRTL
      scriptType: info.scriptType,
    },
    plugins: [/* existing */],
    // ...
  };
};
```

Decision: **RTL forcing happens in the app entry, not in ExpoConfig** — `I18nManager.forceRTL` is a runtime call, and there's no way to express "force RTL" via Expo config. The `scriptDirection` flag is passed through `extra` so the entry can read it before the root component mounts.

Decision: **`bundleIdentifier` / `package` suffix mirrors Android flavor convention** — the existing Android source uses `org.alphatilesapps.alphatiles.blue.<flavor>`. Preserving that matches Play Store listings (one per language) and IPA distribution (TestFlight groups by bundle id).

### D4. `eas.json` — one profile per language pack

```json
{
  "cli": { "version": ">= 12.0.0" },
  "build": {
    "development":   { "developmentClient": true, "distribution": "internal", "env": { "APP_LANG": "eng" } },
    "preview":       { "distribution": "internal", "env": { "APP_LANG": "eng" } },
    "production":    { "env": { "APP_LANG": "eng" } },
    "eng":           { "extends": "production", "env": { "APP_LANG": "eng" } },
    "tpx":           { "extends": "production", "env": { "APP_LANG": "tpx" } },
    "yue":           { "extends": "production", "env": { "APP_LANG": "yue" } }
  },
  "submit": { "production": {} }
}
```

Decision: **one profile per pack + shared `production` base.** Adding a language pack = adding one entry. `development` / `preview` default to `eng` for dev ergonomics.

### D5. Prebuild sequencing

The three steps (rsync, validate, manifest) are separate scripts orchestrated by NX. `apps/alphaTiles/project.json` gains targets:

```json
"rsync-lang-pack": { "executor": "nx:run-commands", "options": { "command": "bun tools/rsync-lang-packs.ts" } },
"validate-lang-pack": { "executor": "nx:run-commands", "options": { "command": "bun tools/validate-lang-pack.ts" }, "dependsOn": ["rsync-lang-pack"] },
"generate-lang-manifest": { "executor": "nx:run-commands", "options": { "command": "bun tools/generate-lang-manifest.ts" }, "dependsOn": ["validate-lang-pack"] },
"prebuild-lang": { "dependsOn": ["generate-lang-manifest"] }
```

`start` / `run-android` / `run-ios` / `web-export` all `dependsOn: ["prebuild-lang"]`.

Decision: **separate targets, not a single monolithic prebuild** — lets devs iterate on one stage (e.g. regenerate the manifest without re-rsync'ing) and keeps CI fail-points clear.

Decision: **`bun` is the runtime for tools/** — we're already in a Bun-adjacent ecosystem (`@bun/install` elsewhere in dev), Bun runs TS natively, and these scripts don't need Node-specific APIs. If Bun isn't available, a `node --loader tsx` fallback is documented.

### D6. `validate-lang-pack.ts` placeholder

This change ships a placeholder that:
- Verifies `languages/<APP_LANG>/` exists.
- Verifies each of the 12 `aa_*.txt` files exists (except `aa_notes.txt` which is optional).
- Verifies at least one TTF in `fonts/`, at least the 12 avatars + 12 avataricons in `images/`.
- Exits non-zero with a readable error on any miss.

Full semantic validation is the `lang-pack-validator` change. That change replaces this placeholder with a call to the real validator once it exists.

### D7. `libs/shared/util-precompute` — registry pattern

Skeleton only in this change. Public surface:

```ts
type PrecomputeFn<T = unknown> = (assets: LangAssets) => T;

const registry = new Map<string, PrecomputeFn>();

export function registerPrecompute<T>(key: string, fn: PrecomputeFn<T>): void { ... }
export function runPrecomputes(assets: LangAssets): Map<string, unknown> { ... }
export function usePrecompute<T>(key: string): T { ... }   // hook that reads from Context
```

`LangAssets` type is a forward reference — this lib declares the dependency as a type-only import that will be satisfied by the `lang-assets-runtime` change. Until then, `LangAssets = unknown` and callers that need typed assets cast at the boundary.

## Risks / Trade-offs

- **[Risk]** `PUBLIC_LANG_ASSETS` env not set → rsync fails with uninformative `ENOENT`. **Mitigation**: `rsync-lang-packs.ts` prints a clear message naming the env var and pointing at `docs/GETTING_STARTED.md`.
- **[Risk]** `aa_*.txt` files contain CRLF line endings (Windows content authors) → parser downstream breaks. **Mitigation**: rsync normalizes to LF during copy.
- **[Risk]** `langManifest.ts` becomes huge (400+ `require()`s for engEnglish4). **Mitigation**: Metro handles thousands of requires fine; the bundle is what drives APK size, and every require is for an asset we actually need. Not a real risk.
- **[Risk]** A per-pack asset that isn't referenced by any `aa_*.txt` (orphan) is silently unbundled. **Mitigation**: the full validator flags orphans. Placeholder validator does not. Accepted for this change; closed by `lang-pack-validator`.
- **[Trade-off]** Inlining `aa_*.txt` as string literals duplicates the text in both bundle and (gitignored) `languages/`. **Accepted**: duplication is kilobytes; build-time simplicity wins.
- **[Trade-off]** Each language build ships its own bundle (no shared base). Results in some code duplication across APKs. **Accepted**: per-lang builds are the explicit goal (ADR-001) and per-lang APKs stay small.
- **[Trade-off]** Generator scans the filesystem every prebuild — not incremental. **Accepted**: language pack contents change rarely in dev; the scan is milliseconds.

## Migration Plan

1. Land `docs/ARCHITECTURE.md` + ADRs first (no code change).
2. Land the three tool scripts with unit tests for the filename-classification logic.
3. Replace `apps/alphaTiles/app.json` with `app.config.ts`. Verify `nx start alphaTiles` still boots.
4. Wire the NX targets, verify `APP_LANG=eng nx start alphaTiles` runs end-to-end (rsync → placeholder validate → generate → metro).
5. Add `languages/` to `.gitignore`.
6. Scaffold `libs/shared/util-precompute`.

Rollback: revert the commit. The existing static `app.json` (pre-change) is preserved in git history.

## Open Questions

- `engEnglish4` pack's bundle-id suffix — keep `.blue.eng` (matching Android `.blue.engEnglish4`) or shorten to `.blue.eng`? Play Store listings don't exist for the Expo version yet, so nothing to match. **Defer to first production submission.**
- Do we need a `languages/_meta.json` at pack-rsync time (pack list, last-sync timestamps) for dev ergonomics? **Defer until a second pack is in active dev.**
