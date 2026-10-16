# Screenshots: yue

Status: shot list ready; **captures pending: owner** (on device / emulator, alongside pre-release QA #57). iOS slots (`iphone-6.7/`, `ipad-12.9/`) are deferred until iOS ships.

## Shot list

Capture with the yue build, UI in Traditional Chinese (Hong Kong). Use a player with some progress so doors show trackers. Save as `NN-name.png` in the slot folder.

| # | File | Screen (route) | What to show |
|---|------|----------------|--------------|
| 1 | `01-choose-player.png` | Choose player (`/choose-player`) | Avatar grid with 2–3 named players (use neutral names, e.g. 小明, 小美). App name 學廣話 visible if possible. |
| 2 | `02-game-menu.png` | Game menu (`/menu`) | Doors grouped by step, some with trackers. Game names on (Settings toggle) if #37 has landed. |
| 3 | `03-active-game.png` | A tile matching game (e.g. Thailand door) | Mid-game: picture/word prompt and Chinese character tiles on screen. |
| 4 | `04-writing.png` | Writing game (Taiwan door) | A character partly traced, stroke guide visible. |
| 5 | `05-celebration.png` | Any game, correct answer | Celebration overlay visible. |
| 6 (optional) | `06-settings.png` | Settings (`/settings`) | Shows 設定 screen; use only if a 6th shot is wanted. |

Play accepts 2–8 phone screenshots; 5 is the target. No device frames, no captions burned in (add captions later only if the owner wants them).

## Dimensions

| Slot | Size | Notes |
|------|------|-------|
| `android-phone/` | **1080 × 1920** PNG (9:16) | Play rule: each side 320–3840 px and the long side ≤ 2× the short side. A 1080 × 2400 phone (20:9) breaks the 2× rule, so use a 1080 × 1920 emulator profile or crop. 24-bit PNG or JPEG, no alpha. |
| `iphone-6.7/` | 1290 × 2796 | deferred (iOS) |
| `ipad-12.9/` | 2048 × 2732 | deferred (iOS) |

Tablet screenshots (7", 10") are optional on Play; skip for v1.

## Capture (Android emulator)

1. Create an AVD with a 1080 × 1920 screen (e.g. Pixel 2 profile, or custom hardware profile 1080 × 1920, 420 dpi).
2. Install the yue build: `APP_LANG=yue nx buildApk alphaTiles`, then `adb install dist/apps/alphaTiles/alphaTiles-yue.apk`.
3. Turn on demo mode to clean the status bar:
   `adb shell settings put global sysui_demo_allowed 1 && adb shell am broadcast -a com.android.systemui.demo -e command enter && adb shell am broadcast -a com.android.systemui.demo -e command clock -e hhmm 0900`
4. For each shot: `adb exec-out screencap -p > store-metadata/yue/screenshots/android-phone/01-choose-player.png`
5. Check sizes: `file store-metadata/yue/screenshots/android-phone/*.png` → every file `1080 x 1920`.
