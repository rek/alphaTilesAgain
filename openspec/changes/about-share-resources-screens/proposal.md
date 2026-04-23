## Why

The Java app ships three ancillary screens reached from the top-level menu (`Earth`): `About` (app + pack identity, credits, contact, privacy policy), `Share` (QR code to the pack's Play Store listing plus a native share affordance), and `Resources` (pack-authored list of external links). These are the last non-game surfaces the port needs before the game shell work begins; they're small, static, and share a common "render lang-pack content into a scrollable screen" shape. Shipping them together keeps the ancillary surface consistent and the new `info-screens` capability cohesive.

## What Changes

- Add `libs/alphaTiles/feature-about` (type:feature) with `AboutContainer` + `AboutScreen`. Reads app version, pack name, credits (`aa_langinfo.txt` items 9 + 14), email (item 12), and privacy policy URL (item 13). Renders email as `mailto:` link and privacy URL as external-browser link via `expo-web-browser`.
- Add `libs/alphaTiles/feature-share` (type:feature) with `ShareContainer` + `ShareScreen`. Reads the pack's Play Store URL from `aa_share.txt` (row 2, column 0 — the file is a single-cell one-line body with header `Link` on row 1), renders a QR code via `react-native-qrcode-svg`, and offers a native share-sheet button that shares the same URL.
- Add `libs/alphaTiles/feature-resources` (type:feature) with `ResourcesContainer` + `ResourcesScreen`. Parses `aa_resources.txt` (tab-delimited, columns `Name` / `Link` / `Image`) and renders each row as a tappable link that opens in external browser. Empty pack → renders `chrome:resources.empty` string.
- Add routes: `apps/alphaTiles/app/about.tsx`, `apps/alphaTiles/app/share.tsx`, `apps/alphaTiles/app/resources.tsx` — each a thin re-export of its container.
- Add `react-native-qrcode-svg` (and its `react-native-svg` peer, if not already present) as a runtime dependency.
- Add `chrome:resources.empty` key to the shared i18n namespace so the empty resources state is translatable.
- Fire `screen_viewed` analytics on mount for each screen. No other analytics.

## Capabilities

### New Capabilities

- `info-screens`: static content renderers for the About, Share, and Resources screens. Covers pack-sourced content binding, the QR-code affordance, external-link handling, accessibility requirements, and the empty-resources state.

### Modified Capabilities

_None_ — no existing capability changes.

## Impact

- **New libs**: `libs/alphaTiles/feature-about`, `libs/alphaTiles/feature-share`, `libs/alphaTiles/feature-resources`. Each container owns hooks + i18n; each screen (presenter) is pure props→JSX (per `CLAUDE.md` container/presenter rule).
- **New routes**: three files in `apps/alphaTiles/app/` wiring the containers into Expo Router.
- **New runtime deps**: `react-native-qrcode-svg`, `expo-web-browser`. `react-native-svg` is a peer of the QR lib.
- **Consumed capabilities**: `lang-assets-runtime` (for the parsed `aa_*.txt` content), `util-i18n` (for `chrome:*` keys), `util-theme` (layout + typography), `util-analytics` (for `screen_viewed`).
- **No breaking changes.** No existing capability moves or renames. These are additive feature libs reached from a menu that does not yet exist at wire time — the routes will be linked once `game-menu` (the `Earth` port) lands.
- **Risk: `aa_share.txt` malformed** (missing row 2 or empty URL). Container falls back to rendering the pack's Play Store URL derived from pack code if `aa_share.txt` is unparseable; if that also fails, the screen renders a `chrome:share.unavailable` message and no QR code.

## Out of Scope

- Audio-instructions button (Java's `zzz_about.mp3` / `zzz_resources.mp3` playback). Deferred — all three screens ship without the audio-instructions affordance in v1. Will revisit once `audio-system` lands and a pack actually supplies those clips.
- The `Earth` menu screen that navigates to these three. Owned by the `game-menu` change.
- SIL logo hide/show toggle and privacy-policy hide/show toggle (`Hide SIL logo`, `Hide privacy policy` in `aa_settings.txt`). The port does not ship these settings in v1; both surfaces are always shown. Can revisit when settings plumbing lands.
- Pagination of the Resources list (Java paginates at 6 per screen). RN version renders a single scrollable `FlatList` — native scrolling replaces the arrow buttons.
- Per-resource thumbnail images (Java's `Image` column). Deferred to v1.1 — v1 renders text links only. The column is parsed and stored on the row model but not displayed.
