## ADDED Requirements

### Requirement: Persisted player identity with UUID primary key

The app SHALL model each learner profile as a `Player` record with a generated UUID `id`, a `name` (1–20 Unicode characters), an `avatarIndex` (0-based, `[0, numberOfAvatars)`), a `createdAt` timestamp (epoch millis), and a nullable `lastPlayedAt` timestamp. Records MUST persist across launches via Zustand `persist` with storage key `alphatiles:players-v1`.

#### Scenario: Create then restart

- **WHEN** a learner creates a player `{ name: "Ada", avatarIndex: 3 }`
- **AND** the app is closed and relaunched
- **THEN** `usePlayersStore.getState().players` contains one record with that name and avatar index
- **AND** the record's `id` is the same UUID produced at creation time

#### Scenario: Hydration gate

- **WHEN** the app has just launched and `usePlayersStore.persist.hasHydrated()` returns `false`
- **THEN** the loading screen does not advance past its players-hydration gate

#### Scenario: Store version tag

- **WHEN** the persisted blob is read
- **THEN** it carries `version: 1` so future migrations can transform older blobs

### Requirement: Choose-player grid reflects persisted players and pack avatar count

`/choose-player` SHALL render one card per existing player plus one "add player" affordance, up to the visual ceiling set by `aa_settings.txt` `"Number of avatars"` (clamped to `[1, 12]`). The heading SHALL display the pack's `aa_langinfo.txt` `"NAME in local language"` value.

#### Scenario: First launch

- **WHEN** `players` is empty on first launch
- **THEN** the grid renders only the "add player" slot and a heading reading the `"NAME in local language"` value

#### Scenario: Returning launch with players

- **WHEN** `players` has 3 records and the pack declares `"Number of avatars" = 6`
- **THEN** the grid renders the 3 player cards + 1 "add player" slot + 2 empty slots (visually disabled)

#### Scenario: Pack with `"Number of avatars" > 12`

- **WHEN** `aa_settings.txt` declares `"Number of avatars" = 16`
- **THEN** the grid clamps to 12 visible slots and does not crash

#### Scenario: Custom local name

- **WHEN** `aa_langinfo.txt` has `"NAME in local language" = Ùmè`
- **THEN** the heading on `/choose-player` reads "Ùmè"

### Requirement: Avatar picker in set-player-name

`/set-player-name` SHALL render an avatar grid allowing the learner to pick an `avatarIndex` before or alongside typing a name. Picked avatar MUST be visually highlighted. Avatars already assigned to other players MAY be dimmed but MUST NOT be blocked — multiple players may share an avatar.

#### Scenario: Pick avatar

- **WHEN** the learner taps avatar index 5
- **THEN** avatar 5 is highlighted and subsequent name submission creates a player with `avatarIndex: 5`

#### Scenario: Pick already-used avatar

- **WHEN** player A has `avatarIndex: 3` and a new player picks avatar 3
- **THEN** creation succeeds and both players now have `avatarIndex: 3`

### Requirement: Custom keyboard from `aa_keyboard.txt`

