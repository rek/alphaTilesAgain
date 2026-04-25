## Why

Publishing AlphaTiles to App Store and Google Play requires store listing content: title, description, keywords, screenshots, and release notes. Without this content no submission can proceed. First production language is Yue (Cantonese); content must exist in Traditional Chinese (`zh-Hant`) for Yue audiences and in English (`en-US`) as required by both stores.

## What Changes

- Add `store-metadata/yue/` tree with per-platform, per-locale text files.
- Add `store-metadata/yue/screenshots/` spec defining required screens, order, and dimensions.
- Add EAS Submit config section in `eas.json` for Yue (iOS + Android).
- Document screenshot capture procedure (manual / Maestro + simulator).

## Capabilities

### New Capabilities

- `app-store-metadata` — structured store listing content for Yue; EAS Submit wired to that content; screenshot dimension spec and capture guide.

## Impact

- New `store-metadata/` directory tree (no runtime code changes).
- `eas.json` gains a `submit` section referencing `store-metadata/yue/`.
- No library additions, no dependency changes, no game logic changes.

## Out of Scope

- Automated screenshot generation (storybook-visual-regression territory).
- Publishing or managing the `eng` language pack — dev fixture only, no submit profile.
- ASO / keyword optimization beyond an initial best-effort keyword list.
- Locales beyond `zh-Hant` and `en-US` for v1.
- In-app purchase or subscription metadata.

## Unresolved Questions

- App Store Connect team ID and bundle ID confirmed in `eas.json` already?
- Play Store package name stable (not a placeholder)?
- Who approves Traditional Chinese copy before submission — community reviewer or internal?
- Screenshot device order preference: iPhone 6.7" first or iPad 12.9" first on App Store?
