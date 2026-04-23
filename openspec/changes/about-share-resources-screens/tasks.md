## 0. Preflight

- [ ] 0.1 Read `AGENTS.md` and `openspec/AGENT_PROTOCOL.md`
- [ ] 0.2 Read this change's `proposal.md` and `design.md` in full
- [ ] 0.3 Read required upstream change design docs (see `design.md → ## Context`)
- [ ] 0.4 Read required `docs/ARCHITECTURE.md` sections and referenced ADRs
- [ ] 0.5 Open the source Java files named in `design.md → ## Context`; keep them in view during implementation
- [ ] 0.6 Open the fixture files named in `design.md → ## Context`; verify pack content matches the assumptions the design makes
- [ ] 0.7 Confirm upstream changes are merged (`openspec status --all`); do not start if an upstream is only in-progress
- [ ] 0.8 Confirm `APP_LANG` and `PUBLIC_LANG_ASSETS` env vars are set for local runs
- [ ] 0.9 Confirm `nx graph` shows the libs this change will touch don't already exist with conflicting tags

## 1. Dependencies

- [ ] 1.1 Add `react-native-qrcode-svg` to `apps/alphaTiles/package.json` (or root, per NX conventions)
- [ ] 1.2 Add `react-native-svg` (peer of the QR lib) if not already present
- [ ] 1.3 Add `expo-web-browser` if not already present
- [ ] 1.4 Add `expo-application` if not already present (used by About for version)
- [ ] 1.5 Verify `bun install` completes cleanly and Metro boots

## 2. i18n keys

- [ ] 2.1 Add the 12 new `chrome:*` keys documented in `design.md` §D12 to `util-i18n`'s English locale file
- [ ] 2.2 Mark non-English locale files with `TODO` entries — translations land separately
- [ ] 2.3 Unit test that every key resolves to a non-empty string in the English locale

## 3. `feature-about` library

- [ ] 3.1 Scaffold `libs/alphaTiles/feature-about` via `nx g @nx/expo:library feature-about --directory=libs/alphaTiles/feature-about --tags='type:feature,scope:alphaTiles'`
- [ ] 3.2 Implement `AboutContainer.tsx`:
  - [ ] 3.2.1 Read assets via `useLangAssets()` — extract `langInfo` fields 1, 2, 5, 9, 12, 13, 14
  - [ ] 3.2.2 Read app version via `Application.nativeApplicationVersion`
  - [ ] 3.2.3 Read `chrome:about.*` keys via `useTranslation`
  - [ ] 3.2.4 Compute `showEmail`, `showPrivacy`, `showSecondaryCredits` flags (hide if absent / `"none"` / empty)
  - [ ] 3.2.5 Compute `sameNames` flag (local name == English name) to pick `names_plus_countryA` vs `B` equivalent
  - [ ] 3.2.6 Wire `onPrivacyTap` → `WebBrowser.openBrowserAsync(privacyUrl)`
  - [ ] 3.2.7 Wire `onEmailTap` → `Linking.openURL('mailto:' + email)`
  - [ ] 3.2.8 Fire `track('screen_viewed', { screen: 'about' })` via `useMountEffect`
  - [ ] 3.2.9 Pass all strings + handlers to `AboutScreen`
- [ ] 3.3 Implement `AboutScreen.tsx` — pure props→JSX presenter; no hooks, no i18n, no asset imports
  - [ ] 3.3.1 Render version line, pack-name-plus-country line, credits block(s), email link, privacy link
  - [ ] 3.3.2 Every link has `accessibilityRole="link"`, `accessibilityLabel`, and `hitSlop` of 10
- [ ] 3.4 Export `AboutContainer` + `AboutScreen` from `libs/alphaTiles/feature-about/src/index.ts`
- [ ] 3.5 Unit tests:
  - [ ] 3.5.1 Full pack → all surfaces render
  - [ ] 3.5.2 Missing email → email surface hidden
  - [ ] 3.5.3 Privacy URL is `"none"` → privacy surface hidden
  - [ ] 3.5.4 Same-name pack → single-name layout
  - [ ] 3.5.5 `screen_viewed` fires exactly once on mount

## 4. `feature-share` library

- [ ] 4.1 Scaffold `libs/alphaTiles/feature-share` via `nx g @nx/expo:library feature-share --directory=libs/alphaTiles/feature-share --tags='type:feature,scope:alphaTiles'`
- [ ] 4.2 Implement `ShareContainer.tsx`:
  - [ ] 4.2.1 Read `assets.share.url` via `useLangAssets()`
  - [ ] 4.2.2 If url is falsy, set `available = false`; else `available = true`
  - [ ] 4.2.3 Wire `onShareTap` → `Share.share({ message: url, url })` (from `react-native`)
  - [ ] 4.2.4 Read `chrome:share.*` keys
  - [ ] 4.2.5 Fire `track('screen_viewed', { screen: 'share' })` on mount
  - [ ] 4.2.6 Pass `url`, `available`, `onShareTap`, i18n strings to `ShareScreen`
