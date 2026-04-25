## Why

Each language pack produces a distinct app binary (different assets, fonts, direction). Today there is no CI pipeline that builds and validates those binaries; developers run EAS manually. As language coverage grows, manual builds become error-prone and untraceable. Automating one profile per language gives every push a reproducible, auditable set of artifacts.

## What Changes

- `eas.json` gains one build profile per language code per environment (e.g. `yue-production`, `eng-staging`). Each profile sets `APP_LANG` to the lang code so the build picks the correct language pack.
- New `scripts/supported-langs.json` — single source of truth for all supported lang codes.
- New `scripts/eas-build-matrix.ts` — reads `supported-langs.json`, prints a JSON array of `{ profile, lang }` objects consumable by a GitHub Actions matrix strategy.
- New `.github/workflows/ci-lang-builds.yml` — triggers on push to `main` and `workflow_dispatch`; uses the matrix script to dispatch all profiles in parallel via `eas build`.

## Capabilities

### New Capabilities

- `ci-per-language-builds` — automated, parallel EAS Build run for every supported language on every push to `main`; adding a new language requires one line in `supported-langs.json`.

## Impact

- `eas.json` — new profile entries; no existing profiles altered.
- `scripts/supported-langs.json` — new file; single config change to add/remove a language.
- `scripts/eas-build-matrix.ts` — new script; no runtime dependency.
- `.github/workflows/ci-lang-builds.yml` — new workflow; filename must not collide with `ci-bundle-analysis.yml` (sibling `performance-bundle-analysis` change).

## Out of Scope

- EAS Submit / store publishing.
- Signing certificate provisioning (secrets assumed pre-configured).
- Per-language OTA update channels.
- PR-branch builds (main-push only for v1).

## Unresolved Questions

- Which environments to build in CI — `production` only, or also `staging`? Defaulting to `production` for v1.
- Should failed individual profiles cancel the matrix or continue? Default GHA behavior (continue others) assumed.
- Artifact retention policy for EAS Build artifacts not addressed.
