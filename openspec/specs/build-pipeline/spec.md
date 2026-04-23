# build-pipeline Specification

## Purpose
TBD - created by archiving change port-foundations. Update Purpose after archive.
## Requirements
### Requirement: Language-scoped builds driven by `APP_LANG`

Every build (dev, preview, production) SHALL be bound to exactly one language pack, selected by the `APP_LANG` environment variable. A build without `APP_LANG` set MUST fail fast before any other step runs.

#### Scenario: Dev server with valid `APP_LANG`

- **WHEN** a developer runs `APP_LANG=eng nx start alphaTiles` with `languages/eng/` materialized
- **THEN** the prebuild pipeline runs (rsync → validate → manifest), the Metro bundler starts, and the app boots bound to the `eng` pack

#### Scenario: Dev server without `APP_LANG`

- **WHEN** a developer runs `nx start alphaTiles` with no `APP_LANG` env var
- **THEN** the build fails with an error message naming `APP_LANG` and referencing `docs/GETTING_STARTED.md`

#### Scenario: EAS build profile

- **WHEN** `eas build --profile eng` is invoked
- **THEN** the profile's `env.APP_LANG=eng` is set and the build produces a binary bound to the `eng` pack

### Requirement: Prebuild pipeline ordering

The prebuild pipeline SHALL execute in the order: rsync → validate → generate-manifest → expo-config-resolve. Each stage MUST depend on its predecessor via NX `dependsOn` declarations. The validate stage SHALL invoke the full language-pack validator (`util-lang-pack-validator`). Any error-severity issue from the validator MUST abort the pipeline; warnings and info issues SHALL print to the console without blocking.

#### Scenario: Rsync failure aborts the pipeline

- **WHEN** the rsync stage fails (e.g. `PUBLIC_LANG_ASSETS` unset)
- **THEN** the validate, generate-manifest, and expo-config stages DO NOT run and the build exits non-zero

#### Scenario: Validation error aborts the pipeline

- **WHEN** the rsync succeeds but the validator emits at least one error-severity issue
- **THEN** the generate-manifest stage DOES NOT run and the build exits non-zero with the validator's human-readable report printed to stderr

#### Scenario: Validation warnings do not abort

- **WHEN** the validator emits only warnings and info issues (zero errors)
- **THEN** the generate-manifest stage runs and the build proceeds; warnings are printed to the console

#### Scenario: Manifest regenerated on every build

- **WHEN** the pipeline runs
- **THEN** `apps/alphaTiles/src/generated/langManifest.ts` is rewritten from scratch, regardless of its previous contents

### Requirement: Dynamic Expo config per language

`apps/alphaTiles/app.config.ts` SHALL resolve the Expo configuration at build time using the active language pack's `aa_langinfo.txt`. The resolved config MUST include per-pack values for: app display name, slug, iOS `bundleIdentifier`, Android `package`, and script-direction metadata passed through `extra.scriptDirection`.

#### Scenario: English pack

- **WHEN** `APP_LANG=eng` and `languages/eng/aa_langinfo.txt` has `Lang Name (In Local Lang) = English`
- **THEN** the resolved config has `name = "English"` (or the pack's configured `Game Name In Local Lang`), bundleId suffix `.blue.eng`, `extra.scriptDirection = "LTR"`

#### Scenario: Missing langinfo

- **WHEN** `languages/<APP_LANG>/aa_langinfo.txt` is absent or unparseable
- **THEN** `app.config.ts` throws with a message identifying the missing / malformed file

### Requirement: Per-pack icon and splash override

The build SHALL use `languages/<APP_LANG>/images/icon.png` and `.../splash.png` when present, falling back to the shared defaults at `apps/alphaTiles/assets/images/` otherwise.

#### Scenario: Pack provides icon

- **WHEN** `languages/<APP_LANG>/images/icon.png` exists
- **THEN** `app.config.ts` resolves `icon` to that path

#### Scenario: Pack omits icon

- **WHEN** `languages/<APP_LANG>/images/icon.png` does not exist
- **THEN** `app.config.ts` resolves `icon` to `apps/alphaTiles/assets/images/icon-default.png`

### Requirement: RTL force applied at entry

Apps bound to a pack whose `aa_langinfo.txt` specifies `Script direction = RTL` SHALL call `I18nManager.forceRTL(true)` before the root React component mounts. The decision MUST read from `Constants.expoConfig.extra.scriptDirection`, not from the language pack directly (the entry has no access to the `languages/` tree at runtime).

#### Scenario: LTR pack

- **WHEN** a build has `extra.scriptDirection = "LTR"`
- **THEN** the entry does not call `I18nManager.forceRTL` and the app renders LTR

#### Scenario: RTL pack

- **WHEN** a build has `extra.scriptDirection = "RTL"`
- **THEN** the entry calls `I18nManager.forceRTL(true)` and `I18nManager.allowRTL(true)` before rendering

