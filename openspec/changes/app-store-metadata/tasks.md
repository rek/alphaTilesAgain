# Tasks

Create store listing content for Yue (Cantonese) and wire EAS Submit.

Scope of this pass: yue, Google Play (Android) only. iOS deferred until the iOS build ships (no Apple team / App Store Connect app yet). See design.md § Implementation notes for deviations from D1/D5.

## 0. Preflight

- [x] Read `proposal.md` and `design.md`.
- [x] Confirm `eas.json` exists and has no existing `submit` key. — `apps/alphaTiles/eas.json` (not repo root); a `submit` section already exists (`production`, `yue`, `eng`: internal track, draft) and CI uses `submit.yue`.
- [ ] Confirm bundle ID and Apple team ID in `eas.json` are non-placeholder values. — deferred: iOS. Bundle ID `com.makektm.alphatiles` (from `app.config.ts`); no Apple team ID anywhere yet.
- [x] Confirm Play Store package name is stable. — `com.makektm.alphatiles` (`APP_ID_BASE` in `app.config.ts`, `languages/yue/aa_share.txt`).
- [x] Confirm `store-metadata/` directory does not already exist at repo root.

## 1. Directory Scaffold

- [ ] Create `store-metadata/yue/ios/zh-Hant/`. — deferred: iOS.
- [ ] Create `store-metadata/yue/ios/en-US/`. — deferred: iOS.
- [x] Create `store-metadata/yue/android/zh-Hant/`. (maps to Play locale zh-HK)
- [x] Create `store-metadata/yue/android/en-US/`.
- [ ] Create `store-metadata/yue/screenshots/iphone-6.7/` (placeholder README noting required dimensions 1290×2796). — deferred: iOS (dimensions recorded in `screenshots/README.md`).
- [ ] Create `store-metadata/yue/screenshots/ipad-12.9/` (placeholder README noting required dimensions 2048×2732). — deferred: iOS (dimensions recorded in `screenshots/README.md`).
- [x] Create `store-metadata/yue/screenshots/android-phone/` (placeholder README noting minimum dimensions 1080×1920).
- [x] (added) `store-metadata/README.md`, `yue/android/data-safety.md`, `yue/android/content-rating.md`, `yue/android/play-console.md`, `yue/graphics/README.md`, `yue/screenshots/README.md`.

## 2. Yue Content (zh-Hant)

### iOS zh-Hant

- [ ] `store-metadata/yue/ios/zh-Hant/title.txt` — deferred: iOS.
- [ ] `store-metadata/yue/ios/zh-Hant/full-description.txt` — deferred: iOS (reuse Android text).
- [ ] `store-metadata/yue/ios/zh-Hant/keywords.txt` — deferred: iOS.
- [ ] `store-metadata/yue/ios/zh-Hant/release-notes.txt` — deferred: iOS.

### Android zh-Hant

