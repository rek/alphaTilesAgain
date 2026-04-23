## Context

`port-foundations` specifies `apps/alphaTiles/src/generated/langManifest.ts` — a bundler-generated module whose shape is:

```ts
export const langManifest = {
  code: 'eng',
  rawFiles: {
    'aa_colors':    '...\n...',
    'aa_gametiles': '...\n...',
    // ... one entry per aa_*.txt
  },
  fonts: {
    primary:     require('.../fonts/andikanewbasic_r.ttf'),
    primaryBold: require('.../fonts/andikanewbasic_b.ttf'),
  },
  images: {
    icon:        require('...'),
    splash:      require('...'),
    avatars:     [ require(...), /* 12 total */ ],
    avataricons: [ require(...), /* 12 total */ ],
    tiles:       { a: require(...), /* ... */ },
    words:       { act: require(...), act2: require(...), /* ... */ },
  },
  audio: {
    tiles:        { a:   require('...zz_a.mp3') },         // keys = basename without ext (matching tile.audioName convention)
    words:        { act: require('...act.mp3') },
    syllables:    { },
    instructions: { zzz_english_intro: require('...') },
  },
} as const;
```

`lang-pack-parser` turns `rawFiles[*]` strings into typed `TileList`, `WordList`, etc. `util-precompute` has a registry waiting for the real `LangAssets` type.

What's missing is the **binder** — something that takes the manifest + parsed data and produces a single object where (a) parsed tile / word / syllable data is easy to iterate, (b) asset handles are keyed by domain identifiers (not manifest keys), and (c) precomputes have run. After this change, `useLangAssets().audio.tiles['a']` returns the `require()` number for the English `a` tile's audio. Before this change, a consumer would need to: parse the manifest raw file, extract tile `a`'s `audioName` (`'zz_a'`), then index into `manifest.audio.tiles['zz_a']` — three steps that every consumer would reinvent.

### Required reading for implementers

- `AGENTS.md` — entry doc; read first.
- `openspec/AGENT_PROTOCOL.md` — pickup protocol.
- `docs/ARCHITECTURE.md` §3 (library taxonomy — `data-language-pack` is `type:data-access, scope:alphaTiles`), §5 (pack shape), §6 (runtime data flow), §7 (state management — Context vs Zustand boundaries).
- `docs/decisions/ADR-003-asset-bundling-via-generated-manifest.md`, `ADR-004-state-management-hybrid.md`.
- **Upstream OpenSpec changes (must be merged before starting):**
  - `port-foundations` — supplies `langManifest.ts`, `util-precompute` skeleton.
  - `lang-pack-parser` — supplies typed parsing functions the binder calls.
  - Read `openspec/changes/port-foundations/design.md` and `openspec/changes/lang-pack-parser/design.md` in full.
- **Source Java files being ported** (absolute paths):
  - `../AlphaTiles/app/src/main/java/org/alphatilesapps/alphatiles/Start.java` — the Android equivalent of `loadLangPack`; reference for which derived structures precomputes should emit.
  - `../AlphaTiles/app/src/main/java/org/alphatilesapps/alphatiles/TileList.java`, `WordList.java`, `SyllableList.java` — static lookup helpers whose runtime equivalents are precomputes.
- **Fixture paths** (absolute, under `../PublicLanguageAssets/`):
  - `../PublicLanguageAssets/engEnglish4/res/raw/aa_gametiles.txt`, `aa_wordlist.txt`, `aa_syllables.txt` — keying sources for audio / image re-keying.
  - `../PublicLanguageAssets/engEnglish4/res/raw/*.mp3`, `res/drawable*/` — confirm key→file mappings the binder performs.
  - `../PublicLanguageAssets/tpxTeocuitlapa/res/raw/aa_*.txt` — secondary parity fixture.

## Goals / Non-Goals

**Goals:**

