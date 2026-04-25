## ADDED Requirements

### Requirement: Workflow triggers on push to main

The CI system SHALL run the GitHub Pages deployment workflow automatically on every push to the `main` branch. Manual dispatch (`workflow_dispatch`) SHALL also be supported.

#### Scenario: Push to main triggers deployment

- **WHEN** a commit is pushed to `main`
- **THEN** the `deploy-gh-pages` workflow starts within GitHub Actions

#### Scenario: Manual trigger works

- **WHEN** a maintainer triggers the workflow manually via the GitHub Actions UI
- **THEN** the workflow runs identically to an automatic push-triggered run

### Requirement: Web export uses committed eng language pack

The workflow SHALL set `APP_LANG=eng` and `PUBLIC_LANG_ASSETS` pointing to the committed `languages/eng/` directory so no external secrets are needed for the demo build.

#### Scenario: Export completes with committed assets

- **WHEN** the workflow runs with `languages/eng/` present in the repo
- **THEN** the prebuild pipeline (rsync → validate → manifest) completes without error and `expo export --platform web` produces output in `dist/`

#### Scenario: Missing language folder fails fast

- **WHEN** `languages/eng/` is absent from the checkout
- **THEN** the prebuild rsync stage exits non-zero and the workflow fails before export

### Requirement: NX export-web target encapsulates web export

`apps/alphaTiles/project.json` SHALL define an `export-web` target that runs `expo export --platform web --output-dir dist`. The workflow SHALL invoke this target via `nx run alphaTiles:export-web`.

#### Scenario: Target runs successfully

- **WHEN** `nx run alphaTiles:export-web` is executed with `APP_LANG=eng`
- **THEN** a `dist/` directory is created containing `index.html` and static assets

### Requirement: Deployment publishes dist/ to gh-pages branch

After a successful export the workflow SHALL push the contents of `dist/` to the `gh-pages` branch using `peaceiris/actions-gh-pages`. The `gh-pages` branch SHALL be an orphan branch containing only the static output.

#### Scenario: Successful deploy updates gh-pages branch

- **WHEN** the export step succeeds and produces `dist/`
- **THEN** the `gh-pages` branch is updated with the new `dist/` contents and GitHub Pages serves the updated site

#### Scenario: Export failure skips deploy

- **WHEN** the export step exits non-zero
- **THEN** the deploy step does not run and the `gh-pages` branch is left unchanged

### Requirement: Workflow uses minimal permissions

The workflow job SHALL declare `permissions: contents: write` and nothing else, following least-privilege practice.

#### Scenario: Workflow has write permission for gh-pages push

- **WHEN** the workflow runs
- **THEN** `GITHUB_TOKEN` has `contents: write` permission allowing the push to `gh-pages`

#### Scenario: No extra permissions granted

- **WHEN** the workflow runs
- **THEN** no permissions beyond `contents: write` are present in the job
