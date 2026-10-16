# Store metadata

Store listing content per language pack. Static text and images; no runtime code reads it. Spec: `openspec/changes/app-store-metadata/`.

Only **yue** (Cantonese, `com.makektm.alphatiles`) has a listing. `eng` is a dev fixture and must never get a `store-metadata/eng/` directory or a public listing.

## Layout

```
store-metadata/yue/
├── android/                     Google Play (v1 target)
│   ├── zh-Hant/                 → Play locale zh-HK (default language)
│   │   ├── title.txt            ≤ 30 chars
│   │   ├── short-description.txt ≤ 80
│   │   ├── full-description.txt ≤ 4000
│   │   └── release-notes.txt    ≤ 500
│   ├── en-US/                   → Play locale en-US
│   ├── data-safety.md           Data safety form answers (from the code)
│   ├── content-rating.md        IARC questionnaire answers
│   └── play-console.md          Everything else Play Console asks (store settings, app content, Families)
├── graphics/README.md           Icon 512² + feature graphic 1024×500 spec
└── screenshots/
    ├── README.md                Shot list, sizes, capture steps
    └── android-phone/           1080 × 1920 PNGs
```

iOS (`ios/`, `screenshots/iphone-6.7`, `screenshots/ipad-12.9`) is deferred until the iOS build ships.

Character limits count Unicode code points, trailing newline excluded.

## How it reaches the store

**By hand.** EAS Submit uploads the AAB only (`submit.yue` in `apps/alphaTiles/eas.json`); it has no Android listing support (`metadataPath` is iOS-only and points at an EAS Metadata `store.config.json`). Copy each file into Play Console → Main store listing for the matching locale. Keep this directory the source of truth: edit here first, then paste.

Release notes: write user-facing changes in `docs/RELEASE_NOTES.md` first, then condense into `android/*/release-notes.txt` (≤ 500 chars) for each store release.

## Web (PWA)

The web build (https://rek.github.io/alphaTilesAgain/yueCantonese/) has no store listing. Its install name comes from the pack (`tools/write-web-manifest.ts` rewrites `apps/alphaTiles/public/manifest.json` from `aa_langinfo.txt` / `aa_share.txt` at web export). Nothing here feeds it.

## Open items before first submission

| Item | Who | Issue |
|------|-----|-------|
| Confirm app name 學廣話 | owner | none |
| Native review of zh-HK listing copy | customer | #55 |
| Privacy policy URL | owner | #54 |
| Contact email (Play listing + IARC) | owner | #39 |
| App icon + feature graphic | owner/customer | #53 |
| Phone screenshots on device | owner | #57 |
| Data safety option A/B | owner | none |
| Target audience age groups, countries | owner | none |
