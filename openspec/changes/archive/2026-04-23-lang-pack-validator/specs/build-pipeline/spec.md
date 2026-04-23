## MODIFIED Requirements

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
