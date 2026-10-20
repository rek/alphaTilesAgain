# Play Console checklist: yue (`com.makektm.alphatiles`)

Everything Play Console asks for besides the text files, the data safety form (`data-safety.md`) and the content rating (`content-rating.md`). EAS Submit uploads only the AAB (`submit.yue` in `apps/alphaTiles/eas.json`); **all listing content is entered by hand in Play Console**. See `../../README.md`.

Items marked **pending** need an owner or customer answer before the first submission.

## Main store listing (Grow → Store presence → Main store listing)

| Field | Value | Source |
|-------|-------|--------|
| Default language | **Chinese (Hong Kong) – zh-HK** | |
| Translations | **English (United States) – en-US** | |
| App name | zh-HK: `zh-Hant/title.txt`; en-US: `en-US/title.txt` | **pending: owner** confirm app name 學廣話 (from `languages/yue/aa_langinfo.txt` "Game Name") |
| Short description | `*/short-description.txt` | **pending: customer (#55)** zh-HK copy review |
| Full description | `*/full-description.txt` | **pending: customer (#55)** zh-HK copy review |
| App icon | 512 × 512 PNG, see `../graphics/README.md` | **pending: owner/customer (#53)** |
| Feature graphic | 1024 × 500, see `../graphics/README.md` | **pending: owner/customer (#53)** |
| Phone screenshots | `../screenshots/android-phone/`, see `../screenshots/README.md` | **pending: owner** (device capture, #57) |

zh-Hant text in this repo goes into the Play **zh-HK** locale (Play has no zh-Hant; zh-TW is a separate locale and is not used for v1).

## Store settings (Grow → Store presence → Store settings)

| Field | Value |
|-------|-------|
| App or game | App |
| Category | Education |
| Tags | Education, Language learning, Kids (pick from Play's list) |
| Email | **pending: owner (#39)** (pack has placeholder `yue@example.com`) |
| Website | https://alphatilesagain.makektm.com (not yet published) |
| Phone | leave blank |
| External marketing | owner choice |

## App content (Policy → App content)

| Declaration | Answer |
|-------------|--------|
| Privacy policy | https://alphatilesagain.makektm.com/privacy (**pending: page must be published, #54**) |
| App access | All functionality available without special access (no login). |
| Ads | No, the app does not contain ads. |
| Content rating | `content-rating.md` |
| Target audience and content | Age groups: **pending: owner**. Suggested: 5 and under, 6–8, 9–12 (early readers) and optionally 13+ for adult learners. Any child age group puts the app under the **Families Policy**. Appeal to children: Yes. |
| Data safety | `data-safety.md` (**pending: owner** option A/B) |
| Government app | No |
| Financial features | None |
| Health | None |
| News app | No |
| COVID-19 tracing | No |

### Families Policy notes

- No ads, no ad SDKs, no analytics SDK: compliant today. Connecting analytics (#49) must use a Families-compatible SDK and update `data-safety.md`.
- The app does not request location, camera, mic or contacts, and does not transmit Android ID / AAID.
- Teacher Approved: optional, owner choice after launch.

## Releases

- First AAB is uploaded by hand (Google requirement), then CI submits to the **internal** track as a draft (`docs/GETTING_STARTED.md` → Store submission).
- Release notes: `*/release-notes.txt` (≤500 chars per locale), written from `docs/RELEASE_NOTES.md`.
- Countries: **pending: owner** (suggest all, or start with Hong Kong, Macau, UK, US, Canada, Australia).
