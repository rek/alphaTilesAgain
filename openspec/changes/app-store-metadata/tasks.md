# Tasks

Create store listing content for Yue (Cantonese) and wire EAS Submit.

## 0. Preflight

- [ ] Read `proposal.md` and `design.md`.
- [ ] Confirm `eas.json` exists and has no existing `submit` key.
- [ ] Confirm bundle ID and Apple team ID in `eas.json` are non-placeholder values.
- [ ] Confirm Play Store package name is stable.
- [ ] Confirm `store-metadata/` directory does not already exist at repo root.

## 1. Directory Scaffold

- [ ] Create `store-metadata/yue/ios/zh-Hant/`.
- [ ] Create `store-metadata/yue/ios/en-US/`.
- [ ] Create `store-metadata/yue/android/zh-Hant/`.
- [ ] Create `store-metadata/yue/android/en-US/`.
- [ ] Create `store-metadata/yue/screenshots/iphone-6.7/` (placeholder README noting required dimensions 1290×2796).
- [ ] Create `store-metadata/yue/screenshots/ipad-12.9/` (placeholder README noting required dimensions 2048×2732).
- [ ] Create `store-metadata/yue/screenshots/android-phone/` (placeholder README noting minimum dimensions 1080×1920).

## 2. Yue Content (zh-Hant)

### iOS zh-Hant

- [ ] `store-metadata/yue/ios/zh-Hant/title.txt` — ≤30 chars Traditional Chinese.
- [ ] `store-metadata/yue/ios/zh-Hant/full-description.txt` — ≤4000 chars Traditional Chinese.
- [ ] `store-metadata/yue/ios/zh-Hant/keywords.txt` — ≤100 chars comma-separated Traditional Chinese keywords.
- [ ] `store-metadata/yue/ios/zh-Hant/release-notes.txt` — ≤4000 chars Traditional Chinese; first release notes.

### Android zh-Hant

- [ ] `store-metadata/yue/android/zh-Hant/title.txt` — ≤30 chars Traditional Chinese.
- [ ] `store-metadata/yue/android/zh-Hant/short-description.txt` — ≤80 chars Traditional Chinese.
- [ ] `store-metadata/yue/android/zh-Hant/full-description.txt` — ≤4000 chars Traditional Chinese.
- [ ] `store-metadata/yue/android/zh-Hant/release-notes.txt` — ≤500 chars Traditional Chinese; first release notes.

## 3. Yue Content (en-US)

### iOS en-US

- [ ] `store-metadata/yue/ios/en-US/title.txt` — ≤30 chars English.
- [ ] `store-metadata/yue/ios/en-US/full-description.txt` — ≤4000 chars English.
- [ ] `store-metadata/yue/ios/en-US/keywords.txt` — ≤100 chars comma-separated English keywords.
- [ ] `store-metadata/yue/ios/en-US/release-notes.txt` — ≤4000 chars English; first release notes.

### Android en-US

- [ ] `store-metadata/yue/android/en-US/title.txt` — ≤30 chars English.
- [ ] `store-metadata/yue/android/en-US/short-description.txt` — ≤80 chars English.
- [ ] `store-metadata/yue/android/en-US/full-description.txt` — ≤4000 chars English.
- [ ] `store-metadata/yue/android/en-US/release-notes.txt` — ≤500 chars English; first release notes.

## 4. Screenshots

- [ ] Boot app on iPhone 15 Pro Max simulator (or device) with Yue pack loaded.
- [ ] Capture screen 1: Home / language select — save to `store-metadata/yue/screenshots/iphone-6.7/01-home.png`.
- [ ] Capture screen 2: Game menu — save to `store-metadata/yue/screenshots/iphone-6.7/02-game-menu.png`.
- [ ] Capture screen 3: Active game (mid-game tiles) — save to `store-metadata/yue/screenshots/iphone-6.7/03-active-game.png`.
- [ ] Capture screen 4: Correct answer celebration — save to `store-metadata/yue/screenshots/iphone-6.7/04-celebration.png`.
- [ ] Capture screen 5: Settings / about — save to `store-metadata/yue/screenshots/iphone-6.7/05-settings.png`.
- [ ] Repeat screens 1–5 on iPad 12.9" simulator → `store-metadata/yue/screenshots/ipad-12.9/0{1-5}-*.png`.
- [ ] Repeat screens 1–5 on Android phone emulator (1080×1920) → `store-metadata/yue/screenshots/android-phone/0{1-5}-*.png`.
- [ ] Verify all PNG files meet dimension requirements (see design D4).

## 5. eas.json Submit Config

- [ ] Open `eas.json`.
- [ ] Add `submit` key per design D5 (yue-production profile, ios + android).
- [ ] Confirm `metadataPath` values point to correct directories.
- [ ] Confirm `serviceAccountKeyPath` references the correct CI env var.

## 6. Verification

- [ ] Character-count all `title.txt` files — must be ≤30 chars.
- [ ] Character-count `short-description.txt` files — must be ≤80 chars.
- [ ] Character-count `keywords.txt` files — must be ≤100 chars.
- [ ] Character-count Android `release-notes.txt` files — must be ≤500 chars.
- [ ] Confirm no `store-metadata/eng/` directory exists.
- [ ] Confirm no `eng` submit profile in `eas.json`.
- [ ] Dry-run: `eas submit --platform ios --profile yue-production --non-interactive --no-wait` (expect auth prompt, not a metadata error).
- [ ] Dry-run: `eas submit --platform android --profile yue-production --non-interactive --no-wait` (same).
