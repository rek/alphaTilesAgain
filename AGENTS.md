# AGENTS.md

Entry doc for any AI agent (or human) starting work in this repo. If you're an agent: read this file, then `CLAUDE.md`, then `docs/ARCHITECTURE.md` before touching code.

## What this repo is

AlphaTiles — literacy-game generator for minority-language communities. NX monorepo: Expo + React Native + TypeScript. One build per language pack (per-language APKs/IPAs/web bundles); no backend; no runtime language switching.

This is a **port in progress** from a Java/Android codebase (`../AlphaTiles/`) driven by content packs in `../PublicLanguageAssets/`. The port is organized as 15 OpenSpec changes; see `openspec/AGENT_PROTOCOL.md` for the spec-driven workflow.

## Required reading, in order

Every agent starting a task MUST read these before writing any code:

1. **`CLAUDE.md`** — terse rules for this repo (design-before-code, library patterns, one-function-per-file, no direct `useEffect`, container/presenter split, i18n rules).
2. **`docs/ARCHITECTURE.md`** — stable architecture map. Covers monorepo layout, library taxonomy, per-language build pipeline, runtime data flow, state management, audio, i18n, RTL, testing, game taxonomy. Everything is a consequence of this doc.
3. **`docs/CODE_STYLE.md`** — TypeScript and React Native conventions (always follow).
4. **`docs/PROJECT_ORGANIZATION.md`** — NX library types, dependency rules, tagging. Violating these breaks `nx graph`.
5. **`docs/decisions/ADR-*.md`** — ten foundational decisions. Skim titles; read in full any ADR relevant to your task.
6. **`openspec/AGENT_PROTOCOL.md`** — how to pick up, implement, validate, and archive an OpenSpec change.
7. **`docs/TOOLING.md`** — invocation sheet for `openspec`, `nx`, `eas`, `jest`, `storybook`.

For a **specific OpenSpec change**, read (in order) inside `openspec/changes/<name>/`:

1. `proposal.md` — what + why
2. `design.md` — how, including the **Context section** which names upstream deps, source Java files, and fixture paths
3. `specs/<capability>/spec.md` — WHAT the system must do (requirements + scenarios; each scenario is a test case)
4. `tasks.md` — ordered implementation checklist. Start with group `0. Preflight`.

## External repositories referenced

The port pulls from two **sibling local repos**. Paths assume this repo is at `/home/adam/dev/alphaTilesAgain/alphaTilesAgain/`.

- **`../AlphaTiles/`** — the original Java/Android app being ported.
  - `app/src/main/java/org/alphatilesapps/alphatiles/` — 32 Java source files. Start here: `Start.java` (asset loading + global state), `GameActivity.java` (abstract game base), `LoadingScreen.java`, `Earth.java` (menu), and 17 concrete game classes named after countries.
  - `app/src/main/res/layout/*.xml` — Android view layouts; reference only, not ported 1:1.
  - `validator/src/main/java/org/alphatilesapps/validator/` — ~3800-LOC Kotlin validator being ported to TS as part of `lang-pack-validator`.
