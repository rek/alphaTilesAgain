# ADR-002: Language Pack Sourcing

**Date**: 2026-04-23
**Status**: Accepted

## Context

Language packs — the tab-delimited data files, audio, images, and fonts that define a specific language's content — live in a separate `PublicLanguageAssets` repository maintained by the AlphaTiles content team. That repo has its own cadence: linguists and community partners land pack updates independently of the app engine's release cycle.

The app needs that content on disk at build time (see ADR-001). The question is: how does content flow from the external repo into this repo's build?

Constraints:

- The engine repo and content repo must release independently.
- The engine repo must not bloat with binary audio / image assets for every supported language.
- Contributors who only edit the engine should not be forced to clone gigabytes of content.
- Build reproducibility matters — a tagged engine commit must be buildable against a pinned content snapshot.

## Decision

Language packs are sourced at prebuild via `rsync` from an external path `$PUBLIC_LANG_ASSETS` (env var) into `languages/<APP_LANG>/`. The `languages/` directory is gitignored.

- Dev and CI both set `$PUBLIC_LANG_ASSETS` to a local checkout of `PublicLanguageAssets` (CI clones it at a pinned commit).
- `tools/rsync-lang-packs.ts` copies `$PUBLIC_LANG_ASSETS/<pack>/res/` → `languages/<APP_LANG>/`, normalizing the flat shape described in `docs/ARCHITECTURE.md` §5.
- The rsync is a prebuild step — it runs before validation (ADR-008) and manifest generation (ADR-003).
- Build reproducibility comes from pinning the content repo commit in CI, not from vendoring.

## Rationale

The content repo has its own release cadence, its own contributor population (linguists, not engineers), and its own size profile (heavy binary media). Vendoring couples two teams' release cycles for no gain. Submoduling introduces known Git friction. Rsync is the simplest primitive that satisfies both "fresh content at build time" and "clean engine repo."

### Pros

- Independent release cycles — content team ships without touching this repo.
- Clean engine repo — `git status` never shows language assets.
- Engineers-only clones stay small — content is opt-in per `APP_LANG`.
- CI pins content repo by commit SHA — build reproducibility preserved.
- Swapping a pack locally is a one-liner (`APP_LANG=tpx bun prebuild`).

### Cons

- Requires `$PUBLIC_LANG_ASSETS` to be set; missing env → prebuild fails.
- No built-in version pinning between engine commit and content commit — the link is CI configuration, not source code.
- Rsync is not cross-platform-pure; Windows dev requires WSL or MSYS rsync.

## Alternatives Considered

### Alternative 1: Vendor packs as committed files in this repo

Copy `PublicLanguageAssets/*/res/` into this repo, commit everything.

- **Why not**: Repo bloats to gigabytes (audio × hundreds of languages). Every content-team PR becomes an engine-repo PR, coupling release cycles. Contributors who only touch the engine pay the full clone cost.

### Alternative 2: Git submodule of `PublicLanguageAssets`

Pin the content repo as a submodule.

- **Why not**: Submodule friction is well-documented — contributors routinely forget `--recurse-submodules`, CI setups need extra steps, detached-HEAD state in the submodule is confusing. The version-pin benefit is real but achievable at the CI level without the friction.

### Alternative 3: Fetch packs over HTTPS at runtime

Host packs on a CDN; app downloads on first launch.

- **Why not**: Violates the no-backend constraint (ADR-001). Also changes the install story for low-connectivity users, who are the core audience.

### Alternative 4: npm-publish each language pack as a package

Content team publishes `@alphatiles/lang-eng` etc.; engine depends on the selected one.

- **Why not**: Forces linguists to learn npm publishing. Binary assets in npm packages are awkward. Solves a problem we don't have.

## Consequences

### Positive

- `docs/GETTING_STARTED.md` documents `$PUBLIC_LANG_ASSETS` as a one-time setup step.
- CI workflow clones `PublicLanguageAssets` at a pinned SHA, then runs builds per `APP_LANG`.
- `languages/` stays absent from PR diffs forever — noise-free review.

### Negative

- A missing or misconfigured `$PUBLIC_LANG_ASSETS` is a first-class failure mode. Error message must be unambiguous.
- No single-tree `git bisect` across engine + content. Debugging a content-caused regression requires two checkouts.

### Neutral

- `.gitignore` permanently ignores `languages/`.
- `manifest.json` is emitted by rsync (per pack) with file listing and checksums — hands-off downstream for validator and manifest generator.

## Implementation Notes

- `tools/rsync-lang-packs.ts` must:
  - Validate `$PUBLIC_LANG_ASSETS` points to an existing directory with a `<APP_LANG>/res/` subdirectory.
  - Compute checksums of copied files, write `manifest.json` under `languages/<APP_LANG>/`.
  - Exit non-zero with a clear message on any failure.
- CI pins the content repo by commit SHA in its workflow yaml, not in this repo's source.
- Suggest (not enforce) a content-repo commit SHA in `docs/GETTING_STARTED.md` for local dev reproducibility.
- Local convenience: a single `bun prebuild:eng` script that sets `APP_LANG=eng` and runs the full rsync → validate → generate chain.

## References

- `docs/ARCHITECTURE.md` §4 (prebuild sequence), §5 (pack shape)
- ADR-001 (per-language build mechanism) — why `APP_LANG` exists
- ADR-003 (asset bundling via generated manifest) — downstream consumer of rsync output
- ADR-008 (full validator port) — gate that runs on rsync output before manifest generation