- Single synchronous boot entry: `loadLangPack(manifest)` returns a fully-wired `LangAssets` in one call.
- Audio / image handles re-keyed by the domain identifier the consumer uses. `LangAssets.audio.tiles` is keyed by `tile.base`, not by `audioName`. `LangAssets.images.words` is keyed by `word.wordInLWC`. Consumers never need to know manifest key conventions.
- `<LangAssetsProvider>` mounts once at the app root; `useLangAssets()` returns typed data anywhere in the tree.
- Precomputes run during boot, before any UI renders.
- Clear error path for malformed packs — an error-screen boundary catches parse / precompute throws.
- `util-precompute`'s `LangAssets` type is now concrete, not `unknown`.
- No `useEffect`, no async IO at boot. Metro's `require()` is sync; `parsePack` is pure sync; `runPrecomputes` is sync.

**Non-Goals:**

- Loading audio bytes into playable sources. That's `audio-system`.
- Streaming / code-splitting of the pack. Every pack is bundled; load-on-demand has no use case for an education app with tens of MB of pack data.
- Supporting multiple packs at runtime. One `APP_LANG` = one pack. Changing packs = rebuild.
- Hot-reload of pack content. Edit a `aa_*.txt` → `nx run rsync-lang-pack` → Metro restart. The runtime treats the manifest as immutable.
- Dynamic precompute registration based on pack content. Precomputes are registered at import time by feature libs; the pack doesn't parameterize the registry.
- Fallback asset handling (placeholder images if a word image is missing). The validator prevents missing assets; runtime trust.

## Decisions

### D1. `LangAssets` is the canonical shape — defined once

```ts
// libs/alphaTiles/data-language-pack/src/LangAssets.ts
import type { parseGametiles, parseWordlist, parseSyllables, parseKeyboard, parseGames,
  parseLangInfo, parseSettings, parseNames, parseResources, parseColors } from '@alphaTiles/util-lang-pack-parser';

export interface LangAssets {
  code: string;
  langInfo: ReturnType<typeof parseLangInfo>;
  settings: ReturnType<typeof parseSettings>;
  tiles: ReturnType<typeof parseGametiles>;
  words: ReturnType<typeof parseWordlist>;
  syllables: ReturnType<typeof parseSyllables>;
  keys: ReturnType<typeof parseKeyboard>;
  games: ReturnType<typeof parseGames>;
  names: ReturnType<typeof parseNames>;
  resources: ReturnType<typeof parseResources>;
  colors: ReturnType<typeof parseColors>;
  share: string;
  fonts: { primary: number; primaryBold?: number };
  images: {
    icon: number;
    splash: number;
    avatars: number[];
    avataricons: number[];
    tiles: Record<string, number>;
    words: Record<string, number>;
    wordsAlt: Record<string, number>;
  };
  audio: {
    tiles: Record<string, number>;
    words: Record<string, number>;
    syllables: Record<string, number>;
    instructions: Record<string, number>;
  };
  precomputes: Map<string, unknown>;
}
```

Decision: **types inferred from parser `ReturnType`.** No hand-maintained `TileList` type. If the parser shape evolves, `LangAssets` follows.

Decision: **the `LangAssets` interface is in its own file** (exported) so `util-precompute` can import the type without triggering a runtime import cycle.

Decision: **audio / image maps are keyed by the domain identifier (tile base, word LWC, syllable text, game instruction-audio-name).** The manifest's own keys (which are the `audioName` string or the filename stem) are a runtime detail. If a future pack uses the same audio file for two tiles (shared phoneme), the `Record<string, number>` still maps per-tile — each tile entry in the record points at the same `require()` number.

### D2. `loadLangPack(manifest)` — synchronous, deterministic

```ts
// libs/alphaTiles/data-language-pack/src/loadLangPack.ts
import { parsePack } from '@alphaTiles/util-lang-pack-parser';
import { runPrecomputes } from '@alphaTiles/util-precompute';
import type { LangManifest } from '@generated/langManifest';
import type { LangAssets } from './LangAssets';

export function loadLangPack(manifest: LangManifest): LangAssets {
  const parsed = parsePack(manifest.rawFiles);
  const audio = resolveAudio(manifest, parsed);
  const images = resolveImages(manifest, parsed);
  const fonts = resolveFonts(manifest);
  const assets: LangAssets = {
    code: manifest.code,
    ...parsed,
    fonts,
    images,
    audio,
    precomputes: new Map(), // populated below
  };
  const precomputes = runPrecomputes(assets);
  return { ...assets, precomputes };
}
```