- **`../PublicLanguageAssets/`** (expected at `/home/adam/dev/alphaTilesAgain/PublicLanguageAssets/`) — content packs owned by the content team, independent release cycle.
  - `engEnglish4/` — primary dev fixture (English content, Roman script)
  - `tpxTeocuitlapa/` — faithfulness fixture (Mè'phàà content, Roman+diacritics)
  - `templateTemplate/` — empty validator fixture
  - Each pack has `res/raw/aa_*.txt`, `res/font/*.ttf`, `res/drawable*/`, audio mp3s.
  - `$PUBLIC_LANG_ASSETS` env var must point here; `tools/rsync-lang-packs.ts` reads from it.

At runtime, packs land under `languages/<code>/` (gitignored — never commit a pack).

## The OpenSpec change in flight

Run `openspec status --all` to see current status. Current port phase: **15 changes plotted, implementation not yet started.** Dependency chart (also in `openspec/AGENT_PROTOCOL.md`):

```
port-foundations                   (batch 1, no deps)
lang-pack-parser                   (batch 1, no deps)
analytics-abstraction              (batch 1, no deps)
lang-pack-validator                (needs parser)
lang-assets-runtime                (needs parser + port-foundations util-precompute)
audio-system                       (needs lang-assets-runtime)
theme-fonts                        (needs lang-assets-runtime)
i18n-foundation                    (needs lang-assets-runtime)
player-profiles                    (needs i18n + theme + lang-assets)
about-share-resources-screens      (needs i18n + theme + lang-assets)
game-engine-base                   (needs audio + theme + i18n + analytics + lang-assets + util-precompute)
loading-screen                     (needs audio + theme + i18n + lang-assets + player-profiles + util-precompute)
game-menu                          (needs lang-assets; optional forward dep on game-engine-base's progress store)
game-china                         (needs game-engine-base)
ota-updates                        (needs analytics)
```

Pick a ready change (all deps merged); never work on two changes in parallel unless they're independent batch peers.

## Definition of Done — per change

Every change ships in this state:

- [ ] All `- [ ]` in `tasks.md` flipped to `- [x]`.
- [ ] `openspec validate <change-name>` exits 0.
- [ ] `npx tsc --noEmit` clean across the workspace.
- [ ] `nx affected:lint` clean.
- [ ] `nx affected:test` passes (unit tests for pure-logic libs per ADR-010; features + ui have no mandatory tests in v1 — `type:ui` libs get Storybook stories instead).
- [ ] For `type:ui` changes: story added/updated + visually verified in `./nx storybook storybook-host`. Native-only visual regressions NOT caught by Storybook — manual device QA per change.
- [ ] For UI changes: manual smoke test on iOS, Android, and web (or explicitly-noted exclusions).
- [ ] For libraries: exports surface through `src/index.ts` only; no barrel files below that.
- [ ] Commits follow `docs/COMMIT_CONVENTIONS.md` (`<type>(<scope>): <subject>`).
- [ ] i18n: no hardcoded English strings in JSX. No hardcoded English a11y labels.
- [ ] No direct `useEffect` — use `useMountEffect`, derived state, handlers, or `key`.
- [ ] After merge: `/opsx:archive` the change, then update `openspec/AGENT_PROTOCOL.md` dependency chart if status shifted.

## Known gotchas

- **NX path aliases aren't auto-wired.** After `nx g @nx/js:lib …`, confirm `tsconfig.base.json` has the new `@alphaTiles/<lib>` or `@shared/<lib>` path alias. The generator occasionally writes a subpath like `libs/shared/util-foo/src/index.ts` but the alias is missing; add it manually.
- **`jest.preset.js` at root is empty** (91 bytes) — populate it when the first lib adds tests. Use `jest-expo` preset for RN libs; `ts-jest` for pure-TS libs.
- **Metro requires static `require()` literals.** Dynamic `require(path)` fails silently at bundle time. All asset loading goes through the generated `apps/alphaTiles/src/generated/langManifest.ts`. Never `require()` inside runtime code paths.
- **Expo `app.config.ts` throws at prebuild if `APP_LANG` is unset.** Always set `APP_LANG` before `nx start` / `nx run-android` / `nx web-export`.
- **`PUBLIC_LANG_ASSETS` env var must be set** for `tools/rsync-lang-packs.ts`. Default suggestion in `docs/GETTING_STARTED.md`: `export PUBLIC_LANG_ASSETS=/home/adam/dev/alphaTilesAgain/PublicLanguageAssets`.
- **`languages/` is gitignored.** Do not commit any pack content. The rsync script regenerates it; `git clean -fdx languages/` is safe.
- **`apps/alphaTiles/src/generated/` is gitignored.** `langManifest.ts` regenerates each prebuild; do not hand-edit.
- **`ui` libraries MUST NOT import `react-i18next`.** Container owns `t()`; presenter receives strings as props. ESLint enforces via `no-restricted-imports` (add the rule if it's not yet in `eslint.config.js`).
- **`util` libraries import nothing runtime except `react` (when a hook is exported).** Pure logic libs (parser, validator, scoring) import only type-level from React or nothing at all.
- **Container/presenter split is mandatory for every feature screen.** `<Feature>Container` owns hooks + i18n + navigation; `<Feature>Screen` is pure props → JSX.
- **Script direction is build-time.** `I18nManager.forceRTL` is called in the entry based on `Constants.expoConfig.extra.scriptDirection`. Hot-toggling at runtime is not supported and not needed (per-build = one lang).
- **Do not add deps casually.** Each new dependency needs a line in the change's design.md + a bump entry in `apps/alphaTiles/package.json` or the relevant lib.
- **Storybook runs from the composite host — NOT per-lib.** Run `./nx storybook storybook-host`. Do NOT add `.storybook/` dirs or `storybook` NX targets to individual `ui-*` libs. See `docs/TOOLING.md § Storybook`.
- **Storybook web does NOT catch native-only regressions.** `react-native-web` renders RN primitives in browser but native-only APIs (`Haptics`, `DeviceEventEmitter`, Android ripple, iOS haptic feedback) are absent. Manual device QA per change fills this gap.
- **Expo-module imports in stories:** `expo-*` packages that use `expo-modules-core` (e.g. `expo-haptics`, `expo-audio`) are stubbed out in `libs/shared/storybook-host/.storybook/mocks/`. If a new `ui-*` lib imports an `expo-*` module not yet stubbed, add a stub there — do NOT import expo native modules in story files directly.

## Commit / PR etiquette

- Branch per change: `change/<change-name>`.
- Commits follow `docs/COMMIT_CONVENTIONS.md` — conventional-commit subject, concise per CLAUDE.md rules, `type(scope): subject`.
- PR title mirrors the change name.
- PR description points at `openspec/changes/<name>/proposal.md`.
- Do NOT check off tasks in `tasks.md` speculatively — flip `- [ ]` to `- [x]` only after the task is verified.

## When you get stuck

1. Re-read `docs/ARCHITECTURE.md` for the relevant section.
2. Check `docs/decisions/ADR-*.md` — a past decision may answer the question.
3. Grep the source: `../AlphaTiles/app/src/main/java/org/alphatilesapps/alphatiles/` often has the answer (search for the variable or method name).
4. If still unresolved, add an entry under `## Open Questions` at the bottom of the change's `design.md` and surface it to the user — don't guess your way through architectural ambiguity.
