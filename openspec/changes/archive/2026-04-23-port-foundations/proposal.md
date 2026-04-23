## Why

The repository is a fresh NX+Expo shell with empty `libs/` — nothing yet that parses a language pack, binds a language pack to a build, or establishes the spec-driven workflow needed to port the 100+ KLOC Java/Android source at `../AlphaTiles/`. Every downstream change (parser, validator, audio, engine, games) depends on a single decision: how a language pack becomes a shipped binary. This change establishes that pipeline and the architectural documentation that governs all future work.

## What Changes

- Add `docs/ARCHITECTURE.md` — stable high-level architecture doc (already written as part of this proposal's authoring).
- Add `docs/decisions/ADR-001`–`ADR-010` covering the ten foundational technical decisions (already written alongside this proposal).
- Add `tools/rsync-lang-packs.ts` — script that copies a language pack from `$PUBLIC_LANG_ASSETS/<pack>/res/` into `languages/<APP_LANG>/`, normalizing the Android `res/raw/`, `res/font/`, `res/drawable*/` layout into the flat shape documented in `ARCHITECTURE.md §5`.
- Add `tools/generate-lang-manifest.ts` — script that scans `languages/<APP_LANG>/` and emits `apps/alphaTiles/src/generated/langManifest.ts` with static `require()` calls for every fonts / image / audio file, plus a keyed map of the `aa_*.txt` files as bundled strings.
- Add `tools/` project entry in `nx.json` / `tsconfig.base.json` so the scripts run via `nx run alphaTiles:lang-manifest` and `nx run alphaTiles:rsync-lang-pack`.
- Convert `apps/alphaTiles/app.json` to `apps/alphaTiles/app.config.ts` — dynamic Expo config that reads `APP_LANG`, loads `languages/<APP_LANG>/aa_langinfo.txt`, derives display name + `applicationId` suffix + icon / splash override detection + RTL flag.
- Add `eas.json` with one build profile per supported language pack (`eng`, `tpx`, `yue`, plus `development` / `preview` / `production` standards), each setting `APP_LANG` in its env.
- Wire `nx start` / `nx run-android` / `nx run-ios` / `nx web-export` to run the prebuild sequence (rsync → validate → manifest → app.config) via pre-start hooks.
- Add `languages/` to `.gitignore` — packs are rsync'd in, never committed.
- Add `LANG_ASSETS_SOURCE` env contract to `docs/GETTING_STARTED.md` (must point at the developer's local clone of `PublicLanguageAssets`).
- Scaffold empty `libs/shared/util-precompute` — the per-class precompute registry described in `ARCHITECTURE.md §9`.

## Capabilities

### New Capabilities

- `build-pipeline`: the sequence of steps that turns a language pack + the app source into a platform build (rsync → validate → manifest → app.config → expo build).
- `lang-pack-sourcing`: how language pack content reaches the build tree (rsync contract, directory normalization, the `LANG_ASSETS_SOURCE` env).
- `precompute-registry`: per-game-class boot hooks registered by feature libs, executed after the language pack loads.

### Modified Capabilities

_None_ — this is the first change, no prior specs exist.

## Impact

- **New files**: `docs/ARCHITECTURE.md`, `docs/decisions/ADR-001`–`ADR-010`, `tools/rsync-lang-packs.ts`, `tools/generate-lang-manifest.ts`, `apps/alphaTiles/app.config.ts`, `eas.json`, `libs/shared/util-precompute/{src,project.json,...}`, `.gitignore` entry.
- **Deleted**: `apps/alphaTiles/app.json` (replaced by dynamic `app.config.ts`).
- **New devDependencies**: none required — `tools/` scripts use Node built-ins (`fs`, `path`, `crypto` for checksums). `eas-cli` already available globally.
- **Nothing runtime yet** — this change does not add runtime libraries or UI. It only wires the build pipeline and documents the architecture. Downstream changes (`lang-pack-parser`, `lang-pack-validator`, …) consume what this change lays down.
- **No breaking changes** — the existing shell renders an empty screen after this change; subsequent changes populate it.
- **Risk: `PUBLIC_LANG_ASSETS` env not set** — build fails fast with actionable error before any downstream step runs.

## Out of Scope

- The validator itself (see `lang-pack-validator` change) — this change only wires a placeholder call; the actual validation logic is a separate multi-week port.
- Runtime language loading (see `lang-assets-runtime`).
- i18n setup (see `i18n-foundation`).
- Any game logic.
