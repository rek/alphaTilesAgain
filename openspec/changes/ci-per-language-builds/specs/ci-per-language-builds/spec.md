## ADDED Requirements

### Requirement: Each supported language has a named EAS Build profile

`eas.json` SHALL contain one build profile named `<langCode>-production` for every lang code listed in `scripts/supported-langs.json`. Each profile SHALL set the `APP_LANG` environment variable to its lang code.

#### Scenario: Profile exists for each lang

- **GIVEN** `scripts/supported-langs.json` contains lang codes `["yue", "eng"]`
- **WHEN** `eas.json` is inspected
- **THEN** profiles `yue-production` and `eng-production` both exist under the `build` key
- **AND** each profile's `env.APP_LANG` equals its lang code

#### Scenario: Profile inherits base production config

- **GIVEN** a lang-specific profile (e.g. `yue-production`)
- **WHEN** the profile is examined
- **THEN** it extends or is structurally equivalent to the base `production` profile
- **AND** the only override is `env.APP_LANG`

### Requirement: Matrix script outputs valid GHA-consumable JSON

`scripts/eas-build-matrix.ts` SHALL output to stdout a JSON array of objects, each with exactly the keys `profile` (string) and `lang` (string), when invoked as `npx ts-node scripts/eas-build-matrix.ts`.

#### Scenario: Default output matches supported langs

- **GIVEN** `scripts/supported-langs.json` contains `["yue", "eng"]`
- **WHEN** `npx ts-node scripts/eas-build-matrix.ts` is run
- **THEN** stdout is valid JSON
- **AND** the array contains exactly two objects: `{ "profile": "yue-production", "lang": "yue" }` and `{ "profile": "eng-production", "lang": "eng" }`

#### Scenario: --env flag changes profile suffix

- **GIVEN** `scripts/supported-langs.json` contains `["yue"]`
- **WHEN** `npx ts-node scripts/eas-build-matrix.ts --env staging` is run
- **THEN** stdout contains `[{ "profile": "yue-staging", "lang": "yue" }]`

#### Scenario: Empty lang list causes non-zero exit

- **GIVEN** `scripts/supported-langs.json` contains `[]`
- **WHEN** the matrix script is run
- **THEN** the process exits with a non-zero code

### Requirement: APP_LANG is injected per build profile

Each EAS Build triggered by a lang-specific profile SHALL receive `APP_LANG` set to the correct lang code in its build environment.

#### Scenario: APP_LANG set in yue build

- **GIVEN** EAS Build is triggered with profile `yue-production`
- **WHEN** the build environment is examined
- **THEN** `APP_LANG` equals `"yue"`

#### Scenario: APP_LANG set in eng build

- **GIVEN** EAS Build is triggered with profile `eng-production`
- **WHEN** the build environment is examined
- **THEN** `APP_LANG` equals `"eng"`

### Requirement: Adding a language requires only one config change

Adding a new lang code to `scripts/supported-langs.json` and the corresponding `eas.json` profile SHALL be the complete set of changes required to include that language in the CI matrix.

#### Scenario: New lang appears in matrix after config update

- **GIVEN** `scripts/supported-langs.json` is updated to add `"fra"`
- **AND** a corresponding `fra-production` profile is added to `eas.json`
- **WHEN** the matrix script is run
- **THEN** the output includes `{ "profile": "fra-production", "lang": "fra" }`
- **AND** no other source files require modification

### Requirement: GitHub Actions workflow dispatches all profiles in parallel

`.github/workflows/ci-lang-builds.yml` SHALL trigger on push to `main` and `workflow_dispatch`, generate the build matrix via the matrix script, and run one job per matrix entry concurrently.

#### Scenario: Push to main triggers all lang builds

- **GIVEN** a commit is pushed to `main`
- **WHEN** the `CI — Language Builds` workflow runs
- **THEN** one build job is dispatched for each entry in the matrix
- **AND** the jobs run concurrently (no explicit serial dependency between them)

#### Scenario: Each job uses the correct EAS profile

- **GIVEN** the matrix contains `{ "profile": "yue-production", "lang": "yue" }`
- **WHEN** the corresponding matrix job runs
- **THEN** it invokes `eas build --profile yue-production`

#### Scenario: Workflow uses EXPO_TOKEN secret

- **GIVEN** the `EXPO_TOKEN` secret is set in GitHub repository secrets
- **WHEN** any matrix job runs
- **THEN** `EXPO_TOKEN` is available to the `eas build` command
- **AND** the token value is not echoed to logs
