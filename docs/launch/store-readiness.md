# Store readiness — yue (學廣話), Google Play

Audited 2026-10-20 against the repo, not against issue titles or task checkboxes. iOS is out of scope for v1.
Package: `com.makektm.alphatiles` (`apps/alphaTiles/app.config.ts`, yue owns the bare ID).

Source of truth for listing text and form answers is [`store-metadata/`](../../store-metadata/README.md).
This page tracks **state and gaps** only; it does not copy the text. If a row here disagrees with the code, fix the row.

Play Console takes everything except the AAB **by hand**. EAS Submit uploads the AAB only (`submit.yue` in `eas.json`).

## 1. Default store listing

Play Console → Grow → Store presence → Main store listing. Default language zh-HK, translation en-US.
zh-Hant text in the repo goes into the Play **zh-HK** locale.

| Asset                  | Limit            | Source                                       | Size now | State                                                                                       |
| ---------------------- | ---------------- | -------------------------------------------- | -------- | ------------------------------------------------------------------------------------------- |
| Title (zh-HK)          | 30               | `android/zh-Hant/title.txt`                  | 14       | Drafted. Owner must confirm name 學廣話 (no issue)                                          |
| Title (en-US)          | 30               | `android/en-US/title.txt`                    | 25       | Drafted                                                                                     |
| Short description      | 80               | `android/*/short-description.txt`            | 30 / 77  | Drafted. Native zh-HK review open (#55)                                                     |
| Full description       | 4000             | `android/*/full-description.txt`             | 493 / 1282 | Drafted. Native review open (#55). Claims verified below                                  |
| Release notes          | 500              | `android/*/release-notes.txt`                | 115 / 348 | Drafted. **One line is wrong, see below**                                                 |
| App icon               | 512×512 PNG      | `store-metadata/yue/graphics/icon-512.png`   | 512×512  | **Drafted 2026-10-20**, needs customer approval (#53)                                       |
| Feature graphic        | 1024×500, no alpha | `store-metadata/yue/graphics/feature-graphic.png` | 1024×500 | **Drafted 2026-10-20**, needs customer approval (#53)                                |
| Phone screenshots      | 2–8, 9:16 max 2:1 | `store-metadata/yue/screenshots/android-phone/` | 0 | **Missing.** Shot list ready; needs a device or emulator (#57)                              |
| Contact email          | —                | `languages/yue/aa_langinfo.txt` row 12       | placeholder | **Blocking.** Still `yue@example.com` (#39). Also needed for IARC                       |
| Website                | —                | `play-console.md`                            | not live | `https://alphatilesagain.makektm.com`, to be published                                      |
| Privacy policy URL     | —                | `aa_langinfo.txt` row 13                     | not live | **Blocking.** `https://alphatilesagain.makektm.com/privacy` is set in the pack; page not published yet (#54) |

Character counts are Unicode code points, trailing newline excluded (`wc -m` includes the newline, so subtract 1).

### Listing claims checked against the code

- "More than 25 games": `aa_games.txt` has 28 door rows. OK.
- "Practise writing stroke by stroke": `feature-game-taiwan` and `data-stroke-data` exist. OK.
- "No ads, no in-app purchases, no account": no ad, billing or auth package in either `package.json`. OK.
- "Works offline": audio and images are bundled; the OTA check is the only network call. OK.
- "Several players per device": `data-players` exists. OK.
- **Wrong: release note "Settings: show or hide game names on the menu".** The toggle exists, but the `GameName` column in `languages/yue/aa_games.txt` is empty on every row (#37 open). The toggle shows nothing today. Cut the line from both `release-notes.txt` files or land #37 first.

## 2. Blocking submission

| Finding                                   | State                                                                                                                                  |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Privacy policy URL                        | **Open (#54).** Target audience includes children, so a working policy URL is mandatory. Pack points at the new subdomain; the page must go live and match `data-safety.md` |
| Contact email                             | **Open (#39).** Placeholder in the pack; feedback screen is hidden until it changes                                                    |
| Screenshots                               | **Open (#57).** Nothing committed. Icon and feature graphic are drafted, awaiting approval (#53)                                       |
| Data safety option A or B                 | **Open, owner decision.** Recommendation A (declare the EAS client ID). See `data-safety.md`                                           |
| Target audience age groups, countries     | **Open, owner decision.** Any child age group puts the app under Families Policy                                                       |
| First AAB upload by hand                  | **Open.** Google requires it before API submit works. Needs keystore in EAS and a Play service account key                              |
| Device QA                                 | **Open (#57).** No evidence the yue build has been exercised on a phone for release                                                    |

Account type matters: if the Play developer account is **personal** and was created after 13 Nov 2023, Play requires a closed test with 12 testers for 14 days before production. Organization accounts are exempt. Not recorded anywhere in the repo; confirm which this is.

## 3. Store artifacts already done

- Data safety draft, derived from source: `android/data-safety.md`.
- IARC answers (expected 3+/Everyone): `android/content-rating.md`.
- Play Console checklist (settings, app content, Families notes): `android/play-console.md`.
- Dangerous permissions stripped via `blockedPermissions` in `app.config.ts`; `RECORD_AUDIO`, notifications, storage, vibrate, overlay all removed.
- EAS profiles `yue` and `eng`; submit goes to the internal track as a draft.

## 4. Launch hygiene, not review

- **Launcher icon matches the store icon** (2026-10-20). `languages/yue/images/{icon,android-icon-*}.png` override the generic set; `app.config.ts` uses the pack adaptive layers only when all three exist. `eng` keeps the generic icons. Not yet seen on a device.
- **Splash**: `languages/yue/images/splash.png` exists; the config background is `#ffffff`. Eyeball it on a device.
- **Internal-track-first.** CI submits as a draft to internal; promote in Console.
- **`eng` is a separate Play app** (`com.makektm.alphatiles.eng`). Dev fixture; no listing, no submit.

## 5. Deliberate gaps

- No iOS listing. `ios/` and the iPhone/iPad screenshot slots are deferred (#50).
- No promo video, TV, Wear or tablet screenshots.
- No analytics (#49). Connecting it changes the data safety answers and must use a Families-compatible SDK.
- No account, so no account-deletion URL is required.

## 6. Housekeeping found during audit

- `apps/alphaTiles/android/` is gitignored and stale (`org.alphatilesapp.alphatilesagain.eng`). EAS builds ignore it. Delete it or run `expo prebuild --clean` before any local Gradle build.
- `store-metadata/README.md` open-items table is still accurate. Nothing in it has closed.

## Sources

Play Console Help: [graphic asset specs](https://support.google.com/googleplay/android-developer/answer/9866151),
[store listing text](https://support.google.com/googleplay/android-developer/answer/9859454),
[Families policy](https://support.google.com/googleplay/android-developer/answer/9893335),
[testing requirements for new personal accounts](https://support.google.com/googleplay/android-developer/answer/14151465).
Limits above come from `store-metadata/README.md` and the repo's earlier spec, not re-fetched this session. Re-check against the live Help pages before submitting.
