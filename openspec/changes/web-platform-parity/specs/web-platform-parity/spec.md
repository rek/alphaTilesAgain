## ADDED Requirements

### Requirement: Gate visible on web before first gesture

`AudioGate` (`@alphaTiles/data-audio`) SHALL wrap every route in the root layout. On web, until the first gesture after audio preload settles, it SHALL render only its locked surface (`renderLocked`, a "Tap to start" prompt from feature-loading `TapToBegin`, presenter `ui-web-audio-unlock-gate`) and never its children, so no game interaction or auto-play happens before unlock. Cold start, reload and deep link are gated the same way.

#### Scenario: Gate renders on initial web load

- **GIVEN** the app is running in a browser (web platform)
- **AND** no touch or click event has occurred since load
- **WHEN** the root layout renders any route
- **THEN** the locked "Tap to start" surface is displayed
- **AND** the route's screen is not rendered

#### Scenario: Tap before preload settles is ignored

- **GIVEN** the gate is locked and audio preload has not settled
- **WHEN** the user taps the prompt
- **THEN** the gate stays locked (the tap could not prime clips that are not loaded yet)

### Requirement: Gate unlocks and primes audio on first gesture

After the first tap once preload has settled, `AudioGate` SHALL, inside the press handler, prime every loaded clip in chunks (`primeAudioHandles`; Safari only unlocks elements primed in the gesture) and then render only `children` for the rest of the session.

#### Scenario: Tap unlocks gate and primes audio

- **GIVEN** the gate is locked and preload has settled
- **WHEN** the user taps the prompt
- **THEN** every loaded clip is primed in chunks
- **AND** the locked surface is replaced by the route's screen
- **AND** subsequent `useAudio()` / pack speech calls play sounds without error

### Requirement: Analytics event fired on unlock with millisecondsSinceBoot

When the gate unlocks, it SHALL call `track({ type: 'audio_unlock_web', props: { millisecondsSinceBoot } })` exactly once, where `millisecondsSinceBoot` is the elapsed time in milliseconds from app start to the gesture.

#### Scenario: Analytics fired once on unlock

- **GIVEN** the gate is locked
- **WHEN** the user taps the prompt after preload
- **THEN** `track` is called exactly once
- **AND** the event type is `'audio_unlock_web'`
- **AND** the `millisecondsSinceBoot` prop is a non-negative number

#### Scenario: Analytics not fired on subsequent renders

- **GIVEN** the gate has already unlocked
- **WHEN** the root layout re-renders
- **THEN** `track` is NOT called again

### Requirement: Gate never locks on native platforms

On iOS and Android, `AudioGate` SHALL pass `children` through immediately and never render the locked surface. Native audio SHALL play without any unlock step.

#### Scenario: Native layout has no gate

- **GIVEN** the app is running on iOS or Android
- **WHEN** the root layout renders
- **THEN** the route's screen renders directly, with no "Tap to start" surface

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
