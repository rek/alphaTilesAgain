# Tooling Reference

Invocation sheet for this repo. Cross-linked from `AGENTS.md`.

## Environment

- **Node**: latest LTS via `nvm`/`asdf`
- **Bun**: `/home/adam/.bun/bin/bun` (used for `tools/` scripts; Node `tsx` fallback acceptable)
- **Package manager**: npm (workspaces); do not switch to yarn/pnpm without an ADR
- **Required env vars**:
  - `APP_LANG` — language pack code (e.g. `eng`, `tpx`, `yue`)
  - `PUBLIC_LANG_ASSETS` — absolute path to sibling `PublicLanguageAssets` repo (set in `~/.zshrc` or per-shell)

## NX

```sh
# Library scaffolding
./nx g @nx/js:lib util-foo \
    --directory=libs/shared/util-foo \
    --tags='type:util,scope:shared'

./nx g @nx/react-native:lib feature-foo \
    --directory=libs/alphaTiles/feature-foo \
    --tags='type:feature,scope:alphaTiles'

# After generating: confirm tsconfig.base.json has the path alias (the generator
# sometimes misses it). Add manually:
#   "paths": { "@alphaTiles/feature-foo": ["libs/alphaTiles/feature-foo/src/index.ts"] }

# Run targets
./nx start alphaTiles                    # Metro bundler (APP_LANG must be set)
./nx serve alphaTiles                    # Web dev server
./nx run-android alphaTiles              # Android build + run
./nx run-ios alphaTiles                  # iOS build + run
./nx web-export alphaTiles               # Static web export

# Prebuild chain (from port-foundations)
./nx rsync-lang-pack alphaTiles          # rsync from $PUBLIC_LANG_ASSETS
./nx validate-lang-pack alphaTiles       # run the (placeholder → full) validator
./nx generate-lang-manifest alphaTiles   # write src/generated/langManifest.ts
./nx prebuild-lang alphaTiles            # chain of the above three

# Testing + linting
./nx test <lib>                          # unit tests for one lib
./nx affected:test                       # only affected libs
./nx affected:lint
./nx affected:build
./nx graph                               # show dependency graph
./nx show projects                       # list everything
./nx show project <name>                 # targets for one project
```

## OpenSpec

```sh
openspec --version                          # 1.2.0 at time of writing
openspec list changes
openspec status --all
openspec status --change <name>
openspec status --change <name> --json      # structured; parse applyRequires
openspec instructions <artifact> --change <name> --json   # template + rules for an artifact
openspec validate <name>                    # structural validation
openspec validate <name> --strict           # strict mode (scenario format, etc.)
openspec validate --changes                 # validate all in-flight changes
openspec new change <name>                  # scaffold
openspec archive <name>                     # archive completed change
```

Slash-commands (inside Claude Code):

```
/opsx:propose <name>
/opsx:explore
/opsx:apply
/opsx:archive
```

## EAS (per-language builds)

```sh
eas init                                    # one-time per project; writes projectId into app.config.ts
eas build --profile eng                     # english build (any platform; defaults to both)
eas build --profile eng --platform android
eas build --profile tpx --platform ios --local
eas update --branch eng --message "content refresh"   # OTA update to eng channel
eas submit --platform ios --profile eng
```

Build profiles live in `eas.json` at repo root. Each profile sets `APP_LANG` in env.

## Jest

```sh
./nx test <lib>                             # runs Jest for the lib
./nx test <lib> --watch                     # watch mode
./nx test <lib> --coverage
```

Config: each lib has `jest.config.ts` extending the root preset. `jest.preset.js` at repo root is empty until the first lib adds tests; populate it with the shared preset (`jest-expo` for RN libs, `ts-jest` for pure-TS libs).

Test placement: co-located with source (`foo.test.ts` next to `foo.ts`).

## Storybook

```sh
./nx storybook storybook-host               # launches composite Storybook at localhost:4400
./nx build-storybook storybook-host         # static build → dist/storybook/storybook-host/
```

Storybook uses the "One Storybook For All" composite pattern (`libs/shared/storybook-host/`).
All `type:ui` library stories are aggregated via a glob — no per-lib Storybook configs.

**Do NOT run** `./nx storybook ui-*` — those targets do not exist. All stories are visible from the single host.

Stories are discovered automatically: any `.stories.tsx` file under `libs/**/src/` appears in the sidebar after restarting the dev server.

Rendering: React Native primitives render via `react-native-web`. Native-only APIs (`Haptics`, `expo-modules-core` native modules) are stubbed. Use manual device QA for native-only visual differences.

Storybook is only required for `type:ui` libraries per ADR-010. Features + utils do NOT use Storybook.

## TypeScript

```sh
npx tsc --noEmit                            # type-check whole workspace
npx tsc --noEmit --project libs/<lib>       # type-check one lib
npx tsc --noEmit --project apps/alphaTiles  # type-check the app
```

Strict mode is on. `any` banned. Prefer inference — no explicit return types unless required for public API clarity (per `docs/CODE_STYLE.md`).

## Bun (tools/)

```sh
bun tools/rsync-lang-packs.ts               # manual rsync
bun tools/generate-lang-manifest.ts         # manual manifest regen
bun tools/validate-lang-pack.ts             # validator CLI (placeholder → full)
```

Node `tsx` fallback if Bun unavailable:

```sh
npx tsx tools/rsync-lang-packs.ts
```

## Git

See `docs/COMMIT_CONVENTIONS.md`. Summary:

- Conventional commit: `<type>(<scope>): <subject>` (subject ≤50 chars, body optional)
- Types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `build`, `ci`
- Scope = OpenSpec change name for implementation commits (e.g. `feat(lang-pack-parser): parse aa_gametiles`)

## Quick smoke test a freshly-cloned repo

```sh
git clone <repo> alphaTilesAgain && cd alphaTilesAgain
npm ci
export PUBLIC_LANG_ASSETS=/home/adam/dev/alphaTilesAgain/PublicLanguageAssets
export APP_LANG=eng
./nx prebuild-lang alphaTiles                # rsync + validate + manifest
./nx start alphaTiles                        # Metro boots against engEnglish4
```