- [x] `store-metadata/yue/android/zh-Hant/title.txt` — ≤30 chars Traditional Chinese. (13) — pending: owner confirm app name 學廣話 (no issue); customer review (#55)
- [x] `store-metadata/yue/android/zh-Hant/short-description.txt` — ≤80 chars Traditional Chinese. (29) — pending: customer review (#55)
- [x] `store-metadata/yue/android/zh-Hant/full-description.txt` — ≤4000 chars Traditional Chinese. (492) — pending: customer review (#55)
- [x] `store-metadata/yue/android/zh-Hant/release-notes.txt` — ≤500 chars Traditional Chinese; first release notes. (114) — pending: customer review (#55)

## 3. Yue Content (en-US)

### iOS en-US

- [ ] `store-metadata/yue/ios/en-US/title.txt` — deferred: iOS.
- [ ] `store-metadata/yue/ios/en-US/full-description.txt` — deferred: iOS.
- [ ] `store-metadata/yue/ios/en-US/keywords.txt` — deferred: iOS.
- [ ] `store-metadata/yue/ios/en-US/release-notes.txt` — deferred: iOS.

### Android en-US

- [x] `store-metadata/yue/android/en-US/title.txt` — ≤30 chars English. (24) — pending: owner confirm app name 學廣話 (no issue)
- [x] `store-metadata/yue/android/en-US/short-description.txt` — ≤80 chars English. (76)
- [x] `store-metadata/yue/android/en-US/full-description.txt` — ≤4000 chars English. (1281)
- [x] `store-metadata/yue/android/en-US/release-notes.txt` — ≤500 chars English; first release notes. (347)

## 4. Screenshots

- [ ] Boot app on iPhone 15 Pro Max simulator (or device) with Yue pack loaded. — deferred: iOS.
- [ ] Capture screen 1–5 on iPhone 6.7" → `screenshots/iphone-6.7/`. — deferred: iOS.
- [ ] Repeat screens 1–5 on iPad 12.9" simulator → `store-metadata/yue/screenshots/ipad-12.9/0{1-5}-*.png`. — deferred: iOS.
- [x] Shot list for the real yue screens (choose player, menu, tile game, writing game, celebration) + capture steps in `screenshots/README.md`.
- [ ] Repeat screens 1–5 on Android phone emulator (1080×1920) → `store-metadata/yue/screenshots/android-phone/0{1-5}-*.png`. — pending: owner (device capture, #57)
- [ ] Verify all PNG files meet dimension requirements (see design D4). — pending: owner (after capture, #57)
- [x] (added) Feature graphic + 512² icon spec in `graphics/README.md`. Artwork — pending: owner/customer (#53)

## 5. eas.json Submit Config

- [x] Open `eas.json`. — `apps/alphaTiles/eas.json`.
- [ ] Add `submit` key per design D5 (yue-production profile, ios + android). — deferred: not applicable as designed. `submit.yue` already exists and CI (`.github/workflows/eas-build.yml`) uses it; EAS Submit Android has no `metadataPath` option (iOS-only, points to an EAS Metadata `store.config.json`), so the Android listing is entered by hand. iOS part waits for iOS. Editing `eas.json` also changes the OTA fingerprint, so no edit without a reason.
- [x] Confirm `metadataPath` values point to correct directories. — n/a for Android (see above); documented in `store-metadata/README.md`.
- [ ] Confirm `serviceAccountKeyPath` references the correct CI env var. — not used: the service account key is stored in EAS credentials (`docs/GETTING_STARTED.md` → Store submission). Owner one-time setup — pending: owner.

## 6. Verification

- [x] Character-count all `title.txt` files — must be ≤30 chars.
- [x] Character-count `short-description.txt` files — must be ≤80 chars.
- [ ] Character-count `keywords.txt` files — must be ≤100 chars. — deferred: iOS (no keywords files).
- [x] Character-count Android `release-notes.txt` files — must be ≤500 chars.
- [x] Confirm no `store-metadata/eng/` directory exists.
- [x] Confirm no `eng` submit profile in `eas.json`. — **fails as written**: `submit.eng` exists (internal/draft) for the separate `com.makektm.alphatiles.eng` Play app. No listing, no store-metadata, and GETTING_STARTED says not to submit it until that app is set up. Removing it is an owner call — pending: owner.
- [ ] Dry-run: `eas submit --platform ios --profile yue-production --non-interactive --no-wait`. — deferred: iOS.
- [ ] Dry-run: `eas submit --platform android --profile yue --non-interactive --no-wait`. — pending: owner (needs `eas login` + Play service account; first AAB must be uploaded by hand).

## 7. Other Play Console inputs (added)

- [x] Data safety answers from code audit → `yue/android/data-safety.md`. Option A/B choice — pending: owner
- [x] Content rating (IARC) answers → `yue/android/content-rating.md`. IARC email — pending: owner (#39)
- [x] Store settings / app content / Families checklist → `yue/android/play-console.md`.
- [ ] Privacy policy URL. — pending: owner (#54)
- [ ] Contact email for listing. — pending: owner (#39)
- [ ] Target audience age groups and countries. — pending: owner
- [x] Cross-link from `docs/GETTING_STARTED.md` Store submission and `docs/RELEASE_NOTES.md`.
