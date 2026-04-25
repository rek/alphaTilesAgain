## ADDED Requirements

### Requirement: Gate visible on web before first gesture

`ui-web-audio-unlock-gate` SHALL render a full-screen overlay with a "Tap to start" prompt when mounted on web and no user gesture has yet occurred. The overlay SHALL be positioned above all game content so no game interaction is possible before unlock.

#### Scenario: Gate renders on initial web load

- **GIVEN** the app is running in a browser (web platform)
- **AND** no touch or click event has occurred since load
- **WHEN** the root layout renders
- **THEN** the `<WebAudioUnlockGate>` overlay is visible
- **AND** the "Tap to start" label is displayed
- **AND** game content beneath the overlay is not interactable

### Requirement: Gate dismissed and AudioContext resumed after first gesture

After the first user touch or click, `<WebAudioUnlockGate>` SHALL hide the overlay, call `resumeAudioContext()`, and render only `children` for the remainder of the session.

#### Scenario: Tap dismisses gate and resumes audio

- **GIVEN** the gate overlay is visible
- **WHEN** the user taps or clicks anywhere on the overlay
- **THEN** the overlay is removed from the render tree
- **AND** `resumeAudioContext()` has been called
- **AND** `AudioContext.prototype.resume` has been invoked (web only)
- **AND** subsequent calls to `useAudio()` play sounds without error

### Requirement: Analytics event fired on unlock with millisecondsSinceBoot

When the gate is dismissed, the container SHALL call `track({ type: 'audio_unlock_web', props: { millisecondsSinceBoot } })` exactly once, where `millisecondsSinceBoot` is the elapsed time in milliseconds from app start to the gesture.

#### Scenario: Analytics fired once on unlock

- **GIVEN** the gate overlay is visible
- **WHEN** the user taps the overlay
- **THEN** `track` is called exactly once
- **AND** the event type is `'audio_unlock_web'`
- **AND** the `millisecondsSinceBoot` prop is a non-negative number

#### Scenario: Analytics not fired on subsequent renders

- **GIVEN** the gate has already been dismissed
- **WHEN** the root layout re-renders
- **THEN** `track` is NOT called again

### Requirement: Gate never renders on native platforms

On iOS and Android, `<WebAudioUnlockGate>` SHALL never be mounted or rendered. Native audio SHALL play without any unlock step.

#### Scenario: Native layout has no gate

- **GIVEN** the app is running on iOS or Android
- **WHEN** the root layout renders
- **THEN** no `<WebAudioUnlockGate>` component is in the render tree
- **AND** `<Slot />` renders directly without an overlay wrapper

### Requirement: PWA manifest served at /manifest.json with required fields

`apps/alphaTiles/public/manifest.json` SHALL be served at `/manifest.json` in the web build. The manifest SHALL contain all required fields per design D4.

#### Scenario: Manifest present and well-formed

- **GIVEN** the app has been exported as a static web build
- **WHEN** a browser fetches `/manifest.json`
- **THEN** the response status is 200
- **AND** `Content-Type` is `application/json`
- **AND** the body contains `name`, `short_name`, `start_url`, `display`, `theme_color`, `background_color`, and `icons`
- **AND** `display` equals `"standalone"`
- **AND** `icons` contains at least one entry with `sizes` `"192x192"` and one with `sizes` `"512x512"`

### Requirement: ui-door-grid lays out within narrow viewport

`ui-door-grid` SHALL NOT overflow its parent container horizontally at viewport widths as narrow as 320px. Tiles SHALL wrap to additional rows if they do not fit on one row.

#### Scenario: Door grid wraps tiles at 320px

- **GIVEN** the device or browser viewport width is 320px
- **AND** the door grid contains more tiles than fit in one row at that width
- **WHEN** the component renders
- **THEN** no tile overflows the horizontal bounds of the grid container
- **AND** tiles wrap to additional rows rather than being clipped or hidden

### Requirement: ui-score-bar adapts height on narrow viewports

`ui-score-bar` SHALL never collapse to zero height on web, regardless of parent container height. It SHALL use `minHeight` rather than a fixed `height` so content is always visible.

#### Scenario: Score bar visible at 320px viewport

- **GIVEN** the device or browser viewport width is 320px
- **AND** `ui-score-bar` is rendered within a game screen
- **WHEN** the component renders
- **THEN** the rendered height of `ui-score-bar` is greater than zero
- **AND** score text and any icons within the bar are visible and not clipped

### Requirement: No shared lib references Platform.OS for web detection

No file under `libs/` SHALL contain the string `Platform.OS === 'web'` or `Platform.OS == 'web'`. Web-specific behavior in shared libs SHALL use capability checks (e.g. `typeof AudioContext !== 'undefined'`).

#### Scenario: Codebase grep finds no Platform.OS web guards in libs

- **GIVEN** the change has been fully implemented
- **WHEN** `grep -r "Platform.OS === 'web'" libs/` is run in the repo root
- **THEN** the command returns no matches
