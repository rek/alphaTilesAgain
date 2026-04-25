# Tasks

Implement boot-time lang-pack CDN downloader.

## 0. Preflight

- [ ] Read `proposal.md` and `design.md`.
- [ ] Confirm `expo-file-system` and `expo-constants` are in `apps/alphaTiles/package.json`; add if missing.
- [ ] Read `libs/shared/util-langassets/` to understand current asset resolution and where `getActiveLangPackPath` must plug in.
- [ ] Read `libs/alphaTiles/util-ota/` to confirm no overlap with this lib.

## 1. Library Setup

- [ ] Generate library: `./nx g @nx/js:lib util-lang-pack-downloader --directory=libs/alphaTiles/util-lang-pack-downloader --tags='type:util,scope:alphaTiles'`.
- [ ] Add path alias to `tsconfig.base.json`: `"@alphaTiles/util-lang-pack-downloader": ["libs/alphaTiles/util-lang-pack-downloader/src/index.ts"]`.
- [ ] Add `expo-file-system` and `expo-constants` to the lib's `package.json` peerDependencies if not already present app-wide.

## 2. Version Check

- [ ] Implement `libs/alphaTiles/util-lang-pack-downloader/src/lib/checkForLangPackUpdate.ts`.
  - [ ] Return `null` immediately if `LANG_PACK_BASE_URL` or `APP_LANG` env var is absent.
  - [ ] Fetch `<BASE_URL>/<langCode>/latest.json`; catch all network/parse errors → return `null`.
  - [ ] Read local version from `current.txt` (default `"0.0.0"` if absent).
  - [ ] Compare using internal semver util; return remote version string if newer, else `null`.
  - [ ] Check `minAppVersion` against `Constants.expoConfig.version`; if app too old return `null`.
- [ ] Implement `libs/alphaTiles/util-lang-pack-downloader/src/lib/semverGt.ts` — three-part numeric compare, no external package.
- [ ] Unit test `checkForLangPackUpdate`: no env vars → `null`; remote not newer → `null`; remote newer and app compat → version string; minAppVersion too high → `null`; fetch throws → `null`.

## 3. Download + Unzip

- [ ] Implement `libs/alphaTiles/util-lang-pack-downloader/src/lib/downloadLangPack.ts`.
  - [ ] Download ZIP via `FileSystem.downloadAsync` to a temp path.
  - [ ] Unzip to `${FileSystem.documentDirectory}downloaded/<langCode>/<version>/` using `FileSystem.unzipAsync` (or equivalent).
  - [ ] On success, write version string to `downloaded/<langCode>/current.txt`.
  - [ ] On any error: delete partial staged dir, log warning, swallow error.
- [ ] Unit test `downloadLangPack`: successful path writes `current.txt`; download error leaves no staged dir; unzip error cleans up.

## 4. Loader Integration

- [ ] Implement `libs/alphaTiles/util-lang-pack-downloader/src/lib/getActiveLangPackPath.ts`.
  - [ ] Return `null` if `APP_LANG` absent.
  - [ ] Read `downloaded/<langCode>/current.txt`; if exists and directory present, return full path.
  - [ ] Return `null` if no downloaded pack (caller falls back to bundled assets).
- [ ] Integrate into `libs/shared/util-langassets/` asset resolution: check `getActiveLangPackPath()` first; use bundled path if `null`.
- [ ] Unit test `getActiveLangPackPath`: no `current.txt` → `null`; valid `current.txt` → resolved path.

## 5. Boot Wiring

- [ ] In the app boot sequence (app shell or `_layout.tsx`), call `checkForLangPackUpdate()` then `downloadLangPack(version)` if a version is returned.
- [ ] Ensure boot wiring does not block the UI — run as a background async call after the first render.
- [ ] Confirm `util-ota` boot call is unaffected (separate call site).

## 6. Verification

- [ ] Type-check: `npx tsc --noEmit -p libs/alphaTiles/util-lang-pack-downloader/tsconfig.lib.json`.
- [ ] Lint: `nx lint alphaTiles-util-lang-pack-downloader`.
- [ ] Unit tests pass: `nx test alphaTiles-util-lang-pack-downloader`.
- [ ] Manual smoke (device): mock CDN returns newer version → ZIP downloaded, next boot uses downloaded pack.
- [ ] Manual smoke: CDN unreachable → app boots normally with bundled pack, no crash.
- [ ] Manual smoke: `LANG_PACK_BASE_URL` absent in build → no network call on boot.
- [ ] Manual smoke: `minAppVersion` greater than current app version → no download.
