## Retrograde Note

Planned scope (config-driven multi-language dashboard) was simplified at implementation time. Tasks below reflect what was actually built.

## Delivered

- [x] Static landing page in `apps/home/` (Vite + React + Tailwind CSS)
  - [x] Hardcoded `LANGUAGES` array (`eng`, `yue`) — no `hosted-languages.json`
  - [x] Language cards with launch buttons linking to `/${fixture}/`
  - [x] Hero, About, How it Works sections
  - [x] Responsive design, lint + type check passing
- [x] Deploy workflow (`.github/workflows/deploy.yaml`)
  - [x] Builds `apps/home` → `dist/apps/home/`
  - [x] Builds `engEnglish4` export → assembles to `dist/site/engEnglish4/`
  - [x] Copies home build to `dist/site/` root
  - [x] Deploys `dist/site/` via `actions/deploy-pages`

## Deferred (not implemented)

- `hosted-languages.json` config file
- `apps/landing-page/` NX app (used `apps/home/` instead)
- Multi-language CI loop
- `OUTPUT_DIR` env var support in `alphaTiles` export-web target
