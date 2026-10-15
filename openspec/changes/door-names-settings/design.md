# Design — door-names-settings

## D1. Name source: trailing `GameName` column in aa_games.txt

Java AlphaTiles (`Start.java` `Game`, 8 fields) has no game names; the menu (`Earth.java`) shows numbers only. Options: (a) new column, (b) companion `aa_game_names.txt`. Chose (a): one row = one door, no join key to drift when doors are reordered; a trailing column is ignored by the Java app (reads `thisLineArray[0..7]`). Column is optional: a header without `GameName` parses as before.

## D2. Door.name

`doorsOf` sets `name` to the trimmed cell or `undefined`. Pack content (language of play), not i18n chrome; passed to the presenter as a plain string.

## D3. Player preferences store (data-players)

`usePlayerPreferencesStore` — zustand persist `alphatiles:player-preferences-v1`, `{ byPlayer: Record<playerId, PlayerPreferences> }`, `setPreference(playerId, patch)`, `clearPlayer(playerId)`. Preferences are sparse: an unset field means "use the pack default". `deletePlayer` clears the player's entry.

## D4. Effective settings (data-settings) — the one lookup

```ts
effectiveSettingsOf({ settings, preferences }) → {
  showGameNames, changeArrowColors, hasTileAudio, hasSyllableAudio,
  afterTwelveCheckedTrackers, numberOfAvatars, hidePrivacyPolicy,
}
useEffectiveSettings()   // pack + active player's prefs
useSetPreference()       // (patch) => void for the active player
```

Pack labels + defaults live only here. Player prefs override only player-overridable fields (`showGameNames`). Pack default for `showGameNames` = `Show game names` setting, default TRUE. Game-specific settings (Chile, Italy, Mexico…) stay local. First consumers: menu (`showGameNames`), shell (`changeArrowColors`); other cross-cutting call sites migrate opportunistically.

## D5. Settings screen

`feature-settings`: `SettingsContainer` (hooks, i18n, router) → `SettingsScreen` (pure). Route `/settings`; entry = menu tab bar "Settings". No active player → redirect `/choose-player`.

## D6. Next-door search

`findNextUncompletedGame` skips `!door.enabled` (Taiwan without stroke data / disabled by setting).

## Open questions
- Cantonese names (customer).
- Should names also show in the game shell header? (Not in scope.)
