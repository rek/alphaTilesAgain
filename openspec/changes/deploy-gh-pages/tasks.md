## 1. NX Target

- [ ] 1.1 Add `export-web` target to `apps/alphaTiles/project.json` — runs `expo export --platform web --output-dir dist`

## 2. GitHub Actions Workflow

- [ ] 2.1 Create `.github/workflows/deploy-gh-pages.yml` with trigger on push to `main` and `workflow_dispatch`
- [ ] 2.2 Add checkout step (full depth not needed — `fetch-depth: 1`)
- [ ] 2.3 Add Node + dependency install steps (match CI node version)
- [ ] 2.4 Set `APP_LANG=eng` and `PUBLIC_LANG_ASSETS=${{ github.workspace }}/languages/eng` env vars
- [ ] 2.5 Add step: `nx run alphaTiles:export-web`
- [ ] 2.6 Add `peaceiris/actions-gh-pages@v4` step pointing at `dist/`
- [ ] 2.7 Set `permissions: contents: write` on the job

## 3. Repo Settings (manual)

- [ ] 3.1 Enable GitHub Pages in repo Settings → Pages → Source: `gh-pages` branch, `/ (root)`

## 4. Verification

- [ ] 4.1 Push to `main` and confirm workflow passes in Actions tab
- [ ] 4.2 Confirm Pages URL loads the app (Settings → Pages shows the URL)
