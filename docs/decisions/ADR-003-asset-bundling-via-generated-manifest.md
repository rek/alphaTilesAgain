# ADR-003: Asset Bundling via Generated Manifest

**Date**: 2026-04-23
**Status**: Accepted

## Context

Once a language pack has been rsync'd into `languages/<APP_LANG>/` (ADR-002), the runtime needs to:

1. Know what files exist (hundreds of audio clips, images, fonts, plus ~12 data files).
2. Load them — which for React Native / Expo means `require('…relative path…')` with a **static string literal** (Metro requirement).
3. Resolve them to platform-appropriate module refs (`number` on native, URI on web).

The challenge: `require()` in Metro is compile-time, not runtime. We cannot do `require('../../languages/' + pack + '/audio/' + tile + '.mp3')`. Every required path must appear as a literal string somewhere Metro can statically analyze.

At the same time, hand-maintaining a static list of every tile/word/syllable/image/audio path is untenable — each language pack has hundreds of files, and new packs have different file sets.

## Decision

Prebuild generates `apps/alphaTiles/src/generated/langManifest.ts`. That one file is the **only** place in the codebase that calls `require()` on language-pack assets. It exports a typed manifest object that runtime code consumes.

- `tools/generate-lang-manifest.ts` scans `languages/<APP_LANG>/` after rsync.
- It emits TypeScript source where every asset is a literal `require('../../../languages/<APP_LANG>/…')` call.
- The manifest shape is typed (`LangManifest`), keyed by asset kind (tile, word, syllable, image, font, data-file).
- Runtime code imports `langManifest` and looks up handles by key — never calls `require()` directly on pack paths.

## Rationale

Metro's static analyzer is the binding constraint. Any scheme that makes `require()` dynamic is a non-starter. Given that, the question becomes "who writes the static requires?" — and the only scalable answer is code generation.

Generating **into the project tree** (vs. a Metro alias scheme) keeps the code Metro sees literally static. Generating into a well-known path (`src/generated/`) lets `.gitignore` scope the build artifact.

### Pros

- Metro-native — no custom resolver, no alias hack, no runtime trick.
- Fully typed — `LangManifest` gives autocomplete on tile / word / syllable keys.
- Hand-off clean — the only `require()`s on pack paths live in one generated file.
- Dead-code elimination works — unused asset kinds drop from the bundle automatically.
- Web + native bundle identically. The same `require()` returns a `number` on native and a resolved URI on web; runtime code doesn't care.

### Cons

- `src/generated/langManifest.ts` is a build artifact in source-controlled territory. Must be `.gitignore`d to avoid accidental commits.
- Stale manifest = confusing failures. If someone edits `languages/` without rerunning the generator, the runtime sees the old manifest.
- IDE / TypeScript has to tolerate the file not existing on a clean clone. Runtime import throws until prebuild runs at least once.

## Alternatives Considered

### Alternative 1: Metro `extraNodeModules` / resolver alias

Configure Metro so `@lang/audio/tile-a.mp3` resolves dynamically based on `APP_LANG`.

- **Why not**: Metro's `require()` still needs a static string. An alias scheme flattens the path but doesn't help when the string is constructed at runtime (`require('@lang/audio/' + tile + '.mp3')` — still dynamic). Solves the wrong half of the problem.

### Alternative 2: Copy language pack into `apps/alphaTiles/assets/` at prebuild

Instead of `require()`ing out of `languages/`, copy into the app's own assets tree.

- **Why not**: Dirties the repo's working tree with a volatile copy that git sees. Duplicates storage on disk. Doesn't change the Metro static-require requirement — we still need a generated manifest either way.

### Alternative 3: Bundle as remote URLs / CDN-hosted assets

Skip `require()` entirely; `{ uri: 'https://…/tile-a.mp3' }`.

- **Why not**: Violates the no-backend constraint (ADR-001). Removes offline capability, which is essential for the target audience.

### Alternative 4: Hand-written manifest, updated per language pack

Linguists edit a TypeScript file listing their pack's assets.

- **Why not**: Error-prone. Forces linguists to write TypeScript. Drifts silently from the pack contents. Defeats the validator's "trust the assets" premise (ADR-008).

## Consequences

### Positive

- `libs/alphaTiles/data-audio`, image components, and font loaders all consume `langManifest` through a typed API — no path-string handling in feature code.
- Per-key precompute (`libs/shared/util-precompute`) can cache based on stable manifest keys.
- Switching languages during dev (`APP_LANG=tpx && bun prebuild`) regenerates the manifest; no manual bookkeeping.

### Negative

- First-time setup must run prebuild before TypeScript compiles cleanly. Document in `GETTING_STARTED.md`.
- Anything that imports `langManifest` outside runtime (e.g. a unit test) needs a test-fixture manifest or a mock.

### Neutral

- `src/generated/.gitignore` keeps the file out of git.
- The generator is itself unit-testable — given a `languages/` directory, it emits a deterministic TypeScript string.

## Implementation Notes

- Shape (sketch):
  ```ts
  export type LangManifest = {
    code: string;
    dataFiles: { gameTiles: string; wordList: string; /* … */ };
    audio: {
      tiles: Record<string, AudioSource>;
      words: Record<string, AudioSource>;
      syllables: Record<string, AudioSource>;
      instructions: Record<string, AudioSource>;
    };
    images: {
      icon: ImageSourcePropType | null;
      splash: ImageSourcePropType | null;
      avatars: Record<string, ImageSourcePropType>;
      words: Record<string, { primary: ImageSourcePropType; alt?: ImageSourcePropType }>;
      tiles: Record<string, ImageSourcePropType>;
    };
    fonts: Record<string, FontModule>;
  };
  ```
- Every value is a literal `require(...)` call in the emitted file.
- Generator sorts keys deterministically — a no-op regenerate produces a byte-identical file.
- Generator runs as a unit after rsync + validator pass. Validator failure aborts before generation.
- Runtime imports: `import { langManifest } from '@/generated/langManifest'`.
- Add a file-header comment `// @generated — do not edit` so humans don't try to hand-fix it.

## References

- `docs/ARCHITECTURE.md` §4 (prebuild sequence), §6 (runtime data flow)
- Metro static-require docs — Metro bundler asset requirements
- ADR-001 (per-language build mechanism) — why `APP_LANG` drives generation
- ADR-002 (language pack sourcing) — where `languages/` comes from
- ADR-008 (full validator port) — gate between rsync and manifest generation
