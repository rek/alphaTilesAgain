## 1. Config File

- [ ] 1.1 Create `hosted-languages.json` at repo root — array of `{ code, displayName, nativeName }` with initial `eng` entry
- [ ] 1.2 Add TypeScript type for the config shape (inferred, no separate type file) in the app

## 2. NX App Scaffold

- [ ] 2.1 Generate NX React + Vite app: `nx g @nx/react:app landing-page --bundler=vite --style=css --routing=false`
- [ ] 2.2 Confirm `apps/landing-page/project.json` has `build` target outputting to `dist/landing-page`
- [ ] 2.3 Add `export-static` target (or configure existing `build`) to produce a fully static export suitable for GitHub Pages

## 3. Landing Page UI

- [ ] 3.0 Run `/frontend-design` before writing any component code — design the dashboard (cards, layout, typography, color palette) first
- [ ] 3.1 Import `hosted-languages.json` in the app (Vite JSON import or `?raw` + parse)
- [ ] 3.2 Build `LanguageCard` component — `nativeName` (large/prominent), `displayName`, launch link to `../langs/<code>/`
- [ ] 3.3 Build `HomePage` — project title "AlphaTiles", one-sentence description, grid of `LanguageCard`s
- [ ] 3.4 Wire `App.tsx` to render `HomePage`
- [ ] 3.5 Verify page renders correctly and links resolve to correct language subdirectories

## 4. NX Target Update (alphaTiles app)

- [ ] 4.1 Update `export-web` target in `apps/alphaTiles/project.json` to accept `OUTPUT_DIR` env var for `--output-dir` (fallback to `dist` if unset)

## 5. Workflow Update

- [ ] 5.1 Add `nx run landing-page:build` step before the deploy step
- [ ] 5.2 Add step to copy `dist/landing-page/` contents to `dist/` root (so Pages serves the dashboard at `/`)
- [ ] 5.3 Replace single-language build step with a loop over `hosted-languages.json` entries
- [ ] 5.4 Each iteration: set `APP_LANG=<code>`, `PUBLIC_LANG_ASSETS=…/languages/<code>`, `OUTPUT_DIR=dist/langs/<code>`, run `nx run alphaTiles:export-web`
- [ ] 5.5 Confirm `peaceiris/actions-gh-pages` deploy step points at `dist/` root (unchanged)

## 6. Verification

- [ ] 6.1 Push to `main` — confirm workflow builds landing page + all languages, deploy passes
- [ ] 6.2 Visit Pages root URL — dashboard renders, all language cards visible
- [ ] 6.3 Click each card — game loads in correct language at `/langs/<code>/`
- [ ] 6.4 Add a second language to `hosted-languages.json` — verify it appears after next deploy