- [ ] 4.3 Implement `ShareScreen.tsx` — pure presenter
  - [ ] 4.3.1 When `available`, render `<QRCode value={url} size={...} />` + share button + instruction text
  - [ ] 4.3.2 When not `available`, render `chrome:share.unavailable` message and hide QR + button
  - [ ] 4.3.3 QR wrapper: `accessibilityRole="image"`, `accessibilityLabel` from `chrome:share.qrAlt`
  - [ ] 4.3.4 Share button: `accessibilityRole="button"`, `accessibilityLabel` from `chrome:share.button`
- [ ] 4.4 Export from `index.ts`
- [ ] 4.5 Unit tests:
  - [ ] 4.5.1 Valid URL → QR renders with `value={url}`
  - [ ] 4.5.2 `url === null` → fallback message rendered, QR not in tree
  - [ ] 4.5.3 Share button tap invokes `Share.share` with `{ message: url, url }`
  - [ ] 4.5.4 `screen_viewed` fires exactly once on mount

## 5. `feature-resources` library

- [ ] 5.1 Scaffold `libs/alphaTiles/feature-resources` via `nx g @nx/expo:library feature-resources --directory=libs/alphaTiles/feature-resources --tags='type:feature,scope:alphaTiles'`
- [ ] 5.2 Implement `ResourcesContainer.tsx`:
  - [ ] 5.2.1 Read `assets.resources` (array of `{ name, url, image }`) via `useLangAssets()`
  - [ ] 5.2.2 Compute `isEmpty = resources.length === 0`
  - [ ] 5.2.3 Wire `onResourceTap(url)` → `WebBrowser.openBrowserAsync(url)`
  - [ ] 5.2.4 Read `chrome:resources.*` keys
  - [ ] 5.2.5 Fire `track('screen_viewed', { screen: 'resources' })` on mount
  - [ ] 5.2.6 Pass `resources`, `isEmpty`, `onResourceTap`, i18n strings to `ResourcesScreen`
- [ ] 5.3 Implement `ResourcesScreen.tsx` — pure presenter
  - [ ] 5.3.1 When `isEmpty`, render `chrome:resources.empty` centered
  - [ ] 5.3.2 Else render `FlatList` of resource entries (scrollable, no pagination)
  - [ ] 5.3.3 Each entry: text label + `accessibilityRole="link"` + `accessibilityLabel={name}` + `hitSlop: 10`
- [ ] 5.4 Export from `index.ts`
- [ ] 5.5 Unit tests:
  - [ ] 5.5.1 Empty resources → empty-state message rendered
  - [ ] 5.5.2 Three resources → three tappable entries in order
  - [ ] 5.5.3 Tap invokes `WebBrowser.openBrowserAsync` with the entry's URL
  - [ ] 5.5.4 `screen_viewed` fires exactly once on mount

## 6. Routes

- [ ] 6.1 Create `apps/alphaTiles/app/about.tsx` re-exporting `AboutContainer` as default
- [ ] 6.2 Create `apps/alphaTiles/app/share.tsx` re-exporting `ShareContainer` as default
- [ ] 6.3 Create `apps/alphaTiles/app/resources.tsx` re-exporting `ResourcesContainer` as default
- [ ] 6.4 Verify `expo-router` discovers all three routes — `/about`, `/share`, `/resources` navigate correctly

## 7. Dependency rules

- [ ] 7.1 Confirm via `nx graph` that `feature-about` depends on `data-language-assets`, `util-i18n`, `util-theme`, `util-analytics` only
- [ ] 7.2 Same check for `feature-share` and `feature-resources`
- [ ] 7.3 Confirm no cross-imports between the three feature libs

## 8. Verification

- [ ] 8.1 `openspec validate about-share-resources-screens` passes
- [ ] 8.2 `npx tsc --noEmit` passes across the workspace
- [ ] 8.3 Manual QA on iOS simulator: navigate to each route, verify fallback matrix (D7) by temporarily editing the pack
- [ ] 8.4 Manual QA on Android emulator: same
- [ ] 8.5 Manual QA on web (`APP_LANG=eng nx web-export alphaTiles` + preview): same
- [ ] 8.6 QR code scans to the expected Play Store URL on iOS and Android
- [ ] 8.7 Share sheet opens on iOS and Android; web uses Web Share API or clipboard fallback
