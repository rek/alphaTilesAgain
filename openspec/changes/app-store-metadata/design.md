## Context

No Java analog. The legacy Android build was sideloaded; this is the first public store submission.

Content files are static text; no runtime code reads them — they are consumed by EAS Submit / Fastlane deliver tooling at release time.

### Required reading for implementers

- `AGENTS.md`
- `openspec/AGENT_PROTOCOL.md`
- `docs/ARCHITECTURE.md`
- `eas.json` — current build profiles; submit section to be added
- App Store product page guidelines: https://developer.apple.com/app-store/product-page/
- Google Play listing help: https://support.google.com/googleplay/android-developer/answer/9866151

## Goals / Non-Goals

**Goals:**
- All required store listing files exist for Yue, both locales.
- `eas.json` submit profile for Yue references the correct metadata directory.
- Screenshot dimensions documented and screens identified.
- `eng` pack excluded from any submit profile.

**Non-Goals:**
- Runtime code changes.
- Automated screenshot pipeline.
- Locales beyond `zh-Hant` and `en-US`.
- Keyword A/B testing or iterative ASO.

## Decisions

### D1. Directory layout

```
store-metadata/
└── yue/
    ├── ios/
    │   ├── zh-Hant/
    │   │   ├── title.txt
    │   │   ├── full-description.txt
    │   │   ├── keywords.txt
    │   │   └── release-notes.txt
    │   └── en-US/
    │       ├── title.txt
    │       ├── full-description.txt
    │       ├── keywords.txt
    │       └── release-notes.txt
    ├── android/
    │   ├── zh-Hant/
    │   │   ├── title.txt
    │   │   ├── short-description.txt
    │   │   ├── full-description.txt
    │   │   └── release-notes.txt
    │   └── en-US/
    │       ├── title.txt
    │       ├── short-description.txt
    │       ├── full-description.txt
    │       └── release-notes.txt
    └── screenshots/
        ├── iphone-6.7/
        ├── ipad-12.9/
        └── android-phone/
```

`keywords.txt` is iOS-only (App Store has a keywords field; Play does not).
`short-description.txt` is Android-only (Play short description, 80 chars max).

### D2. Locales

Minimum two locales for every Yue submission:

| Locale | Rationale |
|--------|-----------|
| `zh-Hant` | Primary audience; Traditional Chinese used by Cantonese communities |
| `en-US` | Required by App Store Connect as a fallback locale; recommended for Play |

No Simplified Chinese (`zh-Hans`) in v1 — distinct orthography; treat as a future language pack.

### D3. Required-files matrix

| File | Platform | Locales | Max length |
|------|----------|---------|------------|
| `title.txt` | iOS + Android | zh-Hant, en-US | 30 chars |
| `short-description.txt` | Android only | zh-Hant, en-US | 80 chars |
| `full-description.txt` | iOS + Android | zh-Hant, en-US | 4000 chars (iOS); 4000 chars (Play) |
| `keywords.txt` | iOS only | zh-Hant, en-US | 100 chars total (comma-separated) |
| `release-notes.txt` | iOS + Android | zh-Hant, en-US | 4000 chars (iOS); 500 chars (Play) |

### D4. Screenshot list

Capture in this order. Each screen should show the app in the Yue language pack loaded.

| # | Screen | Notes |
|---|--------|-------|
| 1 | Home / language select | App name visible; Yue pack selected |
| 2 | Game menu (tile grid overview) | Show available games |
| 3 | Active game — matching tiles | Mid-game state, tiles on screen |
| 4 | Correct answer celebration | Celebration overlay visible |
| 5 | Settings / about | Secondary content screen |

Required dimensions:

| Slot | Size (px) | Platform |
|------|-----------|----------|
| iPhone 6.7" | 1290 × 2796 | iOS required |
| iPad 12.9" | 2048 × 2732 | iOS required |
| Android phone | 1080 × 1920 (min) | Play required |

Screenshots must be PNG or JPEG. No device frame overlaid by the submitter (stores add their own). Language overlay (Traditional Chinese UI) must be visible in all shots.

### D5. EAS Submit config keys

Add a `submit` top-level key to `eas.json`:

```json
"submit": {
  "yue-production": {
    "ios": {
      "metadataPath": "store-metadata/yue/ios"
    },
    "android": {
      "serviceAccountKeyPath": "$GOOGLE_SERVICE_ACCOUNT_KEY",
      "metadataPath": "store-metadata/yue/android",
      "track": "internal"
    }
  }
}
```

`track: "internal"` for initial submission; promote to production manually in Play Console after review.

### D6. eng pack exclusion

The `eng` language pack is a developer fixture used for CI and local testing. It contains placeholder content and must never appear in a public store listing. No submit profile references `eng`. This is enforced by convention (no `store-metadata/eng/` directory) and documented here.

## Unresolved Questions

- `eas.json` bundle identifier and Apple team ID — confirm not placeholder before wiring submit profile.
- Play Store service account key path — confirm env var name matches CI secrets.
- Traditional Chinese copy — who performs community review before first submission?
- Screenshot capture: Maestro script acceptable, or strict manual-only policy?
