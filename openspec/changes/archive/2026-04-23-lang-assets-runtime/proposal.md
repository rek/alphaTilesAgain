## Why

`port-foundations` emits the typed `langManifest.ts` (static `require()`s for every asset + raw strings for each `aa_*.txt`). `lang-pack-parser` turns those raw strings into typed domain models. `util-precompute` exposes a registry with a `LangAssets = unknown` forward reference. Nothing yet:

- Runs the parser against the bundled manifest at boot.
- Wires manifest `require()` numbers to parsed keys (so `useLangAssets().audio.tiles['a']` returns the `require()` for `zz_a.mp3`).
- Provides a Context so downstream features can read the pack without threading props.
- Triggers precomputes.
- Replaces the placeholder `LangAssets = unknown` in `util-precompute` with the real type.

This change is the **runtime glue** that connects every boot-time piece. After this change lands, every feature library (game screens, menus, player chooser, …) can consume `useLangAssets()` for pack data and `usePrecompute()` for per-class derived data.

## What Changes

Two new libraries:

- `libs/alphaTiles/data-language-pack/` (type `data-access`, scope `alphaTiles`):
  - Loads the pack at boot: calls `parsePack(langManifest.rawFiles)`; wires manifest asset `require()`s to parsed keys (e.g. `tile.audioName === 'zz_a'` + `langManifest.audio.tiles['zz_a']` → `resolved.audio.tiles['a']`); runs `runPrecomputes(assets)` from `util-precompute`; returns a single `LangAssets` object.
  - Exports the canonical `LangAssets` type + the synchronous `loadLangPack()` function.
  - Pure function of `langManifest` — no IO, no `async`. Metro's `require()` returns asset numbers synchronously.

- `libs/alphaTiles/data-language-assets/` (type `data-access`, scope `alphaTiles`):
  - React-side provider: `<LangAssetsProvider>{children}</LangAssetsProvider>` wraps the app; `useLangAssets()` hook returns the typed `LangAssets` via Context.
  - Boot synchronously — `loadLangPack()` is called inside the provider's init path; precomputes run before `children` renders.
  - Error boundary: if any parser throws or any precompute throws, render a plain-text error screen with the key + message (unstyled — styling is a later concern). Halts the app; the pack is broken, nothing else can run.

Modifications:

- `libs/shared/util-precompute`: replace the `LangAssets = unknown` forward reference with `import type { LangAssets } from '@alphaTiles/data-language-pack'`. The registry type parameters tighten accordingly.
- `apps/alphaTiles/src/_layout.tsx`: mount `<LangAssetsProvider>` immediately under the existing RTL-setup code, above all routes.

Exports / types:

```ts
// @alphaTiles/data-language-pack
export type LangAssets = {
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
    avatars: number[];          // 12 entries, indexed by avatar index
    avataricons: number[];      // 12 entries
    tiles: Record<string, number>; // keyed by tile.base when tile glyph images present; empty map for packs without tile images
    words: Record<string, number>; // keyed by word.wordInLWC
    wordsAlt: Record<string, number>; // keyed by word.wordInLWC when <word>2.png exists
  };
  audio: {
    tiles: Record<string, number>; // keyed by tile.base
    words: Record<string, number>; // keyed by word.wordInLWC
    syllables: Record<string, number>; // keyed by syllable.syllable
    instructions: Record<string, number>; // keyed by game.InstructionAudio
  };
  precomputes: Map<string, unknown>; // output of runPrecomputes; typed consumption via usePrecompute<T>(key)
};

export function loadLangPack(manifest: LangManifest): LangAssets;

// @alphaTiles/data-language-assets
export function LangAssetsProvider(props: { children: ReactNode }): JSX.Element;
export function useLangAssets(): LangAssets;
```

## Capabilities

### New Capabilities

- `lang-assets-runtime`: the runtime binding of bundled manifest + parsed data + precomputes → a single typed `LangAssets` object, exposed to the tree via Context.

### Modified Capabilities

- `precompute-registry` (from `port-foundations`): the `LangAssets = unknown` forward reference is replaced with the real type imported from `@alphaTiles/data-language-pack`. `registerPrecompute<T>` / `usePrecompute<T>` now carry the typed asset parameter through their signatures. Delta spec under `specs/precompute-registry/spec.md` (MODIFIED).

## Impact

- **New files**: `libs/alphaTiles/data-language-pack/{project.json, src/index.ts, src/loadLangPack.ts, src/LangAssets.ts, src/internal/resolveAudio.ts, src/internal/resolveImages.ts, src/internal/resolveFonts.ts}` plus tests. `libs/alphaTiles/data-language-assets/{project.json, src/index.ts, src/LangAssetsProvider.tsx, src/useLangAssets.ts, src/ErrorScreen.tsx}` plus tests.
- **Updated files**: `libs/shared/util-precompute/src/*.ts` (type-only change — replace `unknown` with imported `LangAssets`). `apps/alphaTiles/src/_layout.tsx` (mount the provider above routes).
- **Dependencies**:
  - `data-language-pack` depends on `util-lang-pack-parser`, `util-precompute`, and — at type level only — the generated `langManifest.ts`.
  - `data-language-assets` depends on `data-language-pack`, `util-precompute`, and `react`. No `react-i18next` (this is a `data-access` lib, not `ui`; strings live elsewhere).
- **No new runtime deps** outside React and the existing workspace libs.
- **No async boot** — `loadLangPack` is synchronous because Metro resolves `require()` eagerly. Audio / image handles are primitive numbers; binding is a map-walk. If a future platform can't do sync bundling, we revisit with a loading screen; that's not today's problem.
- **Error path**: if `parsePack` throws (malformed pack), the `LangAssetsProvider` catches and renders `<ErrorScreen>`. Same for precompute failures. No upstream rescue — the pack is broken; the app cannot proceed.
- **No caching / no reload** — boot-immutable. `useLangAssets()` returns the same object for the lifetime of the process.

## Out of Scope

- Audio *playback* (loading bytes into `expo-audio` sources, triggering plays). That's the `audio-system` change. This change exposes handles (`require()` numbers); `audio-system` consumes them.
- Image rendering / `Image` wrapping. Feature libs consume `useLangAssets().images.words[wordKey]` directly via `<Image source={...}>`.
- Font loading. Fonts come via `expo-font` in a separate bootstrap step; `useLangAssets().fonts.primary` exposes the handle for that step to consume.
- i18n registration. The `i18n-foundation` change consumes `useLangAssets()` to register content namespaces at boot.
- Precompute function bodies. This change exposes the registry with the real type but does not register any specific precompute (those land with game-class libs).
- Persistence. Zustand-owned runtime state (player, progress) is separate.
- Hot-reload of pack contents. Pack is boot-immutable; Metro restart reloads it. Not a regression — `port-foundations` established this.
- Web platform sync-boot quirks. `require()` of assets works identically on web via Metro; no extra wiring needed here.