When the loaded `keyList` (parsed from `aa_keyboard.txt`) has at least one entry, `/set-player-name` SHALL render the `ui-custom-keyboard` instead of a system `TextInput`. The keyboard SHALL render keys as color-tinted tappable tiles (color from `aa_colors.txt` indexed by each key's color field). Keyboards with more than 35 keys SHALL paginate at 33 keys per page with forward/backward navigation keys in the last two slots.

#### Scenario: Key tap appends character

- **WHEN** `keyList` contains `{ text: "ñ", color: "0" }`
- **AND** the learner taps that key
- **THEN** the name field value gains the character "ñ" appended at the end

#### Scenario: Backspace removes last character

- **WHEN** the name field value is "Ada" and the learner taps the delete key
- **THEN** the name field value becomes "Ad"

#### Scenario: Pagination on large keyboard

- **WHEN** `keyList.length = 60` (two pages)
- **THEN** the keyboard renders 33 keys on page 1 with a forward arrow in the last slot
- **AND** tapping the forward arrow shows the next 27 keys on page 2 with a back arrow

#### Scenario: Empty `aa_keyboard.txt` falls back to TextInput

- **WHEN** `keyList` is empty
- **THEN** `/set-player-name` renders a native `TextInput` for name entry instead of the custom keyboard
- **AND** the name submission flow is otherwise identical

### Requirement: Name validation on submit

Name submission SHALL reject empty names (after trim), names longer than 20 Unicode characters, and names that exactly match another existing player's name. Rejection MUST surface an inline error message below the name field and keep the learner on `/set-player-name`.

#### Scenario: Empty name

- **WHEN** the learner submits an empty (or whitespace-only) name
- **THEN** the screen displays the `chrome:players.validation.too_short` error and does not create a player

#### Scenario: Over-long name

- **WHEN** the learner attempts to enter a 21st character
- **THEN** the character is not appended (custom keyboard) or the `TextInput` hits its `maxLength` cap

#### Scenario: Duplicate name

- **WHEN** a player already exists with name "Ada" and a new player submits "Ada"
- **THEN** the screen displays the `chrome:players.validation.duplicate` error and does not create a player

#### Scenario: Rename to own name

- **WHEN** the learner is editing an existing player named "Ada" and submits "Ada" unchanged
- **THEN** the submission succeeds (self-collision excluded from duplicate check)

### Requirement: Player selection sets active player and routes to menu

Selecting a player card on `/choose-player` SHALL set `activePlayerId` to that player's id and navigate to `/menu`. A freshly-created player SHALL be auto-selected.

#### Scenario: Pick existing player

- **WHEN** the learner taps an existing player card
- **THEN** `activePlayerId` equals that player's id
- **AND** the app routes to `/menu`

#### Scenario: Create then auto-select

- **WHEN** the learner submits a valid name from `/set-player-name` in create mode
- **THEN** the new player is persisted, `activePlayerId` equals its id, and the app routes to `/menu`

#### Scenario: `lastPlayedAt` updates

- **WHEN** `selectPlayer(id)` runs
- **THEN** that player's `lastPlayedAt` is set to `Date.now()`

### Requirement: Player deletion via inline tap-to-confirm

A long-press on a player card SHALL reveal a delete affordance (trash icon). Tapping the trash icon SHALL transition the card to a confirm-delete state; a second tap on the confirm icon SHALL remove the player from the store. Tapping elsewhere SHALL cancel the confirm state without deleting.

#### Scenario: Two-tap confirm

- **WHEN** the learner long-presses a player card, then taps the trash icon, then taps the confirm icon
- **THEN** the player is removed from `players`
- **AND** if that player was the `activePlayerId`, `activePlayerId` is cleared to null

#### Scenario: Tap elsewhere cancels

- **WHEN** the learner is in confirm-delete state for player A and taps player B
- **THEN** the confirm state on A clears without deleting A
- **AND** player B is selected (normal selection flow)

#### Scenario: Deleting active player

- **WHEN** `activePlayerId` is A and `deletePlayer(A)` is called
- **THEN** `activePlayerId` becomes null

### Requirement: Entry-route derivation from active player

The app's entry logic (after loading screen completes) SHALL route to `/menu` if `activePlayerId` is non-null and matches an existing player, else to `/choose-player`. This decision MUST read current store state synchronously — no `useEffect` sync layer.

#### Scenario: Resume with active player

- **WHEN** the app finishes loading and `activePlayerId = <valid id>`
- **THEN** the initial screen is `/menu`

#### Scenario: Resume without active player

- **WHEN** `activePlayerId` is null (first launch or post-delete)
- **THEN** the initial screen is `/choose-player`

#### Scenario: Stale active id

- **WHEN** `activePlayerId` points to an id not present in `players` (corruption)
- **THEN** the router falls through to `/choose-player` and the stale id is cleared

### Requirement: UI libraries are i18n-blind

`libs/shared/ui-avatar-grid`, `libs/shared/ui-player-card`, and `libs/shared/ui-custom-keyboard` SHALL NOT import `react-i18next`. All display strings and accessibility labels MUST be passed in as props by the container.

#### Scenario: UI lib import graph

- **WHEN** `nx graph` inspects any of `ui-avatar-grid`, `ui-player-card`, `ui-custom-keyboard`
- **THEN** none of them list `react-i18next` as a dependency

#### Scenario: Container passes a11y labels

- **WHEN** `ChoosePlayerContainer` renders `UiAvatarGrid`
- **THEN** it passes `addLabel={t('chrome:players.add')}`, `deleteLabel={t('chrome:players.a11y.delete')}`, etc.

### Requirement: Library boundary and dependency rules

- `libs/alphaTiles/data-players` SHALL be `type:data-access`, `scope:alphaTiles`. Its only dependencies SHALL be `zustand`, `@react-native-async-storage/async-storage`, and types-only imports.
- `libs/alphaTiles/feature-choose-player` SHALL be `type:feature`, `scope:alphaTiles`. It MAY depend on `data-players`, `data-language-assets`, `util-i18n`, `util-theme`, `util-analytics`, `ui-avatar-grid`, `ui-player-card`, `expo-router`.
- `libs/alphaTiles/feature-set-player-name` SHALL be `type:feature`, `scope:alphaTiles`. It MAY depend on the same plus `ui-custom-keyboard` (not `ui-avatar-grid` unless the presenter reuses it for the picker).
- `libs/shared/ui-*` SHALL be `type:ui`, `scope:shared`. Each MAY depend only on `type:util` libraries and `react-native`.

#### Scenario: No ui→feature dependency

- **WHEN** ESLint runs `@nx/enforce-module-boundaries`
- **THEN** it flags any import of a `type:feature` library from any `ui-*` library
