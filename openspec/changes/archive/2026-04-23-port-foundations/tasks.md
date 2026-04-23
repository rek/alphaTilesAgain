## 0. Preflight

- [ ] 0.1 Read `AGENTS.md` and `openspec/AGENT_PROTOCOL.md`
- [ ] 0.2 Read this change's `proposal.md` and `design.md` in full
- [ ] 0.3 Read required upstream change design docs (see `design.md → ## Context`)
- [ ] 0.4 Read required `docs/ARCHITECTURE.md` sections and referenced ADRs
- [ ] 0.5 Open `../AlphaTiles/app/build.gradle` (the flavor config) and `../AlphaTiles/app/src/main/res/raw/aa_gametiles.txt` (reference layout); keep them in view during implementation
- [ ] 0.6 Open the fixture files named in `design.md → ## Context`; verify pack content matches the assumptions the design makes
- [ ] 0.7 Confirm upstream changes are merged (`openspec status --all`); do not start if an upstream is only in-progress
- [ ] 0.8 Confirm `APP_LANG` and `PUBLIC_LANG_ASSETS` env vars are set for local runs
- [ ] 0.9 Confirm `nx graph` shows the libs this change will touch don't already exist with conflicting tags

## 1. Architecture docs

- [x] 1.1 Write `docs/ARCHITECTURE.md` (stable overview — already drafted alongside this proposal)
- [x] 1.2 Write `docs/decisions/ADR-001-per-language-build-mechanism.md`
- [x] 1.3 Write `docs/decisions/ADR-002-language-pack-sourcing.md`
- [x] 1.4 Write `docs/decisions/ADR-003-asset-bundling-via-generated-manifest.md`
- [x] 1.5 Write `docs/decisions/ADR-004-state-management-hybrid.md`
- [x] 1.6 Write `docs/decisions/ADR-005-persistence-zustand-persist-asyncstorage.md`
- [x] 1.7 Write `docs/decisions/ADR-006-i18n-unified-i18next.md`
- [x] 1.8 Write `docs/decisions/ADR-007-audio-expo-audio.md`
- [x] 1.9 Write `docs/decisions/ADR-008-full-validator-port.md`
- [x] 1.10 Write `docs/decisions/ADR-009-ota-via-eas-update.md`
- [x] 1.11 Write `docs/decisions/ADR-010-testing-storybook-plus-unit.md`
- [x] 1.12 Update `CLAUDE.md` to reference `docs/ARCHITECTURE.md` and `docs/decisions/`
- [x] 1.13 Update `docs/GETTING_STARTED.md` with `PUBLIC_LANG_ASSETS` env var setup

## 2. `tools/` — prebuild scripts

- [x] 2.1 Create `tools/_lang-pack-mini-parser.ts` — minimal reader for `aa_langinfo.txt`, `aa_gametiles.txt`, `aa_wordlist.txt`, `aa_syllables.txt` (just enough for the rsync + manifest steps; full parser lives in `lang-pack-parser`)
- [x] 2.2 Create `tools/rsync-lang-packs.ts`:
  - [x] 2.2.1 Read `APP_LANG` and `PUBLIC_LANG_ASSETS` from env, fail loud if absent
  - [x] 2.2.2 Resolve pack name via code→dirname mapping table (`eng`→`engEnglish4`, `tpx`→`tpxTeocuitlapa`, `template`→`templateTemplate`, `yue`→`yueCantonese`)
  - [x] 2.2.3 Clear `languages/<code>/` on each run (idempotent)
  - [x] 2.2.4 Copy `aa_*.txt` files, normalize CRLF→LF, skip `aa_notes.txt` (validator-only)
  - [x] 2.2.5 Copy `res/font/*.ttf` → `fonts/`
  - [x] 2.2.6 Copy `res/drawable-xxxhdpi/zz_avatar*.png` → `images/avatars/`
  - [x] 2.2.7 Copy `res/drawable-xxxhdpi/zz_avataricon*.png` → `images/avataricons/`
  - [x] 2.2.8 Parse `aa_gametiles.txt` + `aa_wordlist.txt` + `aa_syllables.txt` for audio keys; classify each `res/raw/*.mp3` into `audio/tiles/`, `audio/words/`, `audio/syllables/`, or `audio/instructions/` (instruction audio = `zzz_*.mp3` prefix)
  - [x] 2.2.9 Classify tile/word images under `res/drawable/*.png`: word images match `aa_wordlist.txt` keys, tile images match `aa_gametiles.txt` keys, everything else goes to an `images/other/` bucket
  - [x] 2.2.10 Copy `icon.png` / `splash.png` from pack root if present
  - [x] 2.2.11 Unit tests for the classification logic (tile vs word vs syllable vs instruction audio; density-variant dedup; CRLF→LF)