Decision: **`loadLangPack` is synchronous.** Metro resolves every `require()` eagerly during module loading, so the manifest is fully materialized by the time any consumer imports it. Parser is sync. Precomputes are sync. Therefore boot is sync.

Decision: **`resolveAudio`, `resolveImages`, `resolveFonts` live as internal helpers**, each in its own file (`src/internal/resolveX.ts`), each one a small pure function. One function per file, per convention.

Decision: **precomputes run *after* asset assembly, with the assembled assets as input.** This is the contract `util-precompute` already expects.

Decision: **no caching.** Each Metro-load invokes `loadLangPack` once per app instance. Repeat invocations are cheap but not memoized — consumers import `LangAssetsProvider` which calls `loadLangPack` once and holds the result in Context. Direct consumers of `loadLangPack` (tests) get independent copies.

### D3. `resolveAudio` / `resolveImages` / `resolveFonts` mechanics

```ts
// simplified resolveAudio
function resolveAudio(manifest: LangManifest, parsed: ParsedPack): LangAssets['audio'] {
  const tiles: Record<string, number> = {};
  for (const tile of parsed.tiles.rows) {
    const h = manifest.audio.tiles[tile.audioName];
    if (h === undefined && tile.audioName !== 'zz_no_audio_needed') {
      throw new LangAssetsBindError({ category: 'tile-audio', key: tile.audioName, tileBase: tile.base });
    }
    if (h !== undefined) tiles[tile.base] = h;
  }
  // ... words, syllables, instructions
  return { tiles, words, syllables, instructions };
}
```

Decision: **absent assets (referenced in `aa_*.txt` but missing from manifest) throw `LangAssetsBindError`.** In a healthy build, the validator has already caught this. A production build that reaches here with a missing asset means either (a) the validator is bypassed or (b) the manifest generator has a bug. Both are bugs; fail loudly.

Exception: **`zz_no_audio_needed` is a sentinel** (matches Java). Tiles with this audioName have no audio; the resolver skips them silently.

Decision: **`resolveImages.words` and `resolveImages.wordsAlt`** are separate maps. `words[wordLWC]` = the primary image; `wordsAlt[wordLWC]` = the `<word>2.png` distractor variant if present. Consumer decides which to render.

Decision: **no fuzzy matching / fallback resolution.** If `audioName === 'zz_foo'` and `manifest.audio.tiles['zz_foo']` is missing, we don't try `manifest.audio.words['zz_foo']`. Exact lookup or fail.

### D4. `LangAssetsProvider` — sync Context, error boundary

```tsx
// libs/alphaTiles/data-language-assets/src/LangAssetsProvider.tsx
import React, { createContext, useMemo } from 'react';
import { langManifest } from '@generated/langManifest';
import { loadLangPack, type LangAssets } from '@alphaTiles/data-language-pack';
import { ErrorScreen } from './ErrorScreen';

const LangAssetsContext = createContext<LangAssets | null>(null);

export function LangAssetsProvider(props: { children: React.ReactNode }) {
  const result = useMemo(() => {
    try {
      return { ok: true as const, assets: loadLangPack(langManifest) };
    } catch (err) {
      return { ok: false as const, err: err as Error };
    }
  }, []);
  if (!result.ok) return <ErrorScreen error={result.err} />;
  return <LangAssetsContext.Provider value={result.assets}>{props.children}</LangAssetsContext.Provider>;
}

export function useLangAssets(): LangAssets {
  const v = useContext(LangAssetsContext);
  if (!v) throw new Error('useLangAssets must be used inside <LangAssetsProvider>');
  return v;
}
```

Decision: **`loadLangPack` is called inside `useMemo([])`** — runs exactly once per provider instance (which is once per app). No `useEffect`, per project rule. Synchronous return means the first render shows either the tree or the error screen — no intermediate "loading" state.

