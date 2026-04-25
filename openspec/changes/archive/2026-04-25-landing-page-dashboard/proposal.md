## Why

The single-language Pages deploy (`deploy-gh-pages`) gives one demo URL, but AlphaTiles serves many language communities — partners need to see their specific language, and evaluators want to compare across packs. A root landing page with launch buttons for each hosted language makes the multi-language nature of the project immediately legible.

## What Changes

- Extend the CI workflow to build each hosted language into its own subdirectory (`langs/<code>/`) instead of the repo root
- Add a static landing page (`index.html`) at the Pages root listing all available language builds with launch buttons
- Add a `hosted-languages.json` config file to the repo that controls which language builds are included in the Pages deploy
- The landing page is plain HTML/CSS — no framework dependency, loads instantly, works without JS for the list

## Capabilities

### New Capabilities

- `lang-build-dashboard`: Static landing page at the GitHub Pages root listing each hosted language with a name, native-script label, and a launch button linking to its subdirectory build

### Modified Capabilities

- `gh-pages-deploy`: Must now build N languages (matrix from `hosted-languages.json`) into `langs/<code>/` subdirectories and place the generated `index.html` at the root, rather than deploying a single build to the root

## Impact

- New file: `hosted-languages.json` (repo root or `.github/`) — list of `{ code, displayName, nativeName }` entries
- New file: `scripts/generate-landing-page.js` (or similar) — reads `hosted-languages.json`, writes `dist/index.html`
- Modified: `.github/workflows/deploy-gh-pages.yml` — matrix build loop + landing page generation step
- Each language build now lives at `<pages-url>/langs/<code>/` not `<pages-url>/`
- Existing `eng`-only URLs will break (no redirect); acceptable for a pre-launch demo
