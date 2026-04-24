# feature-game-shell

Shared game lifecycle container. Ports `GameActivity.java` (the abstract Android base class) to React Native.

## Usage

Every concrete game mechanic wraps its board inside `<GameShellContainer>`. The shell owns:

- Score and tracker-icon progression (Zustand store via `data-progress`)
- Audio replay, correct/incorrect/final sounds (via `data-audio`)
- `after12checkedTrackers` modes 1/2/3 — keep playing / return to earth / celebration + next game
- Android hardware-back navigation
- AppState listener (pause on background)
- Celebration screen trigger (Lottie animation, ~1800ms delay, next-game nav at ~4500ms)

```tsx
export function ChinaContainer() {
  return (
    <GameShellContainer showInstructionsButton instructionAudioId="china_instructions">
      <ChinaScreen />
    </GameShellContainer>
  );
}
```

Mechanic children consume the shell's context via `useGameShell()`:

```ts
const { incrementPointsAndTracker, replayWord, interactionLocked, setRefWord } = useGameShell();
```

**Do not re-implement** score display, tracker icons, audio-replay button, celebration, back navigation, or player-prefs read/write in a concrete game — those are all handled here.

## Dependency rules

`type:feature` — may import `type:ui`, `type:data-access`, `type:util`, but NOT another `type:feature`.
