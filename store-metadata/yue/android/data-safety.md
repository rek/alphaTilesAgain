# Play data safety form: yue (`com.makektm.alphatiles`)

Draft answers for Play Console → App content → Data safety. Derived from the code as of this commit. **Re-check this file before each store release that adds a native module, an SDK or a network call.** Connecting analytics (#49) changes these answers.

Status: draft, pending owner sign-off (Option A or B below).

## What the app actually does (verified in source)

| Area | Finding | Where |
|------|---------|-------|
| Analytics | `@shared/util-analytics` ships a **no-op adapter**, disabled by default. Nothing calls `setAnalyticsAdapter`, so no events leave the device. | `libs/shared/util-analytics/src/lib/analyticsRegistry.ts` |
| Crash reporting | None (no Sentry, Bugsnag or Firebase). | `apps/alphaTiles/package.json` |
| Ads / ad SDKs | None. | same |
| Accounts / sign-in | None. | n/a |
| Local storage | AsyncStorage (zustand persist) holds player names typed by the child, avatar choice, game progress, settings, and the last OTA update id. Device only; never uploaded. | `libs/alphaTiles/data-players`, `data-progress`, `data-settings`, `libs/shared/util-ota/src/lib/reportApplyIfNeeded.ts` |
| Network: OTA | `expo-updates` checks `https://u.expo.dev/<projectId>` on launch (BootGate, `checkAutomatically: NEVER` + manual check). The request carries platform, runtime version, channel (`yue-production`), current/embedded update ids, and an **`EAS-Client-ID`**: a random UUID generated per install by expo-updates (not Android ID / AAID). | `apps/alphaTiles/app.config.ts` `updates` |
| Network: links | About / Resources open web pages in the browser (`expo-web-browser`); Feedback opens the device mail app with a `mailto:` link. The user sends the mail from their own mail app; the app does not transmit it. Feedback is hidden while the pack email is the placeholder (#39). | `feature-about`, `feature-resources`, `feature-feedback` |
| Share screen | Renders a QR code of the Play listing URL on-device. No network. | `feature-share` |
| Audio | Playback only. Mic disabled in the expo-audio plugin; `RECORD_AUDIO` is in `blockedPermissions`. | `app.config.ts` |
| Permissions left | `INTERNET` (OTA), `MODIFY_AUDIO_SETTINGS` (expo-audio), plus normal permissions merged by Expo modules (e.g. network state). No dangerous/runtime permissions. Location, camera, contacts, storage, notifications, vibrate all blocked or absent. | `app.config.ts` `blockedPermissions` |

## Form answers

### Option A (recommended, conservative): declare the EAS client ID

Expo receives and keeps the install-scoped `EAS-Client-ID` to serve updates (and counts installs on the EAS dashboard). Declaring it costs nothing and cannot be found to be an omission later.

| Question | Answer |
|----------|--------|
| Does your app collect or share any of the required user data types? | **Yes** |
| Is all of the user data collected by your app encrypted in transit? | **Yes** (HTTPS to u.expo.dev) |
| Do you provide a way for users to request that their data is deleted? | **No** (no account; ID is random and not linked to a person. Uninstalling the app discards it on the device.) |
| Data type: **Device or other IDs** | Collected: **Yes**. Shared: **No** (Expo processes it as our service provider). Processed ephemerally: **No**. Required (users can't turn it off). Purpose: **App functionality** (delivering app updates). |
| Every other data type (location, personal info, financial, health, messages, photos/videos, audio, files, calendar, contacts, app activity, web browsing, app info and performance) | **Not collected, not shared** |

### Option B: declare nothing

| Question | Answer |
|----------|--------|
| Does your app collect or share any of the required user data types? | **No** |

Only valid if the owner accepts that the EAS client ID is not "user data" under Play's definition. If in doubt, use Option A.

> **pending: owner** choose A or B. Recommendation: A.

### Security practices section (both options)

- Data encrypted in transit: Yes.
- Independent security review: No.
- Committed to Play Families Policy: Yes (see `play-console.md`, target audience includes children).

## Privacy policy

Play requires a privacy policy URL for any app whose target audience includes children. The language pack currently lists `https://alphatilesapps.org/privacy` (original AlphaTiles project). It must describe *this* app's behaviour (no analytics, local-only storage, Expo update check, GitHub Pages hosting for the web build). **pending: owner (#54).**
