## Context

No Java analog. Legacy Android did not vibrate on game events; this is a pure-new feature.

The hook is a thin wrapper over `expo-haptics`. Lang-pack control matches the existing pattern used by other settings (e.g. `"View memory cards for _ milliseconds"` in `game-mexico`).

### Required reading for implementers

- `AGENTS.md`
- `openspec/AGENT_PROTOCOL.md`
- `docs/ARCHITECTURE.md` §3 (taxonomy), §11 (container/presenter)
- `docs/CODE_STYLE.md`
- `docs/PROJECT_ORGANIZATION.md` — `type:util` rules (no React imports beyond hooks; no `feature` imports)
- `libs/shared/util-langassets/src/lib/useLangAssets.ts` — settings shape
- `libs/alphaTiles/feature-game-shell/src/` — celebration trigger location
- `expo-haptics` docs: https://docs.expo.dev/versions/latest/sdk/haptics/

## Goals / Non-Goals

**Goals:**
- Single hook with three trigger functions.
- Lang-pack-gated; default off when key absent.
- Web safe (no-op).
- No coupling to specific games — any container can call.

**Non-Goals:**
- Custom vibration patterns or durations.
- A settings UI.
- Per-event configuration.
- System accessibility integration.

## Decisions

### D1. State / data flow

Hook reads `useLangAssets().settings.find("Haptics")` once per render. The `triggerXxx` functions close over the parsed boolean.

```ts
// libs/shared/util-haptics/src/lib/useHaptics.ts
export function useHaptics(): {
  triggerCorrect: () => void;
  triggerIncorrect: () => void;
  triggerCelebration: () => void;
};
```

Implementation sketch:

```ts
export function useHaptics() {
  const { settings } = useLangAssets();
  const enabled = settings.find('Haptics') === 'true';

  const triggerCorrect = useCallback(() => {
    if (!enabled) return;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [enabled]);

  const triggerIncorrect = useCallback(() => {
    if (!enabled) return;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  }, [enabled]);

  const triggerCelebration = useCallback(() => {
    if (!enabled) return;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 200);
  }, [enabled]);

  return { triggerCorrect, triggerIncorrect, triggerCelebration };
}
```

### D2. Settings key parsing

`settings.find("Haptics")` returns `string | undefined`. Treat any value other than the exact string `"true"` (case-sensitive, no trim) as off. This matches the existing pattern in the codebase. If lang packs vary in casing later, normalize at that point — not pre-emptively.

### D3. Library type and dependency direction

`util-haptics` is `type:util`, `scope:shared`. Per dependency rules, `util` may not import `feature`. `useHaptics` depends on `useLangAssets` which lives in `libs/shared/util-langassets` — same scope, util→util is allowed.

Game containers (`type:feature`) import `useHaptics` directly — `feature → util` is allowed.

### D4. No store, no provider

The hook is stateless beyond the closure over `enabled`. No context provider, no Zustand store.

### D5. Where game containers call

Each game container that already calls audio on correct/incorrect adds the haptic call adjacent. Example in a Mexico-style match handler:

```ts
if (isMatch) {
  audio.playCorrect();
  triggerCorrect();
  // ...
} else {
  audio.playIncorrect();
  triggerIncorrect();
  // ...
}
```

Celebration call lives inside `feature-game-shell` next to the existing celebration audio/animation trigger.

### D6. Web behavior

`expo-haptics` is a no-op on web — calls return resolved promises with no effect. No platform branching needed in `useHaptics`.

### D7. Error handling

`Haptics.notificationAsync` returns a Promise. We `void` the result; rejections are swallowed (haptics failure is non-fatal and not user-actionable). Do not add try/catch.

## Unresolved Questions

- Add a one-time warmup call on mount to wake the haptic engine on iOS? Skip for v1 — measure first if perceptible delay reported.
- Should the celebration's 200ms gap be tunable? No — fixed for v1.
