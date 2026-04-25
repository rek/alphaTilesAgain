## MODIFIED Requirements

### Requirement: Web export uses committed eng language pack

The workflow SHALL read `hosted-languages.json` and build each listed language pack into `dist/langs/<code>/`. For each language, `APP_LANG=<code>` and `PUBLIC_LANG_ASSETS=${{ github.workspace }}/languages/<code>` SHALL be set. The committed `languages/<code>/` folder for each listed language SHALL be present in the repo.

#### Scenario: Multi-language export completes

- **WHEN** `hosted-languages.json` lists two languages (e.g. `eng`, `hin`) and both `languages/eng/` and `languages/hin/` exist in the repo
- **THEN** the workflow builds each language in sequence and produces `dist/langs/eng/` and `dist/langs/hin/` each containing `index.html` and static assets

#### Scenario: Missing language folder fails fast

- **WHEN** `hosted-languages.json` lists a language whose `languages/<code>/` folder is absent
- **THEN** the prebuild rsync stage exits non-zero and the workflow fails, naming the missing language

### Requirement: NX export-web target encapsulates web export

`apps/alphaTiles/project.json` SHALL define an `export-web` target that accepts an output directory override. The workflow SHALL invoke `nx run alphaTiles:export-web` with `OUTPUT_DIR=dist/langs/<code>` for each language, producing output in that subdirectory.

#### Scenario: Target writes to parameterised output path

- **WHEN** `nx run alphaTiles:export-web` is executed with `APP_LANG=eng` and `OUTPUT_DIR=dist/langs/eng`
- **THEN** `dist/langs/eng/index.html` and accompanying static assets are created

### Requirement: Deployment publishes dist/ to gh-pages branch

After all language exports and landing page generation succeed, the workflow SHALL push the entire `dist/` tree (including `dist/index.html` and all `dist/langs/<code>/` subdirectories) to the `gh-pages` branch in a single commit using `peaceiris/actions-gh-pages`.

#### Scenario: All builds succeed — single deploy push

- **WHEN** all language exports and `generate-landing-page.js` complete without error
- **THEN** one push to `gh-pages` publishes `dist/index.html` (dashboard) and all `dist/langs/<code>/` builds atomically

#### Scenario: Any build failure skips deploy

- **WHEN** any language export or the landing page generator exits non-zero
- **THEN** the deploy step does not run and the `gh-pages` branch is left unchanged

## ADDED Requirements

### Requirement: Landing page NX build step in workflow

The workflow SHALL run `nx run landing-page:build` after all language exports complete and before the deploy step. The build output SHALL be copied from `dist/landing-page/` to `dist/` root so GitHub Pages serves the dashboard at `/`.

#### Scenario: Landing page build runs between language builds and deploy

- **WHEN** all language build steps succeed
- **THEN** the next steps are `nx run landing-page:build` then a copy of `dist/landing-page/*` → `dist/`, followed by the `peaceiris/actions-gh-pages` deploy step

#### Scenario: Landing page build failure skips deploy

- **WHEN** `nx run landing-page:build` exits non-zero
- **THEN** the deploy step does not run and the `gh-pages` branch is left unchanged
