## ADDED Requirements

### Requirement: useHaptics hook exposes three trigger functions

`libs/shared/util-haptics` SHALL export a `useHaptics()` hook returning an object with exactly three functions: `triggerCorrect`, `triggerIncorrect`, `triggerCelebration`. Each function SHALL be `() => void`.

```ts
function useHaptics(): {
  triggerCorrect: () => void;
  triggerIncorrect: () => void;
  triggerCelebration: () => void;
};
```

#### Scenario: Hook shape

- **WHEN** a component calls `useHaptics()`
- **THEN** the returned object has keys `triggerCorrect`, `triggerIncorrect`, `triggerCelebration`
- **AND** each value is a zero-argument void-returning function

### Requirement: Haptics fire only when lang pack opts in

The trigger functions SHALL fire `expo-haptics` notifications only when `useLangAssets().settings.find("Haptics")` returns the exact string `"true"`. Any other value (including `undefined`, `"false"`, `"True"`, `"1"`) SHALL make the trigger functions no-ops.

#### Scenario: Setting "true" enables correct haptic

- **GIVEN** the active lang pack's `aa_settings.txt` contains `Haptics\ttrue`
- **WHEN** a component calls `triggerCorrect()`
- **THEN** `Haptics.notificationAsync(NotificationFeedbackType.Success)` is called once

#### Scenario: Setting "true" enables incorrect haptic

- **GIVEN** `Haptics=true` in the lang pack
- **WHEN** a component calls `triggerIncorrect()`
- **THEN** `Haptics.notificationAsync(NotificationFeedbackType.Error)` is called once

#### Scenario: Setting "true" enables celebration haptic

- **GIVEN** `Haptics=true` in the lang pack
- **WHEN** a component calls `triggerCelebration()`
- **THEN** `Haptics.notificationAsync(NotificationFeedbackType.Success)` is called once immediately
- **AND** called a second time approximately 200ms later

#### Scenario: Absent setting silences all haptics

- **GIVEN** the lang pack does not define `Haptics`
- **WHEN** any of the three trigger functions is called
- **THEN** no `Haptics.*` API is called

#### Scenario: Setting "false" silences all haptics

- **GIVEN** the lang pack contains `Haptics\tfalse`
- **WHEN** any trigger function is called
- **THEN** no `Haptics.*` API is called

### Requirement: Game shell celebration triggers celebration haptic

`feature-game-shell` SHALL call `triggerCelebration()` from `useHaptics()` at the same code site that fires the existing celebration audio/animation, regardless of the haptics-enabled state (the hook itself is the gate).

#### Scenario: Celebration path calls hook

- **WHEN** `feature-game-shell` enters its celebration sequence
- **THEN** it invokes `triggerCelebration()` from `useHaptics()`

### Requirement: Game containers fire correct/incorrect haptics alongside audio

Each ported game container that fires correct/incorrect audio on player answers SHALL call `triggerCorrect()` or `triggerIncorrect()` adjacent to the audio call. Order between audio and haptic call is unspecified.

#### Scenario: Correct answer path

- **WHEN** a game container determines the player's answer is correct
- **THEN** the container calls `triggerCorrect()` from `useHaptics()`

#### Scenario: Incorrect answer path

- **WHEN** a game container determines the player's answer is incorrect
- **THEN** the container calls `triggerIncorrect()` from `useHaptics()`
