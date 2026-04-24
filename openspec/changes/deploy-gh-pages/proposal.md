## Why

No public demo exists for AlphaTiles — evaluators, community partners, and contributors cannot try the app without a local dev setup. A GitHub Pages deployment of the Expo web build gives a shareable, always-current preview at zero hosting cost.

## What Changes

- Add GitHub Actions workflow that builds `apps/alphaTiles` for web (`expo export --platform web`) and publishes the output to `gh-pages` branch
- Workflow triggers on push to `main`
- Build uses a fixed `APP_LANG` (e.g. `eng`) since Pages hosts one language at a time
- No new runtime code — CI/CD only

## Capabilities

### New Capabilities

- `gh-pages-deploy`: GitHub Actions workflow that exports the Expo web build and deploys to GitHub Pages on each push to `main`

### Modified Capabilities

<!-- none -->

## Impact

- New file: `.github/workflows/deploy-gh-pages.yml`
- Requires `APP_LANG` and any language-asset env vars to be set as GitHub Actions secrets/vars
- `build-pipeline` prebuild script must run cleanly in the GH Actions environment (rsync stage needs `PUBLIC_LANG_ASSETS` or a bundled fallback)
- No app source changes
