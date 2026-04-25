## Why

Audio feedback alone misses two cohorts: deaf/HoH learners and players in muted contexts (classrooms, public transit). A short vibration on correct/incorrect answers and on celebration adds a non-audio reinforcement channel without changing game logic.

Haptics SHOULD be opt-in per language pack (some hardware lacks vibrators, some communities prefer silence), so the toggle lives in `aa_settings.txt` rather than a user-facing settings UI.

## What Changes

- Add `libs/shared/util-haptics` (`type:util`, `scope:shared`).
- Add `expo-haptics` as an explicit app dependency.
- Implement `useHaptics()` hook returning `{ triggerCorrect, triggerIncorrect, triggerCelebration }`.
- Hook reads `useLangAssets().settings.find("Haptics")`. When value is `"true"`, the trigger functions fire `expo-haptics` notifications. Any other value (including absent) makes them no-ops.
- Patterns:
  - `triggerCorrect` → `Haptics.notificationAsync(NotificationFeedbackType.Success)`
  - `triggerIncorrect` → `Haptics.notificationAsync(NotificationFeedbackType.Error)`
  - `triggerCelebration` → two `Success` notifications 200ms apart
- Game containers call `triggerCorrect`/`triggerIncorrect` alongside their existing audio calls.
- `feature-game-shell`'s celebration path calls `triggerCelebration`.
- Web is a no-op (expo-haptics already silently no-ops on web).

## Capabilities

### New Capabilities

- `haptics-feedback` — config-gated vibration cues for correct, incorrect, and celebration events; lang-pack-driven enable.

### Modified Capabilities

- `feature-game-shell` — celebration trigger gains a haptic call.
- Game containers (`game-china`, `game-mexico`, etc.) — existing correct/incorrect handlers each gain a haptic call.

## Impact

- New lib `libs/shared/util-haptics`.
- New runtime dep `expo-haptics`.
- `aa_settings.txt` gains an optional `"Haptics"` key; default behavior unchanged when absent.
- Game containers add one hook call + two trigger calls each. No changes to game logic, scoring, or persistence.
- No breaking changes; lang packs that never set `"Haptics"` see today's behavior.

## Out of Scope

- Per-event toggles (e.g., "celebration only").
- Custom vibration patterns beyond the three notification types.
- A user-facing settings UI to toggle haptics.
- Android-specific custom vibration durations (use `expo-haptics` defaults).

## Unresolved Questions

- Should `triggerCelebration` use `Heavy` impact instead of double `Success`? Defaulting to double `Success` for cross-platform consistency.
- Should the hook respect a system-level "reduce motion" / "haptics off" accessibility setting? Out of scope for v1.
