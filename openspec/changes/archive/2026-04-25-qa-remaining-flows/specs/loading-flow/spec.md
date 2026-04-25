## MODIFIED Requirements

### Requirement: Web audio-unlock gesture

On `Platform.OS === 'web'`, the loading screen SHALL display a "Tap to begin" button during the `web-gate` phase. The button's press handler SHALL call `unlockAudio()` from `data-audio` and transition to the `audio` phase on resolution. `unlockAudio()` MUST be invoked directly inside the `onPress` callback of a `Pressable` (or equivalent user-gesture handler) — it MUST NOT be called inside a `useEffect`, `setTimeout`, or any deferred path.

#### Scenario: Web user taps

- **WHEN** the web user taps "Tap to begin"
- **THEN** `unlockAudio()` is invoked within a user-gesture event handler
- **AND** the button is replaced by the progress ring
- **AND** the `audio` phase starts

#### Scenario: Native platform skips gate

- **WHEN** the app boots on iOS or Android
- **THEN** no "Tap to begin" button is rendered
- **AND** the `audio` phase starts immediately after `i18n`

#### Scenario: unlockAudio call site is a direct gesture handler

- **WHEN** `LoadingContainer.tsx` is inspected
- **THEN** the `onPress` prop of the "Tap to begin" `Pressable` calls `unlockAudio()` synchronously (not via `setTimeout` or `useEffect`)
- **AND** no path exists where `unlockAudio()` is called outside a user-gesture event
