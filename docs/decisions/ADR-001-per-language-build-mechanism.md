# ADR-001: Per-Language Build Mechanism

**Date**: 2026-04-23
**Status**: Accepted

## Context

AlphaTiles ships one app binary per language pack — no backend, no runtime language switching, no cross-language content. We need a mechanism that lets us produce N different APKs / IPAs / web bundles from a single codebase, where each artifact bundles exactly one language pack's assets (tiles, words, audio, fonts, images, metadata) and uses its own `applicationId`, display name, icon, splash, and script direction.

Constraints:

- No backend. Content selection must happen at build time, not runtime.
- Small artifact size. Ineligible content must not be included.
- Single source of truth for code. Forks per language are unacceptable — a bug fix in the engine must reach every language build with one change.
- CI must be able to build any subset of languages in parallel.

## Decision

One Expo project at `apps/alphaTiles/`. Dynamic `app.config.ts` + EAS build profiles. A single `APP_LANG` environment variable drives every per-build decision.

- `app.config.ts` reads `APP_LANG`, loads `languages/$APP_LANG/aa_langinfo.txt`, and returns an Expo config object populated with the per-language identity (slug, name, `applicationId` suffix, icon, splash, RTL flag).
- `eas.json` defines one build profile per supported language pack; each profile sets `APP_LANG` in its `env` block.
- Prebuild scripts (rsync, validate, generate manifest — see ADR-002, ADR-003, ADR-008) all key off the same `APP_LANG`.
- `eas build --profile eng` produces an English build; `eas build --profile tpx` produces a Mè'phàà build; and so on.

## Rationale

One codebase, N artifacts, one switch. The env var is the seam; everything downstream (config, manifest, validator, rsync target) is deterministic from it.

### Pros

- Single source of truth for engine code — one fix reaches every language build.
- Small artifacts — only the selected pack is bundled.
- CI-friendly — profiles enumerate the build matrix; parallelism is free.
- New language pack = one new EAS profile entry + rsync source. No scaffolding.
- Works identically for native (EAS) and local Expo web export.

### Cons

- Every build is a full rebuild; no shared binary across languages.
- `app.config.ts` runs at every `expo start` / `eas build` — must be fast and side-effect free.
- Debugging a specific language locally requires remembering to set `APP_LANG`.

## Alternatives Considered

### Alternative 1: Separate `apps/alphaTiles-<lang>/` directories per language

Each language gets its own Expo app folder, with its own `app.config.ts` and asset copy.

- **Why not**: Duplicated app shell per language. A bug fix in routing or providers requires N commits. Merge burden scales linearly with the number of language packs — the AlphaTiles long-tail goal is hundreds.

### Alternative 2: Runtime language picker

Single universal build bundles every language pack; user picks on first launch.

- **Why not**: Violates the size constraint (hundreds of packs × ~50 MB audio each). Violates the no-backend constraint (either ship everything or download at runtime). Defeats the per-language `applicationId` / store listing model that the Java original established.

### Alternative 3: One build-time codegen pass per language into a single universal bundle

Precompile assets into a chunked bundle, load on demand.

- **Why not**: Still needs a backend for on-demand chunks. Over-engineered relative to "one APK per language" deployment reality.

## Consequences

### Positive

- Prebuild pipeline becomes the single per-build customization point (ADR-002, ADR-003, ADR-008).
- `applicationId` suffix per pack lets the Play Store list each language as its own app — matches the Java original's distribution model.
- New-language onboarding is purely additive: add pack in source repo, add EAS profile, done.

### Negative

- N parallel builds cost N × build-minute budget on EAS.
- Local dev must set `APP_LANG` (or default to `eng`) or the prebuild fails fast.

### Neutral

- `eas.json` grows one entry per supported language — acceptable.
- `app.config.ts` is dynamic (TypeScript), not static JSON — required for env-driven config.

## Implementation Notes

- Default `APP_LANG` to `eng` when unset during local dev; the prebuild script logs a warning.
- `app.config.ts` must be pure and side-effect-free. File I/O is allowed (reading `aa_langinfo.txt`) but no network.
- Every prebuild script (`tools/rsync-lang-packs.ts`, `tools/generate-lang-manifest.ts`, the validator runner) reads `process.env.APP_LANG` exactly once at entry and passes it as an arg to its pure core — keeps the scripts unit-testable.
- Document the env var contract in `docs/GETTING_STARTED.md`.

## References

- `docs/ARCHITECTURE.md` §4 (per-language build pipeline)
- ADR-002 (language pack sourcing) — what the prebuild rsyncs
- ADR-003 (asset bundling via generated manifest) — how the rsync'd pack reaches runtime
- ADR-008 (full validator port) — the per-build gate
- ADR-009 (OTA via EAS Update) — channel-per-language ties back to `APP_LANG`