- [x] 2.3 Create `tools/validate-lang-pack.ts` — placeholder that checks file presence only:
  - [x] 2.3.1 Verify `languages/<APP_LANG>/` exists
  - [x] 2.3.2 Verify each required `aa_*.txt` file exists (`aa_notes.txt` optional)
  - [x] 2.3.3 Verify `fonts/` has at least one TTF
  - [x] 2.3.4 Verify `images/avatars/` has exactly 12 files, `images/avataricons/` has exactly 12 files
  - [x] 2.3.5 Exit non-zero with line-item error report on any miss
  - [x] 2.3.6 Unit test the placeholder against `languages/template/` (should pass) and a broken fixture (should fail)
  - [x] 2.3.7 Add a comment pointing at `lang-pack-validator` change — this is a placeholder until the full validator lands
- [x] 2.4 Create `tools/generate-lang-manifest.ts`:
  - [x] 2.4.1 Read `APP_LANG`, scan `languages/<APP_LANG>/`
  - [x] 2.4.2 Inline each `aa_*.txt` as a string literal under `rawFiles`
  - [x] 2.4.3 Emit `require()` literals for fonts, images, audio
  - [x] 2.4.4 Build `tiles`, `words`, `syllables`, `instructions` maps using keys from the corresponding index `aa_*.txt` files
  - [x] 2.4.5 Output `apps/alphaTiles/src/generated/langManifest.ts` with `const` assertion + exported `LangManifest = typeof langManifest`
  - [x] 2.4.6 Add `apps/alphaTiles/src/generated/` to `.gitignore`
  - [x] 2.4.7 Unit test against `languages/eng/` (check output shape + a few spot-check keys)
- [x] 2.5 Add `bun` run scripts + node-fallback scripts to `tools/package.json` (bun preferred, node `tsx` fallback documented)

## 3. NX wiring

- [x] 3.1 Add `rsync-lang-pack`, `validate-lang-pack`, `generate-lang-manifest`, `prebuild-lang` targets to `apps/alphaTiles/project.json` with `dependsOn` chain
- [x] 3.2 Add `dependsOn: ["prebuild-lang"]` to the existing `start`, `run-android`, `run-ios`, `web-export` targets
- [x] 3.3 Verify `nx graph` shows the prebuild chain
- [x] 3.4 Verify `APP_LANG=eng nx start alphaTiles` runs the full chain end-to-end

## 4. `app.config.ts`

- [x] 4.1 Delete `apps/alphaTiles/app.json`
- [x] 4.2 Create `apps/alphaTiles/app.config.ts`:
  - [x] 4.2.1 Read `APP_LANG` from env, fail if absent
  - [x] 4.2.2 Read `languages/<APP_LANG>/aa_langinfo.txt` via `tools/_lang-pack-mini-parser.ts`
  - [x] 4.2.3 Resolve `name`, `slug`, `ios.bundleIdentifier`, `android.package`, `extra.appLang`, `extra.scriptDirection`, `extra.scriptType`
  - [x] 4.2.4 Resolve icon / splash: per-pack override if `languages/<APP_LANG>/images/icon.png` exists, else shared default
  - [x] 4.2.5 Preserve existing `plugins`, `experiments`, `web.output`
- [x] 4.3 Update `apps/alphaTiles/src/_layout.tsx` (or equivalent entry) to read `Constants.expoConfig.extra.scriptDirection` and call `I18nManager.forceRTL(true)` when `"RTL"`

## 5. EAS

- [x] 5.1 Create `eas.json` at repo root with `development`, `preview`, `production`, `eng`, `tpx`, `yue` profiles (each setting `APP_LANG`)
- [ ] 5.2 Smoke-test `eas build --profile eng --platform android --local` (or `--dry-run` equivalent) to verify env is plumbed end-to-end

## 6. `libs/shared/util-precompute`

- [x] 6.1 Scaffold the library via `nx g @nx/js:lib util-precompute --directory=libs/shared/util-precompute --tags='type:util,scope:shared'`
- [x] 6.2 Implement `registerPrecompute<T>(key, fn)`, `runPrecomputes(assets)`, `usePrecompute<T>(key)`, and an internal Context provider `PrecomputeProvider`
- [x] 6.3 Use `LangAssets = unknown` forward reference (replaced by the real type when `lang-assets-runtime` lands)
- [x] 6.4 Unit tests for register / run / hook / duplicate-key / missing-key / throwing-fn paths
- [x] 6.5 Storybook not required — no UI surface in this library

## 7. `.gitignore` and hygiene

- [x] 7.1 Add `languages/` to root `.gitignore`
- [x] 7.2 Add `apps/alphaTiles/src/generated/` to `.gitignore`
- [x] 7.3 Confirm `openspec validate port-foundations` passes
- [x] 7.4 Confirm `npx tsc --noEmit` passes across the workspace

## 8. Verification

- [x] 8.1 Fresh clone + `bun install` + `PUBLIC_LANG_ASSETS=… APP_LANG=eng nx start alphaTiles` boots with no errors against the `engEnglish4` pack
- [x] 8.2 Switching `APP_LANG=tpx` and restarting Metro boots against the `tpxTeocuitlapa` pack
- [ ] 8.3 `APP_LANG=eng nx web-export alphaTiles` produces a valid web bundle
- [x] 8.4 The resulting `apps/alphaTiles/src/generated/langManifest.ts` is typed correctly — `LangManifest` has the expected shape, `langManifest.audio.words['act']` resolves to a `require()` number
