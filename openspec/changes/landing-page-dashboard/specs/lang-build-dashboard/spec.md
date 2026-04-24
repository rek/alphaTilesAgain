## ADDED Requirements

### Requirement: hosted-languages config file

A `hosted-languages.json` file SHALL exist at the repo root defining the list of language builds to deploy. Each entry SHALL contain `code` (ISO 639-3 or equivalent), `displayName` (English), and `nativeName` (language's own script).

#### Scenario: Valid config with multiple languages

- **WHEN** `hosted-languages.json` contains two or more entries with `code`, `displayName`, and `nativeName`
- **THEN** the build workflow and landing page generator consume all entries without error

#### Scenario: Missing required field fails fast

- **WHEN** an entry in `hosted-languages.json` is missing `code`, `displayName`, or `nativeName`
- **THEN** the landing page generator script exits non-zero with an error naming the malformed entry

### Requirement: Landing page lists all hosted languages

The generated `dist/index.html` SHALL display one card per entry in `hosted-languages.json`. Each card SHALL show the `displayName`, the `nativeName`, and a launch link to `./langs/<code>/`.

#### Scenario: Dashboard renders all configured languages

- **WHEN** `hosted-languages.json` has N entries and `dist/index.html` is generated
- **THEN** `dist/index.html` contains exactly N language cards, each linking to `./langs/<code>/`

#### Scenario: No JavaScript required to view the list

- **WHEN** a browser loads `dist/index.html` with JavaScript disabled
- **THEN** all language cards and their launch links are visible and functional

### Requirement: Landing page is a statically exported NX React app

`apps/landing-page` SHALL be an NX React + Vite application. `nx run landing-page:build` SHALL produce a fully static site (no server-side rendering required at runtime) deployable to GitHub Pages.

#### Scenario: Build produces static output

- **WHEN** `nx run landing-page:build` is run
- **THEN** a `dist/landing-page/` directory is created containing `index.html` and all static assets with no Node.js runtime required to serve them

#### Scenario: App renders in browser without a backend

- **WHEN** `dist/landing-page/index.html` is opened directly in a browser (file:// or static server)
- **THEN** the dashboard page renders with all language cards visible

### Requirement: Language cards display native script

Each card on the dashboard SHALL render `nativeName` in a visually prominent way so speakers of the language can identify their pack without reading English.

#### Scenario: Native name is visible

- **WHEN** `dist/index.html` is opened
- **THEN** each card shows `nativeName` at a larger font size than `displayName`

### Requirement: Dashboard has a project title and description

`dist/index.html` SHALL include the project name "AlphaTiles" and a one-sentence description so first-time visitors understand what they are launching.

#### Scenario: Title present in output

- **WHEN** `dist/index.html` is generated
- **THEN** the page `<title>` and a visible `<h1>` both contain "AlphaTiles"
