## Context

`deploy-gh-pages` currently builds a single `eng` build and deploys it to the Pages root. We now want N language builds, each in its own subdirectory, plus a root dashboard page. The workflow needs to iterate over a config file; the landing page needs to be generated (not hand-authored) so adding a new language is a one-line config change.

## Goals / Non-Goals

**Goals:**
- Config-driven: adding a hosted language = one JSON entry, no workflow edits
- Each language build at `<pages-url>/langs/<code>/` — self-contained, deep-linkable
- Landing page is a proper NX React app (`apps/landing-page`) — starts as a single index page, extensible
- Static export at build time so GitHub Pages can serve it with no server

**Non-Goals:**
- Search, filtering, or sorting on the dashboard (v1)
- Automatic discovery of all `languages/` subdirectories (explicit allowlist only)
- RTL support on the dashboard itself (dashboard is English-only chrome)
- Analytics or usage tracking (v1)

## Decisions

### `hosted-languages.json` as explicit allowlist

**Decision:** Repo-root `hosted-languages.json` — array of `{ code, displayName, nativeName }`. Workflow reads this; only listed languages get built.  
**Why:** Not every language pack in `languages/` is ready for public demo. Explicit allowlist keeps control with maintainers. Adding a language = one JSON edit + a `languages/<code>/` folder present.  
**Alternative:** Auto-discover all `languages/*/` directories — too permissive, would publish half-baked packs.

### Per-language output in `dist/langs/<code>/`

**Decision:** Each `nx run alphaTiles:export-web` writes to `dist/langs/<code>/`. The workflow loops over the JSON, builds each language in sequence (not matrix), copies output to the right path.  
**Why:** Sequential avoids GH Actions billing surprises from parallel matrix jobs. Expo web export is fast (<60s). Matrix also complicates the final assembly step.  
**Alternative:** GH Actions matrix — parallel but harder to assemble into a single `dist/` tree for one push.

### NX `export-web` target gains `--output-dir` override

**Decision:** Extend the `export-web` target (or the workflow step) to pass `--output-dir dist/langs/<code>` per invocation. The NX target stays generic; the workflow supplies the path.  
**Why:** Avoids N separate NX targets. One parameterised call per language.

### Landing page is an NX React + Vite app (`apps/landing-page`)

**Decision:** `apps/landing-page` — NX app using `@nx/react` with Vite, statically exported. Reads `hosted-languages.json` at build time (imported as a module or via Vite's `?raw` / JSON import). `nx run landing-page:build` writes to `dist/landing-page/`; the workflow copies its output to `dist/` root before deploying.  
**Why:** Starts simple (one page) but can grow — routing, animations, i18n, analytics — without rewriting the generator. Consistent with the NX monorepo pattern the project already uses. `frontend-design` skill applies cleanly to a React component tree.  
**Alternative considered:** Plain Node.js generator script — zero overhead but not extensible; styling is string concatenation; `/frontend-design` skill can't help with it.  
**Alternative considered:** Next.js — SSG is a strength but heavier setup than needed for a single page; Vite is faster and simpler for a pure static site.

### Single deploy push after all builds complete

**Decision:** All language builds run first, then the landing page is generated into `dist/`, then a single `peaceiris/actions-gh-pages` push deploys the entire `dist/` tree.  
**Why:** Atomic — gh-pages branch is never in a half-built state mid-workflow.

## Risks / Trade-offs

- **Build time grows linearly with language count** → Mitigation: each Expo web export is fast; 10 languages ≈ 10 min max. Re-evaluate if count exceeds ~20.
- **`languages/<code>/` must be committed for each hosted language** → Mitigation: document in `hosted-languages.json` comments; CI fails fast if folder missing.
- **Expo `--output-dir` flag path must be absolute or repo-relative** → Mitigation: set `OUTPUT_DIR=${{ github.workspace }}/dist/langs/$CODE` in workflow step env.
- **Old `<pages-url>/` root URL (from deploy-gh-pages change) will 404** → Acceptable; root now serves the dashboard, not the eng build directly.

## Migration Plan

1. This change supersedes the single-language deploy from `deploy-gh-pages` — implement this change instead of (or on top of) that one
2. Update `.github/workflows/deploy-gh-pages.yml` in place
3. First successful run: gh-pages branch restructured; old root URL now shows dashboard
4. Rollback: revert workflow + JSON to single-language form; gh-pages branch reverts on next push
