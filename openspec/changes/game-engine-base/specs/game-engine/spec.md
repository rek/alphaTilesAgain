## ADDED Requirements

### Requirement: Shell container hosts any mechanic via children slot

A `<GameShellContainer>` SHALL provide the shared game lifecycle — score + tracker rendering, audio replay, back navigation, pause-on-background, stage resolution, celebration trigger, and player-progress persistence — for every concrete game mechanic. Concrete mechanics (e.g. China, Chile) SHALL compose their board as `children` of the shell and MUST NOT re-implement score, tracker, audio-replay, or persistence plumbing.

#### Scenario: Mechanic slotted as children

- **WHEN** a concrete game feature renders `<GameShellContainer>{<ChinaBoard />}</GameShellContainer>`
- **THEN** the score bar, 12 tracker icons, back button, instructions button, audio-replay button, and advance arrow render around `<ChinaBoard />` and the mechanic has access to `useGameShell()` for score/tracker mutations

#### Scenario: Mechanic omits an optional shell piece

- **WHEN** a mechanic passes `showInstructionsButton={false}`
- **THEN** the instructions button is hidden but every other shell piece renders (mirrors `GameActivity.hideInstructionAudioImage`)

### Requirement: Route params drive shell configuration

The shell SHALL read its per-game configuration (`country`, `challengeLevel`, `stage`, `syllableGame`, `gameNumber`, `playerId`) from `expo-router`'s route params. It MUST NOT require these as explicit props when mounted as a screen. Extracting them from Android `Intent.getIntExtra` (e.g. `GameActivity.java:163–171`) moves to the route-param hook.

#### Scenario: Mounted from game menu with route params

- **WHEN** the user taps game door 88 (China) from Earth, producing a route `/game?gameNumber=88&challengeLevel=1&stage=1&syllableGame=&country=China`
- **THEN** the shell resolves these values via `useLocalSearchParams` and passes them into `useProgressStore`, `useAudio`, and the mechanic's `useGameShell()` context

#### Scenario: Missing route params

- **WHEN** the shell mounts without `gameNumber` in the route
- **THEN** it renders an error state with a link back to the game menu, not a blank screen

### Requirement: Audio-replay button plays the active reference word

The shell SHALL expose a prominent audio-replay button that, when pressed, plays the current `refWord` using `useAudio().playWord`. While audio is playing, both the replay button and the mechanic's game buttons MUST be locked against further input; they SHALL re-enable on `onComplete`. This mirrors `GameActivity.playActiveWordClip`'s lock/unlock around `mediaPlayerIsPlaying`.

#### Scenario: Replay during silence

- **WHEN** no audio is playing and the user taps the replay button
- **THEN** `useAudio().playWord(refWord)` fires, game buttons lock, and they unlock on completion

#### Scenario: Replay during playback

- **WHEN** audio is already playing and the user taps the replay button
- **THEN** the tap is ignored (no overlap, no queue)

### Requirement: Back navigation routes to Earth

Pressing the on-screen back button OR the Android hardware-back button SHALL navigate to the game menu (`/earth`) via `expo-router`. This mirrors `GameActivity.goBackToEarth` and the `OnBackPressedCallback` installed in `GameActivity.onCreate`.

#### Scenario: Hardware back during gameplay

- **WHEN** the user presses the Android hardware-back button with no audio playing
- **THEN** the app navigates to `/earth`, preserving route-carried state (e.g. `globalPoints`)

#### Scenario: Back while audio is playing

- **WHEN** the user presses back while audio is playing (`useAudio().isPlaying === true`)
- **THEN** the tap is ignored (mirrors `GameActivity.goBackToChoosePlayer` lines 229–231)

#### Scenario: Confirm-on-back opted in by mechanic

- **WHEN** a mechanic passes `confirmOnBack={true}` to the shell and the user taps back
- **THEN** a confirm dialog appears ("Leave game and lose progress?") and the navigation is gated on confirmation

### Requirement: Pause audio on app background

The shell SHALL listen to `AppState` changes and call `useAudio().pauseAll()` when the app transitions to `'background'`, and resume (or allow next-play) when it transitions back to `'active'`. This replaces Android's implicit `MediaPlayer` pause-on-pause behavior.

#### Scenario: App backgrounded mid-playback

- **WHEN** the app enters `'background'` while a word audio is playing
- **THEN** `useAudio().pauseAll()` fires and playback stops

#### Scenario: App foregrounded

- **WHEN** the app returns to `'active'`
- **THEN** the shell does not auto-resume the paused clip (matches Android — the user will tap replay if they want to hear it again)

### Requirement: Celebration triggers on 12-tracker boundary

When `trackerCount % 12 === 0` and `trackerCount > 0` and `after12CheckedTrackers === 3`, the shell SHALL render `<Celebration>` for approximately 1800ms (after the correct-final sound completes), then navigate to the next uncompleted game approximately 4500ms after the boundary was crossed. Both timings preserve `GameActivity.java:342` and `:412`.

#### Scenario: Crossing the 12-tracker boundary

- **WHEN** a correct answer brings `trackerCount` to 12 and the language pack has `after12CheckedTrackers = 3`
- **THEN** after `correctSoundDuration + 1800ms` the shell mounts `<Celebration>`; after `4500ms` total, the shell navigates to the next game in `gameList` that has `hasChecked12Trackers === false`

#### Scenario: `after12CheckedTrackers === 2`

- **WHEN** the same boundary is crossed but the setting is `2`
- **THEN** the shell navigates directly to `/earth` after `correctSoundDuration` ms — no `<Celebration>`

#### Scenario: `after12CheckedTrackers === 1`

- **WHEN** the same boundary is crossed but the setting is `1`
- **THEN** the shell does nothing — the player continues in the same game

#### Scenario: All games completed

- **WHEN** the search for a next-uncompleted-game in `gameList` finds none (every game has `checked12Trackers === true`)
- **THEN** the shell navigates to `/earth`

### Requirement: Shell separates container from presenter

`<GameShellContainer>` SHALL own all hooks, data-access, and i18n calls. `<GameShellScreen>` SHALL be a pure props→JSX presenter with no hook imports and no `useTranslation` import. This matches the repo-wide container/presenter rule in `docs/ARCHITECTURE.md §3`.

#### Scenario: Presenter import audit

- **WHEN** `grep -r "useTranslation\|useProgressStore\|useAudio\|useLocalSearchParams" GameShellScreen.tsx` runs
- **THEN** zero matches are found

#### Scenario: Presenter in Storybook

- **WHEN** `<GameShellScreen>` is rendered in Storybook with hand-crafted props (no providers)
- **THEN** it renders correctly without crashing on a missing Context
