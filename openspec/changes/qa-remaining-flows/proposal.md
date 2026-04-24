## Why

Player deletion, menu score display, and in-game audio were flagged as unverified after the initial port. A targeted QA pass found two real issues: (1) the `chrome.score` i18n key still interpolates `{{points}}` instead of acting as a plain label, and (2) the menu's score label shows the raw template string at runtime because i18n is initialized once at boot and the old resource is cached. Everything else — delete flow, audio wiring, replay button — is correctly implemented.

## What Changes

- Fix `chrome.score` i18n key to be a plain `"Score"` label (already done in code, but the cached i18n singleton needs a proper reset path so the fix is visible without a Metro restart)
- Verify and document the `menu.score` interpolation (`"Score: {{points}}"`) is working correctly with live points data on the menu screen
- Confirm web audio unlock (`unlockAudio()`) is called from the loading screen user-gesture so audio works in the browser

## Capabilities

### New Capabilities
- `score-display-verification`: Confirm score labels render correctly on both the game shell header and the game menu screen

### Modified Capabilities
- `loading-flow`: Verify `unlockAudio()` is called from the loading screen tap handler (existing spec)

## Impact

- `locales/en.json` — `chrome.score` key (already changed to `"Score"`)
- `libs/alphaTiles/feature-loading/` — confirm `unlockAudio()` call site
- `libs/alphaTiles/feature-game-menu/` — confirm `menu.score` interpolation with live points
- No new dependencies
