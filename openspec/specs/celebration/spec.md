# celebration Specification

## Purpose
TBD - created by archiving change game-engine-base. Update Purpose after archive.
## Requirements
### Requirement: Lottie-based mastery animation

`libs/shared/ui-celebration` SHALL export a `<Celebration>` component that renders a full-screen Lottie animation. The animation source is a prop; a content-neutral confetti JSON ships at `apps/alphaTiles/assets/lottie/celebration.json` and is passed in by `<GameShellContainer>`. This ports `Celebration.java` (50 LOC) and `celebration.xml`.

Props contract:

```ts
type CelebrationProps = {
  animationSource: LottieSource;  // from lottie-react-native
  onBackPress: () => void;
  backLabel: string;              // pre-translated
};
```

#### Scenario: Animation plays on mount

- **WHEN** `<Celebration>` mounts
- **THEN** the Lottie animation starts immediately with `autoPlay` and does not loop (`loop={false}`, matching a one-shot celebration)

#### Scenario: Back button overlaid

- **WHEN** `<Celebration>` renders
- **THEN** a tappable "back to earth" control is visible near the bottom with `accessibilityLabel={backLabel}`

### Requirement: Hardware back disabled during celebration

The component SHALL intercept Android hardware-back presses and consume them while mounted (matches `Celebration.java:25–30` where the `OnBackPressedCallback.handleOnBackPressed` body is "intentionally empty"). Users MUST use the in-app back button, not the hardware back.

#### Scenario: Hardware back suppressed

- **WHEN** `<Celebration>` is mounted and the user presses hardware-back
- **THEN** the navigation event is consumed; the app stays on the celebration screen

#### Scenario: In-app back button

- **WHEN** the user taps the in-app back button on the celebration
- **THEN** `onBackPress` is invoked (the parent container handles the navigation target)

### Requirement: Correct-final sound plays on mount

`<Celebration>` SHALL invoke the audio system's `playCorrectFinal()` function once on mount. The component MUST NOT reach into the audio library directly — it accepts a `onMount?: () => void` prop (or an audio-service passed via container) so the container is the single entry point to `data-audio`. This matches `Celebration.java:38` but keeps `ui-celebration` free of `data-audio` imports to preserve `type:ui` purity.

#### Scenario: Mount-time sound

- **WHEN** `<GameShellContainer>` mounts `<Celebration onMount={() => useAudio().playCorrectFinal()} …/>`
- **THEN** the correct-final sound plays once on mount

#### Scenario: `type:ui` purity

- **WHEN** `nx graph` inspects `ui-celebration`
- **THEN** no edge exists to `data-audio` or any `type:data-access` library

### Requirement: Celebration timing preserves Android behavior

When triggered by the shell's `after12CheckedTrackers === 3` branch, `<Celebration>` SHALL be mounted for approximately 1800ms after the correct-final sound starts, then the shell navigates to the next uncompleted game approximately 4500ms after the trigger (both timings from `GameActivity.java:342, 412`).

#### Scenario: Celebration duration

- **WHEN** the shell triggers celebration at wall-clock `t0`
- **THEN** `<Celebration>` is mounted from approximately `t0 + correctSoundDuration` to `t0 + correctSoundDuration + 1800ms` (render lifecycle only; animation JSON is ~2.5s)

#### Scenario: Next-game navigation timing

- **WHEN** the shell triggers celebration at `t0`
- **THEN** the `router.push` to the next uncompleted game fires at approximately `t0 + 4500ms`

#### Scenario: Unmount cleans up timers

- **WHEN** the user navigates away before celebration completes (via the in-app back button)
- **THEN** the pending `setTimeout` for next-game navigation is cleared and does not fire

### Requirement: Bundled animation asset

This change SHALL commit one Lottie JSON file at `apps/alphaTiles/assets/lottie/celebration.json`. The asset MUST be content-neutral (confetti, stars, abstract shapes) so it can be shared across all language packs. Language packs MUST NOT override it; per-pack celebration is out of scope for v1.

#### Scenario: Single shared asset

- **WHEN** a fresh checkout is inspected
- **THEN** exactly one `celebration.json` file exists under `apps/alphaTiles/assets/lottie/`

#### Scenario: Pack cannot override

- **WHEN** a language pack provides `images/celebration.json` (hypothetical)
- **THEN** the rsync step does not copy it; the bundled asset is always used

### Requirement: Storybook documentation

The library SHALL ship a Storybook story that renders the celebration screen with the shared JSON loaded and a fake back handler.

#### Scenario: Story available

- **WHEN** Storybook launches
- **THEN** a `ui-celebration` story appears and renders the Lottie animation on a blank background

