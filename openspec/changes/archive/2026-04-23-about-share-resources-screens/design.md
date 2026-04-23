## Context

Three ancillary screens — `About`, `Share`, `Resources` — sit behind the top-level menu in the Java app. They are the smallest, simplest, least game-mechanical surfaces in the port: each reads 1-2 fields from the loaded language pack and renders them. Grouping them into a single OpenSpec change is appropriate because:

1. All three are pure "render static lang-pack content" screens with no shared state, no audio, no navigation fan-out.
2. All three share the same dependency shape (`lang-assets-runtime` + `util-i18n` + `util-theme` + `util-analytics`) and the same container/presenter split.
3. All three want the same external-link policy (open in system browser via `expo-web-browser`), the same accessibility treatment (`accessibilityRole="link"`), and the same analytics (fire `screen_viewed` on mount, nothing else).
4. Shipping them one-at-a-time would repeat the same scaffolding three times with no incremental value — the game-menu change that links to them needs all three routes to exist before it can be wired meaningfully.

The Java sources for the three screens (`About.java`, `Share.java`, `Resources.java`, sibling layouts `about.xml`, `share.xml`, `resources.xml`) are short and self-contained. The port's only real decisions are library choice (QR code, web-browser, share sheet) and what to omit from v1.

### Required reading for implementers

- `AGENTS.md` — entry doc; read first.
- `openspec/AGENT_PROTOCOL.md` — pickup protocol.
- `docs/ARCHITECTURE.md` §3 (taxonomy — three `type:feature` libs), §10 (i18n — pack-sourced text vs `chrome:` keys), §11 (container/presenter), §13 (routing).
- `docs/decisions/ADR-006-i18n-unified-i18next.md`.
- **Upstream OpenSpec changes (must be merged before starting):**
  - `lang-assets-runtime` — supplies `langInfo`, `share`, `resources`.
  - `theme-fonts` — typography + palette.
  - `i18n-foundation` — `t('chrome:about.*')` + a11y labels.
  - `analytics-abstraction` — `screen('/about')` etc.
  - Read each of those four changes' `design.md` before starting.
- **Source Java files being ported** (absolute paths):
  - `../AlphaTiles/app/src/main/java/org/alphatilesapps/alphatiles/About.java` — credits, privacy policy, SIL logo.
  - `../AlphaTiles/app/src/main/java/org/alphatilesapps/alphatiles/Share.java` — share sheet + QR code.
  - `../AlphaTiles/app/src/main/java/org/alphatilesapps/alphatiles/Resources.java` — resources list + external links.
  - `../AlphaTiles/app/src/main/res/layout/about.xml`, `share.xml`, `resources.xml` — layout references.
- **Fixture paths** (absolute, under `../PublicLanguageAssets/`):
  - `../PublicLanguageAssets/engEnglish4/res/raw/aa_langinfo.txt` — credits, email, privacy-policy URL, game-version URL-for-sharing.
  - `../PublicLanguageAssets/engEnglish4/res/raw/aa_share.txt` — share sheet content (may be single-row header only if share disabled).
  - `../PublicLanguageAssets/engEnglish4/res/raw/aa_resources.txt` — resource rows (title + URL + optional thumbnail).
  - `../PublicLanguageAssets/tpxTeocuitlapa/res/raw/aa_langinfo.txt`, `aa_share.txt`, `aa_resources.txt` — parity fixture.

## Goals / Non-Goals

**Goals:**

- Each screen renders against any language pack using only `aa_langinfo.txt`, `aa_share.txt`, `aa_resources.txt` content.
- All outbound links (privacy policy, email, resources, share URL) work on iOS, Android, and web.
- Each screen meets accessibility expectations: every tappable link has `accessibilityRole="link"` and a descriptive label.
- The QR code renders on all three platforms (iOS, Android, web).
- Empty / missing content is handled gracefully — an empty `aa_resources.txt` yields an empty-state message, not a crash.
- Three feature libs stay isolated: no cross-imports between them, each is independently testable.

