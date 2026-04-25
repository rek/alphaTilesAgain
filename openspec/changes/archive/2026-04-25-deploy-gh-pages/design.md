## Context

AlphaTiles uses an NX monorepo with Expo. Expo supports `expo export --platform web` which produces a static site in `dist/`. The prebuild pipeline requires `APP_LANG` and `PUBLIC_LANG_ASSETS` (rsync source). For a Pages demo we pick one language (English, `eng`) and bundle its assets directly into the repo under `languages/eng/` (already present for dev use). GitHub Pages can be fed from a `gh-pages` branch via the `peaceiris/actions-gh-pages` action.

## Goals / Non-Goals

**Goals:**
- Push-to-`main` triggers a web export of the `eng` language pack and deploys it to GitHub Pages
- Workflow is self-contained — no external rsync source required in CI (uses committed `languages/eng/` assets)
- Zero app-source changes

**Non-Goals:**
- Multi-language Pages builds (one language per deployment)
- EAS / native builds
- Preview deploys on PRs
- Automated testing in the pipeline (separate concern)

## Decisions

### Use committed `languages/eng/` assets, not rsync

**Decision:** Set `PUBLIC_LANG_ASSETS=languages/eng` (repo-relative) so the prebuild rsync copies from the committed folder.  
**Why:** Avoids needing external asset storage secrets for a public demo. The `eng` pack is already checked in.  
**Alternative considered:** Pull assets from a separate private repo via SSH deploy key — adds secret management complexity not worth it for a demo.

### `peaceiris/actions-gh-pages` for publishing

**Decision:** Use `peaceiris/actions-gh-pages@v4` to push `dist/` to `gh-pages` branch.  
**Why:** Battle-tested, zero config for static output, handles orphan branch management.  
**Alternative considered:** `JamesIves/github-pages-deploy-action` — equivalent, no strong preference; `peaceiris` has wider adoption in Expo community.

### Single workflow file, no reusable workflow

**Decision:** Inline all steps in `.github/workflows/deploy-gh-pages.yml`.  
**Why:** Only one job, one trigger. Reusable workflow abstraction adds indirection with no benefit at this scale.

### NX `export-web` target wraps `expo export`

**Decision:** Add an `export-web` target to `apps/alphaTiles/project.json` so the workflow runs `nx run alphaTiles:export-web` rather than shelling out to expo directly.  
**Why:** Consistent with how all other pipeline steps are invoked; picks up NX caching automatically.

## Risks / Trade-offs

- **`languages/eng/` assets drift from production pack** → Mitigation: document that Pages build uses committed assets; community can update them via PR.
- **Prebuild rsync stage expects absolute path** → Mitigation: set `PUBLIC_LANG_ASSETS` to `${{ github.workspace }}/languages/eng` (absolute at runtime).
- **gh-pages branch force-push on every deploy** → Expected behavior for static sites; no history needed there.

## Migration Plan

1. Enable GitHub Pages on repo (Settings → Pages → Source: `gh-pages` branch, `/ (root)`)
2. Merge workflow file — first CI run deploys
3. Rollback: disable Pages in repo settings or revert workflow commit