Decision: **`<ErrorScreen>` is a minimal plain-text component** (View + Text with the error message and code). No i18n (pack is broken; translations can't work anyway). Styled later via the `loading-screen` change's conventions when that lands.

Decision: **no "Retry" button.** Pack error is deterministic; restart means rebuild with a fixed pack. Retry within the app does nothing useful.

Decision: **`useLangAssets()` throws if the provider isn't mounted.** Makes boot-order bugs loud and early. All features should be mounted under `<LangAssetsProvider>`; if a dev adds a new provider above it by mistake, the crash names the issue.

### D5. `util-precompute` update — forward reference becomes real

`port-foundations` left `util-precompute` with a `LangAssets = unknown` forward reference (ADR-noted; `design.md §D7` of port-foundations). This change replaces it:

```ts
// libs/shared/util-precompute/src/registerPrecompute.ts — updated
import type { LangAssets } from '@alphaTiles/data-language-pack';

type PrecomputeFn<T = unknown> = (assets: LangAssets) => T;
const registry = new Map<string, PrecomputeFn>();

export function registerPrecompute<T>(key: string, fn: PrecomputeFn<T>): void { /* … */ }
export function runPrecomputes(assets: LangAssets): Map<string, unknown> { /* … */ }
export function usePrecompute<T>(key: string): T { /* … reads from a Context set up by the provider */ }
```

Decision: **`util-precompute` now imports a type from `@alphaTiles/data-language-pack`.** This creates a type-only dependency `util-precompute → data-language-pack`. But `data-language-pack` also imports `util-precompute` (for `runPrecomputes`). That's a **type-import cycle** at the module level but not a runtime cycle — TypeScript handles it, and Metro's bundler never needs to resolve the cycle because types erase.

Decision: **`util-precompute` remains `type:util`.** The forward-reference rule in `port-foundations` (`util-precompute` uses type-only imports from `data-language-pack` so dep rules aren't violated) stays intact. Verified via the existing `port-foundations` spec: `type:util` libs *may* use type-only imports from `data-access` libs — the ESLint `@nx/enforce-module-boundaries` rule with `allowTypeImports` or equivalent. If ESLint disagrees, document the exception via `// eslint-disable-next-line` with a comment pointing at this design doc. (This is the only place the rule is bent.)

Alternative considered: **move `LangAssets` type into a separate `util-types-lang-assets` library.** Rejected — adds a library-level indirection for a single interface. Type-only cycle is cleaner.

### D6. Provider mount point

`apps/alphaTiles/src/_layout.tsx` (or equivalent entry — the specific path is set by `port-foundations`) adds the provider:

```tsx
// apps/alphaTiles/src/_layout.tsx — after RTL setup
import { LangAssetsProvider } from '@alphaTiles/data-language-assets';
import Constants from 'expo-constants';
import { I18nManager } from 'react-native';
import { Stack } from 'expo-router';

// RTL setup (already in port-foundations)
if (Constants.expoConfig?.extra?.scriptDirection === 'RTL') {
  I18nManager.allowRTL(true);
  I18nManager.forceRTL(true);
}

export default function RootLayout() {
  return (
    <LangAssetsProvider>
      <Stack />
    </LangAssetsProvider>
  );
}
```

Decision: **provider wraps `<Stack />`.** Every route (including future modals) renders inside the provider. This is the only sanctioned `<Provider>` at root; the i18n provider (from `i18n-foundation`) mounts inside, consuming `useLangAssets()` to register content namespaces.

Decision: **RTL setup stays *outside* the provider.** `I18nManager.forceRTL` is a static-config call that happens before any React tree renders; putting it inside would be ineffective on first render.

### D7. Precomputes run inside `loadLangPack`, not in the provider

```ts
// loadLangPack calls runPrecomputes and stores results in LangAssets.precomputes
```

Decision: **precomputes are part of the asset bundle.** `useLangAssets().precomputes.get('chile')` works everywhere. `usePrecompute('chile')` is a typed convenience wrapper that reads from the same map.

Decision: **`usePrecompute` reads from `useLangAssets().precomputes`** — no separate PrecomputeContext needed. `util-precompute` was designed (in `port-foundations`) to have its own internal Context; this change removes that complication and folds the precompute cache into `LangAssets`. Simpler.

Alternative considered: **keep a separate `<PrecomputeProvider>`.** Rejected — two providers, two hooks, same data. One source of truth is cleaner.

This is a minor adjustment to `util-precompute`'s shape: `runPrecomputes` still exists and still returns `Map<string, unknown>`, but the internal `PrecomputeProvider` is removed. `usePrecompute` becomes a thin wrapper over `useLangAssets().precomputes.get(key)` with a typed cast. Documented in the `precompute-registry` MODIFIED spec delta.

### D8. Error modes

- **Malformed pack** → `parsePack` throws `LangPackParseError` → caught by `LangAssetsProvider`'s `useMemo` wrapper → `<ErrorScreen>` renders. Message: "Pack failed to parse: <file>:<line> — <reason>".
- **Missing asset in manifest** → `resolveAudio`/`resolveImages`/`resolveFonts` throws `LangAssetsBindError`. Same boundary. Message: "Pack asset missing: <category> — <key>. This is a build pipeline bug; the validator should have caught this."
- **Precompute throws** → `runPrecomputes` re-throws with the precompute key attached (per `port-foundations` `precompute-registry` spec). Same boundary. Message: "Precompute '<key>' failed: <message>".

Decision: **one error screen for all boot failures.** Differentiated by message but not by render. Post-v1: style separately, link to developer docs.

Decision: **`<ErrorScreen>` sets `accessibilityLiveRegion="assertive"` on its root so screen readers announce the failure.** Even in error states, a11y matters.

### D9. Testing

- **Parser-path unit test** for `loadLangPack`: feed a synthetic manifest (minimal, happy path), assert the output has `audio.tiles['a']` === the mock require-number.
- **Binding-error unit test**: synthetic manifest with a missing audio handle → `loadLangPack` throws `LangAssetsBindError` with the correct key.
- **Sentinel handling**: tile with `audioName === 'zz_no_audio_needed'` → not present in `LangAssets.audio.tiles` → no throw.
- **Provider test**: shallow-render `<LangAssetsProvider>` with a test manifest; assert `useLangAssets()` in a nested component returns the expected assets.
- **Error-boundary test**: provider-init throws → `<ErrorScreen>` rendered; test asserts error message contains the expected code.
- **Fixture test**: run `loadLangPack` against a minimal manifest mock corresponding to `languages/eng/`. Spot-check `assets.audio.tiles['a']`, `assets.images.words['act']`, `assets.settings.findBoolean('Has tile audio', false)`.

Decision: **no Storybook in this change.** `data-access` libs don't have visual surface area. `<ErrorScreen>` is trivial; if we want it in Storybook, that's a UI-polish follow-up.

### D10. Type path aliases

`@generated/langManifest` resolves to `apps/alphaTiles/src/generated/langManifest.ts` via `tsconfig.base.json` path mapping. Added in this change (no change in `port-foundations`). Both `data-language-pack` and `data-language-assets` import via this alias.

Decision: **path alias, not relative imports.** `libs/alphaTiles/data-language-pack/src/loadLangPack.ts` referring to `../../../apps/alphaTiles/src/generated/langManifest` is fragile and violates NX's "libs don't reach into apps" principle. The alias is a one-line tsconfig entry that reads more cleanly.

Edge case: **NX dependency-rules enforcement may flag the lib-reads-from-app path.** Mitigation: use the alias and document in `tsconfig.base.json` that `@generated/*` is a build-artifact path, exempt from the `type:app` boundary. If ESLint fights it, add an override.

## Risks / Trade-offs

- **[Risk]** Type-only cycle between `util-precompute` and `data-language-pack` confuses the build. **Mitigation**: verified against TypeScript; types erase. Add a smoke test: `nx build data-language-pack` + `nx build util-precompute` both succeed. If it breaks, fall back to extracting `LangAssets` into `libs/shared/util-types-lang-assets`.
- **[Risk]** Synchronous boot costs first-render time: parser + binding + every precompute all run before the first frame. **Mitigation**: measure on a mid-tier Android. Expected total <100ms (parser <10ms, binding <5ms, precomputes are lightweight). If it becomes a problem, add a loading screen — but note that Metro's sync bundle resolution already means the user sees a frozen splash during resource load; our additional work is a small delta.
- **[Risk]** `LangAssetsBindError` in production means a build-pipeline bug slipped past the validator. **Mitigation**: the error message explicitly says so. CI asserts against all fixture packs. The validator's `checkAudioReferences` / `checkImageReferences` have to have zero errors before a build goes out.
- **[Risk]** Provider mount-order matters — if the i18n provider or a Zustand init runs above `<LangAssetsProvider>`, those providers can't consume assets. **Mitigation**: `<LangAssetsProvider>` is the outermost custom provider. Document in `apps/alphaTiles/src/_layout.tsx` and add a lint rule (custom ESLint rule, or a comment-based convention). Downstream changes (`i18n-foundation`, loading screen) add their providers inside.
- **[Trade-off]** Asset handles are rebound into domain-keyed maps — a one-time O(N) cost per pack, ~1000 asset handles for engEnglish4 (tiles + words + audio + images). <5ms. **Accepted**: lookup ergonomics for every consumer >> one-time 5ms cost.
- **[Trade-off]** Error-screen is plain and ugly. **Accepted**: pack-failure is a dev-path concern; end users will never see it if the pipeline works. Polish deferred.
- **[Trade-off]** Two libs (`data-language-pack` + `data-language-assets`) instead of one. **Accepted**: the first is pure TS (testable in Node), the second is React (needs jsdom or React Test Renderer). Splitting aligns with the NX "pure logic separate from React surface" rule and reduces test-environment overhead for the pure-logic lib.

## Migration Plan

1. Scaffold both libs: `data-language-pack` and `data-language-assets`.
2. Implement `LangAssets` interface in `data-language-pack/src/LangAssets.ts`.
3. Implement `internal/resolveAudio.ts`, `internal/resolveImages.ts`, `internal/resolveFonts.ts`.
4. Implement `loadLangPack.ts`, which composes them + calls `parsePack` + `runPrecomputes`.
5. Write unit tests against a synthetic-manifest fixture.
6. Update `util-precompute`:
   - Replace `LangAssets = unknown` with `import type { LangAssets } from '@alphaTiles/data-language-pack'`.
   - Remove internal `PrecomputeProvider` (per D7).
   - Update `usePrecompute` to read from `useLangAssets().precomputes`.
   - Adjust existing tests to assert new behavior (tests using the old `PrecomputeProvider` directly will need rework).
7. Implement `LangAssetsProvider.tsx`, `useLangAssets.ts`, `ErrorScreen.tsx` in `data-language-assets`.
8. Add `@generated/langManifest` path alias to `tsconfig.base.json`.
9. Update `apps/alphaTiles/src/_layout.tsx` to mount `<LangAssetsProvider>`.
10. Smoke-test `APP_LANG=eng nx start alphaTiles` — app boots, renders an empty route inside the provider.
11. Break the pack (delete a required `aa_*.txt`) and verify `<ErrorScreen>` renders with a usable error message.

Rollback: revert the commit. `util-precompute` reverts to `LangAssets = unknown`. The app shell goes back to rendering without pack context. No data is persisted, so nothing is lost.

## Open Questions

- **Should `data-language-pack` expose `loadLangPack` or only internals?** The provider is the only non-test consumer. Tentative: export `loadLangPack` because tests need it; future standalone tooling (a non-React consumer of pack data) may too.
- **Image-resolver behavior when `<word>2.png` exists but `<word>.png` doesn't.** The validator flags this as a missing primary. Runtime: if the resolver encounters it, throw (consistent with D3). Tentative decision: stay strict.
- **Avatar key convention — index (0..11) or filename (`zz_avatar01`, …)?** Tentative: index (0-based). Java uses a `HashMap<Integer, ...>`-style access; keeping the API array-like matches. If downstream consumers expect string keys, revisit.
- **How does the app hot-reload when `langManifest.ts` regenerates during dev?** Metro will reload; the `<LangAssetsProvider>`'s `useMemo([])` re-runs because the module reloads. No special wiring. But mark this as an open observability question: after a prebuild regeneration, does the provider remount cleanly? Manual test during migration.
- **Should `LangAssets.precomputes` be a `Record<string, unknown>` or a `Map<string, unknown>`?** Tentative: `Map`. Matches `util-precompute`'s existing shape from `port-foundations` (`runPrecomputes` returns `Map<string, unknown>`). Consumers use `.get(key)`, not property access.
