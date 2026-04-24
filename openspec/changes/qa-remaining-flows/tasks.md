## 0. Preflight

- [x] 0.1 Read design.md and confirm scope (score label, audio unlock, menu interpolation)
- [x] 0.2 Run `npx tsc --noEmit` to confirm clean baseline before changes

## 1. Chrome Score Label

- [x] 1.1 Confirm `locales/en.json` key `chrome.score` is `"Score"` (no `{{points}}`)
- [ ] 1.2 Restart Metro and verify game shell header shows `"Score"` not `"Score: {{points}}"`

## 2. Menu Score Interpolation

- [x] 2.1 Locate `menu.score` key usage in `libs/alphaTiles/feature-game-menu/`
- [x] 2.2 Confirm `t('menu:menu.score', { points })` receives live points from game shell context
- [ ] 2.3 Open game menu in running app and verify label shows `"Score: <N>"` with real number

## 3. Web Audio Unlock

- [x] 3.1 Open `libs/alphaTiles/feature-loading/src/LoadingContainer.tsx`
- [x] 3.2 Confirm `unlockAudio()` is called directly inside the `Pressable` `onPress` handler for "Tap to begin"
- [x] 3.3 If missing, add the `unlockAudio()` call to the `onPress` handler (not in `useEffect` or `setTimeout`)
- [ ] 3.4 Test on web: boot app, tap "Tap to begin", confirm audio plays in game

## 4. Player Deletion Smoke Test

- [ ] 4.1 Navigate to player management, delete a player, confirm it is removed from the list
- [ ] 4.2 Confirm app does not crash and navigates correctly after deletion

## 5. Validation

- [x] 5.1 Run `npx tsc --noEmit` — zero errors
- [x] 5.2 Run `openspec validate qa-remaining-flows` — exits 0
- [ ] 5.3 Manual smoke: game header shows `"Score"` label + separate number
- [ ] 5.4 Manual smoke: game menu shows `"Score: N"` with live value
- [ ] 5.5 Manual smoke: web audio plays after tap-to-begin
