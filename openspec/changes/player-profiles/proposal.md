## Why

The Java source boots directly into `ChoosePlayer` — a 12-avatar grid that lets learners pick their profile — and `SetPlayerName` — a name-entry screen with a pack-specific custom keyboard. These two screens gate every downstream game: no gameplay screen reads pack assets before a player is selected, because the per-player `trackerCount` / score / last-played-game state keys off the active `playerNumber`. The port needs a replacement for Android's `SharedPreferences.putString("storedName<N>", …)` keyed-by-slot model (which can't grow past 12 and mixes naming with slot identity) and a first-class home for the `aa_keyboard.txt` custom input surface, so that every future change (game engine, game menu, progress tracking) can call `useActivePlayer()` and trust the result.

## What Changes

- Add `libs/alphaTiles/data-players` (type:data-access) — a persisted Zustand store owning `players: Player[]`, `activePlayerId: string | null`, and actions `createPlayer`, `renamePlayer`, `deletePlayer`, `selectPlayer`. Persist key `alphatiles:players-v1`, driver is the shared `rnStorage` from ADR-005.
- Add `libs/alphaTiles/feature-choose-player` (type:feature) — container + presenter for the avatar grid. Container owns `useRouter`, `useTranslation`, and the store hook. Presenter is pure props → JSX.
- Add `libs/alphaTiles/feature-set-player-name` (type:feature) — container + presenter for the name-entry surface. Presenter renders the avatar, the name field, and the custom or system keyboard. Submit routes to `/menu`.
- Add `libs/shared/ui-avatar-grid`, `libs/shared/ui-player-card`, `libs/shared/ui-custom-keyboard` — presentational libs with no i18n dependency. Accept pre-translated strings and pre-resolved avatar image sources as props.
- Add Expo-Router routes `apps/alphaTiles/app/choose-player.tsx` and `apps/alphaTiles/app/set-player-name.tsx` — thin re-exports of the containers.
- Add chrome i18n keys under `apps/alphaTiles/locales/en.json` — `chrome:players.heading`, `chrome:players.add`, `chrome:players.delete_confirm`, `chrome:players.name_placeholder`, `chrome:players.name_submit`, `chrome:players.a11y.avatar`, `chrome:players.a11y.delete`, `chrome:players.a11y.keyboard_delete`, `chrome:players.a11y.keyboard_next`, `chrome:players.a11y.keyboard_prev`, `chrome:players.validation.too_short`, `chrome:players.validation.too_long`, `chrome:players.validation.duplicate`.

## Capabilities

### New Capabilities

- `player-profiles`: the full lifecycle of a learner profile — creation, selection, renaming, deletion, persistence across launches — plus the custom-keyboard input surface that the name-entry screen consumes.

### Modified Capabilities

_None_ — this change introduces the player-profile concept from scratch. The Java `ChoosePlayer` + `SetPlayerName` behavior has no prior OpenSpec capability record; `port-foundations` and downstream changes depend on this one without contradicting anything pre-existing.

## Impact

- **New libs**: `libs/alphaTiles/data-players`, `libs/alphaTiles/feature-choose-player`, `libs/alphaTiles/feature-set-player-name`, `libs/shared/ui-avatar-grid`, `libs/shared/ui-player-card`, `libs/shared/ui-custom-keyboard`.
- **New app routes**: `apps/alphaTiles/app/choose-player.tsx`, `apps/alphaTiles/app/set-player-name.tsx`.
- **New dependencies at workspace root**: `zustand` (pinned), `@react-native-async-storage/async-storage` (Expo-managed SDK version).
- **Chrome i18n additions**: keys under `chrome:players.*` in `apps/alphaTiles/locales/en.json`.
- **Storage footprint**: one AsyncStorage blob under key `alphatiles:players-v1`, sub-kilobyte per player (up to ~60 bytes × N players).
- **Consumed by**: `game-menu` (reads `activePlayerId` for trackerCount-keying), `game-engine-base` (reads `activePlayerId` for per-player progress), `loading-screen` (gates boot-complete on `persist.hasHydrated()` for this store).
- **No breaking changes** — no prior change persisted player data; `loading-screen` and `game-menu` proposal docs reference this change as a dependency.

## Out of Scope

- Per-player score / trackerCount storage — that lives in the `data-progress` store spec'd by `game-engine-base`. This change stores only the player identity; game state keys off `activePlayerId`.
- `aa_settings.txt "Days until expiration"` expiration-dialog behavior from `ChoosePlayer.java` lines 195–244 — deferred to a dedicated `app-expiration` change if we decide to keep that feature at all.
- Analytics beacons (`identify(playerId)`, `screen('ChoosePlayer')`) — wired via the `util-analytics` no-op adapter already spec'd by `analytics-abstraction`; this change merely calls `track()` / `identify()` at the agreed events.
- Audio instructions button (`zzz_choose_player`, `zzz_set_player_name`) — audio playback is owned by `audio-system` / `data-audio`; this change invokes the existing player API and renders the button if the pack ships the instruction file.
