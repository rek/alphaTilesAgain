## Context

QA pass on three flows: player deletion, menu score display, in-game audio. Investigation found player deletion and audio wiring are correct. Two issues remain:

1. `chrome.score` i18n key was `"Score: {{points}}"` (wrong — the number is rendered separately by ScoreBar). Already changed to `"Score"` in code but i18n is initialized once at boot so the old cached string shows until Metro restarts.
2. Web audio unlock: `unlockAudio()` must be called from a user-gesture handler in the loading screen. Needs verification.

## Goals / Non-Goals

**Goals:**
- Confirm `chrome.score` renders as `"Score"` after Metro restart
- Confirm `menu.score` interpolation (`"Score: {{points}}"`) shows live points on the menu
- Confirm `unlockAudio()` is wired in `LoadingContainer` (or wire it if missing)
- Confirm player deletion and audio playback work in the running app

**Non-Goals:**
- Per-door score display on the menu (not in Java original for this game type)
- Audio for game types other than China (not yet implemented)

## Decisions

**i18n cache**: No runtime reinit mechanism needed. The fix is already in `locales/en.json`. Metro restart picks it up. No architectural change required.

**Audio unlock**: `unlockAudio()` must be called inside a `Pressable.onPress` (or equivalent user-gesture handler) to satisfy browser autoplay policy. The loading screen "Tap to begin" button is the correct call site.

## Risks / Trade-offs

- [i18n cached value] Users who had the app open before the fix see stale `"Score: {{points}}"` text until they hard-refresh. → Acceptable: dev-time issue only, not a production concern.