**Non-Goals:**

- Audio-instructions playback (Java's `zzz_about.mp3`, `zzz_resources.mp3`). Requires `audio-system` to land first; revisit then.
- Settings-driven visibility (`Hide SIL logo`, `Hide privacy policy`). V1 ships both visible.
- Pagination for Resources. Replaced by native scrolling.
- Per-resource thumbnail images. Stored on the row model for future use, not rendered.
- Internationalization of pack-sourced text. Credits / email / URLs come from the pack as-is; `chrome:*` keys cover only frame text ("Credits", "Privacy Policy", etc.).

## Decisions

### D1. One capability covering all three screens — `info-screens`

Three feature libs, one capability spec. Rationale: the spec boundary is "static content renderer reading pack content"; splitting into three specs (`about-screen`, `share-screen`, `resources-screen`) would triplicate the same accessibility, link-handling, and analytics requirements. Each screen gets its own Requirement block under the single `info-screens` capability.

Alternatives rejected:

- **Three capabilities, one per screen.** Over-specified; three identical requirement sets differ only in which pack field they read. Maintenance cost not justified.
- **Fold into an existing capability** (e.g. `game-menu`). Rejected: these screens are content surfaces, the menu is navigation. Different specs own different concerns.

### D2. QR code library — `react-native-qrcode-svg`

Chosen because:

- Renders via `react-native-svg` → works on iOS, Android, and web uniformly.
- No native module — Expo managed workflow friendly, no prebuild changes.
- Actively maintained; widely used in RN ecosystem.
- Pure SVG output means QR scales to any container size without aliasing.

Alternatives rejected:

- **`qrcode` (JS) + manual canvas rendering.** Requires platform-specific canvas code; no unified API across native + web.
- **Image-based QR via a URL service** (e.g. Google Charts). Rejected: offline-breaks; third-party network dependency; privacy leak (pack URL leaves the device).
- **Port ZXing via native module.** Rejected: overkill; adds a native dep with no upside over an SVG library.

Install adds `react-native-qrcode-svg` + `react-native-svg` (its peer). `react-native-svg` is already expected elsewhere in the port (theme icons, lang-pack image rendering) so the peer is not a one-off cost.

### D3. External link handling — `expo-web-browser` for http(s), `Linking.openURL` for `mailto:`

Standard Expo pattern:

- `WebBrowser.openBrowserAsync(url)` for privacy policy + resource links → opens in-app browser on iOS/Android (better UX than launching Chrome), standard new-tab on web.
- `Linking.openURL('mailto:…')` for email — `WebBrowser` cannot handle custom URL schemes.
- Share URL is handled by `Share.share({ message, url })` (RN's native share sheet) — not a browser launch.

All three calls are wrapped in a thin `util-linking` helper? No — keep them inline in the three containers for v1. Three callsites is not enough duplication to justify a utility library yet; can extract later if more surfaces need link-handling.

### D4. Share mechanism — QR code + native share sheet, both optional

Java ships QR only. RN ships both because:

- QR code is useful for in-person / side-by-side distribution — scan from another device.
- Share sheet covers remote distribution — copy link, send via Messages / WhatsApp / email.
- Both surface the same URL; no new content.

Share button uses `import { Share } from 'react-native'` then `Share.share({ message: url, url })`. `url` is iOS-only (ignored on Android); `message` is the fallback that works everywhere.

### D5. `aa_share.txt` parsing — minimal, defensive

Format from the `engEnglish4` pack:

```
Link
https://play.google.com/store/apps/details?id=org.alphatilesapps.alphatiles.blue.engEnglish4
```

Row 1 is a single-cell header `Link`. Row 2 is a single-cell URL. The `lang-pack-parser` change owns parsing; this change consumes the parsed result as a `{ shareUrl: string | null }` field on the loaded assets.

Decision: **`aa_share.txt` parsing lives in `lang-pack-parser`, not here.** The feature-share container reads `assets.share.url`. If the parser yields `null` (malformed / missing row 2 / empty URL), the container renders a fallback message (`chrome:share.unavailable`) and no QR code.

### D6. `aa_resources.txt` parsing — tab-delimited, three columns

Format (possibly-empty):

```
Name<TAB>Link<TAB>Image
Alpha Tiles: Ready to Read<TAB>https://…<TAB>zz_playstore_rp
```

Same convention: `lang-pack-parser` owns the parse; this change consumes `assets.resources: Array<{ name: string, url: string, image: string }>`. Empty array → empty-state render.

### D7. Empty / missing-field fallback matrix

| Field | Source | Missing behavior |
|---|---|---|
| App version | `Application.nativeApplicationVersion` (expo-application) | Never missing on a real build |
| Pack name (local) | `aa_langinfo.txt` item 1 | Never missing — validator enforces |
| Pack name (English) | `aa_langinfo.txt` item 2 | Never missing |
| Country | `aa_langinfo.txt` item 5 | Never missing |
| Credits | `aa_langinfo.txt` item 9 | Never missing |
| Credits (lang 2) | `aa_langinfo.txt` item 14 | Missing/`none`/empty → hide second credits block |
| Email | `aa_langinfo.txt` item 12 | Missing/`none`/empty → hide email link entirely |
| Privacy policy URL | `aa_langinfo.txt` item 13 | Missing/`none`/empty → hide privacy link entirely |
| Share URL | `aa_share.txt` row 2 | Missing → render `chrome:share.unavailable`, no QR |
| Resources | `aa_resources.txt` | Empty (header only) → render `chrome:resources.empty` |

Validator (`lang-pack-validator`) enforces presence of required items. This change assumes the validator has run.

### D8. Container/presenter split per `CLAUDE.md`

Each screen = container + presenter:

- `AboutContainer.tsx` — reads assets via `useLangAssets()` hook, reads app version via `expo-application`, reads i18n keys via `useTranslation()`, calls `Linking.openURL`/`WebBrowser.openBrowserAsync` handlers, fires `screen_viewed` on mount. Passes pre-translated strings + handlers to `AboutScreen`.
- `AboutScreen.tsx` — pure props→JSX, `type:ui`-compatible (no i18n, no hooks except `React.useMemo`). Tagged `type:feature` because it imports the container, but the screen component itself has no side effects.

Same pattern for Share and Resources.

This keeps each screen component independently storybook-able with fixture props (even though Storybook is not mandatory for `type:feature`, per ADR-010). It also honors the `type:ui components must not import react-i18next` rule from `CLAUDE.md` by having the container do all translation before passing strings to the screen.

### D9. Analytics — `screen_viewed` only

Per `util-analytics` (analytics-abstraction change), each container fires `track('screen_viewed', { screen: 'about' | 'share' | 'resources' })` on mount. No other events:

- No "credits clicked", "privacy link tapped", "resource link tapped" — not worth the event volume for v1.
- No "share sheet opened" — out of scope.
- No "QR code rendered" — it always renders when share URL is present.

Revisit if product asks for link-click rates later.

### D10. Route files are one-liners

`apps/alphaTiles/app/about.tsx` is literally:

```ts
export { AboutContainer as default } from '@alphaTiles/feature-about';
```

Same for `share.tsx`, `resources.tsx`. Zero logic in the route file. All state, handlers, rendering, analytics live in the feature lib. This keeps routes trivially movable and keeps the app shell per `CLAUDE.md` ("apps are shells — all features in libs/").

### D11. Accessibility

- Every tappable link: `accessibilityRole="link"`, `accessibilityLabel` is the display text (or a pack-sourced fallback like "Privacy Policy" / "Email us"), `hitSlop` of at least 10 on all sides.
- QR code: wrapped in a `View` with `accessibilityRole="image"` + `accessibilityLabel="QR code linking to the Play Store"` (from `chrome:share.qrAlt`).
- Share button: `accessibilityRole="button"`, label from `chrome:share.button`.
- Scrollable credits block (long text): `accessibilityRole="text"`.

### D12. `chrome:*` i18n keys introduced by this change

- `chrome:about.title` — screen title
- `chrome:about.version` — "Version {{version}}" label
- `chrome:about.credits` — "Credits" heading
- `chrome:about.email` — "Email us" label (fallback when pack email is present)
- `chrome:about.privacy` — "Privacy Policy" link label
- `chrome:share.title` — screen title
- `chrome:share.instructions` — "Scan this QR code to share this app"
- `chrome:share.button` — "Share via..." button label
- `chrome:share.qrAlt` — QR code accessibility label
- `chrome:share.unavailable` — fallback message when `aa_share.txt` is missing/malformed
- `chrome:resources.title` — screen title
- `chrome:resources.empty` — "No resources available"

All keys live under the `chrome` namespace owned by `util-i18n` — already established by the `i18n-foundation` change.

## Risks / Trade-offs

- **[Risk]** `react-native-qrcode-svg` adds a transitive dep on `react-native-svg`. If the port's theme system ends up picking a different SVG lib, we'd have two SVG runtimes. **Mitigation**: standardize on `react-native-svg` — it's the dominant choice and expected anyway. Document in ADR-007-ish / theme-fonts change.
- **[Risk]** `WebBrowser.openBrowserAsync` on Android may bounce to Chrome Custom Tabs, which respects the user's Chrome profile. On devices without Chrome, falls back to system default. Edge case but documented Expo behavior — no mitigation needed.
- **[Trade-off]** Dropping Java's audio-instructions affordance simplifies the first cut but means packs that ship `zzz_about.mp3` silently lose that feature until we revisit. **Accepted** — game-shell audio lands in `audio-system`; these screens can adopt it then.
- **[Trade-off]** Single capability (`info-screens`) means future changes that modify one screen will touch this capability's spec, not a screen-specific one. **Accepted** — granularity is proportional to expected churn; these screens rarely change.
- **[Trade-off]** Route files are non-DRY compared to a generated route list. **Accepted** — Expo Router's file-based routing prefers explicit files; trivial re-exports are idiomatic.

## Migration Plan

No prior state to migrate — this is greenfield code under empty-app-shell. Order of landings:

1. Scaffold the three feature libs (`nx g @nx/expo:library ...`).
2. Wire `chrome:*` keys into `util-i18n` locale files (English only for v1; other languages pending i18n content).
3. Add `react-native-qrcode-svg` + `react-native-svg` to `package.json`, run install.
4. Land `AboutContainer` + `AboutScreen` with tests for the fallback matrix (D7).
5. Land `ShareContainer` + `ShareScreen` with tests for the QR render + share-sheet invocation.
6. Land `ResourcesContainer` + `ResourcesScreen` with tests for empty / non-empty rendering.
7. Add the three route files.
8. Manual QA pass on iOS, Android, web — each of the three screens, each of the three fallback paths (missing email, missing privacy URL, empty resources).

Rollback: revert the change commit. Routes disappear; feature libs remain on disk but unlinked.

## Open Questions

- Should `feature-share` surface the pack code (e.g. "eng", "English") next to the QR code to confirm which pack the link points to? **Defer** — Java doesn't, so symmetry says no; revisit on user feedback.
- If `aa_resources.txt` grows beyond ~20 entries, do we want a search/filter affordance? **Defer** until a pack actually has that many resources; current max across shipped packs is 6.
- `Share.share({ url, message })` behavior on web — web fallback uses the Web Share API when available, else copies to clipboard with a toast. Is the clipboard fallback acceptable, or should web show a copy button explicitly? **Defer** to web QA.
