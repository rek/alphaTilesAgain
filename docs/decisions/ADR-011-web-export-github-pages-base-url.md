# ADR-011: Web Export Base URL for GitHub Pages Sub-Path Deployment

**Date**: 2026-04-25
**Status**: Accepted

## Context

The web export is deployed to GitHub Pages at a sub-path:
`https://rek.github.io/alphaTilesAgain/engEnglish4/`

GitHub Pages for a project repo always places the site under `/<repo-name>/`, so every
language app lives at `/<repo-name>/<langSlug>/` (e.g. `/alphaTilesAgain/engEnglish4`).

Expo's `expo export --platform web` generates HTML with root-absolute asset paths
(`/_expo/...`, `/assets/...`). Without configuration, these resolve to
`https://rek.github.io/_expo/...` — a 404 — instead of the correct
`https://rek.github.io/alphaTilesAgain/engEnglish4/_expo/...`.

The `EXPO_BASE_URL` env var is inlined into the JS bundle by `babel-preset-expo` for
router configuration, but does **not** affect HTML asset paths. HTML asset paths are
controlled by `app.config.ts`'s `experiments.baseUrl` field, which is read by
`getBaseUrlFromExpoConfig()` in `@expo/cli`'s export pipeline.

## Decision

1. `app.config.ts` passes `process.env.EXPO_BASE_URL` into `experiments.baseUrl`, making
   the Metro serializer prefix all HTML asset references with the base path.

2. `EXPO_BASE_URL` in `deploy.yaml` is set to the **full** path including the repo name:
   `/alphaTilesAgain/engEnglish4` (not just `/engEnglish4`).

## Rationale

`experiments.baseUrl` is the only mechanism that makes the Expo export pipeline prefix
`<script src>` and `<link href>` in the generated HTML. Reusing `EXPO_BASE_URL` keeps a
single source of truth per CI step; no second env var is needed.

The full path (`/alphaTilesAgain/engEnglish4`) is required because GitHub Pages serves
project sites under `/<repo-name>/`. Using only `/engEnglish4` would still produce 404s.

### Pros
- One env var drives both HTML asset paths and in-app router base URL.
- No post-processing of HTML files; Expo handles it natively.
- `EXPO_BASE_URL=''` (unset) is safe for local dev — produces root-absolute paths that
  work at `http://localhost:8081/`.

### Cons
- `EXPO_BASE_URL` must include the GitHub repo name (`alphaTilesAgain`). If the repo is
  renamed or the Pages deployment path changes, both `deploy.yaml` and `app.config.ts`
  behaviour change together (only `deploy.yaml` env values need updating).

## Alternatives Considered

### Alternative 1: Post-process HTML with sed
Rewrite `/_expo/` → `/alphaTilesAgain/engEnglish4/_expo/` in all HTML files after export.

Rejected: brittle — depends on hard-coded path prefixes appearing as literal strings, breaks
if Expo changes output structure, and requires manual updates per language slug.

### Alternative 2: `<base href>` injection
Insert `<base href="/alphaTilesAgain/engEnglish4/">` into the HTML.

Rejected: `<base href>` only affects relative URLs; root-absolute paths (starting with `/`)
ignore it. Expo generates root-absolute paths, so this has no effect.

### Alternative 3: Serve from domain root
Deploy to a custom domain so the app is at `https://example.com/` (no sub-path).

Rejected: requires a custom domain; we use GitHub Pages free hosting.

## Consequences

### Positive
- JS bundle, fonts, and all static assets load correctly on the deployed GitHub Pages site.
- Adding a new language pack requires only adding its env block in `deploy.yaml` with the
  correct full base URL.

### Neutral
- Each CI language build must pass `EXPO_BASE_URL=/alphaTilesAgain/<langSlug>`.
- Local `expo export` without `EXPO_BASE_URL` produces an export only suitable for serving
  from `/`; use `EXPO_BASE_URL=/alphaTilesAgain/engEnglish4 npx expo export` to test
  GitHub Pages locally.

## Implementation Notes

`app.config.ts` experiments block:
```ts
experiments: {
  typedRoutes: true,
  reactCompiler: true,
  baseUrl: process.env.EXPO_BASE_URL ?? '',
},
```

`deploy.yaml` env per language step:
```yaml
env:
  APP_LANG: eng
  EXPO_BASE_URL: /alphaTilesAgain/engEnglish4
```

Pattern for new languages: `EXPO_BASE_URL: /alphaTilesAgain/<langSlug>` where `<langSlug>`
matches the sub-directory name used in the "Stage" step.

## References

- `@expo/cli` source: `exportApp.js` → `getBaseUrlFromExpoConfig` reads `exp.experiments.baseUrl`
- `babel-preset-expo`: inlines `process.env.EXPO_BASE_URL` into the JS bundle for runtime routing only
- Expo Router docs: Static rendering — https://docs.expo.dev/router/web/static-rendering/
