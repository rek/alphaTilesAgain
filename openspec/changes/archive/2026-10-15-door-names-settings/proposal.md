## Why

Issues [#37](https://github.com/rek/alphaTilesAgain/issues/37) + [#44](https://github.com/rek/alphaTilesAgain/issues/44) (yue release). Menu doors are unlabelled coloured squares; decision taken to label them with game names, and to add a settings screen whose first entry hides the names again (younger learners use colour recognition). `data-players` has no per-player preferences, and pack settings are read by English label at ~20 call sites, so the toggle has no home.

Also fixes: next-game search can enter a hidden (disabled) Taiwan door.

## What Changes

- **Pack**: optional 9th column `GameName` in `aa_games.txt` (Java AlphaTiles has no name source; it reads columns 0–7 only, so a trailing column stays Java-compatible). Empty / absent → unlabelled door.
- **Parser**: `parseGames` row gains `gameName` (`''` when absent). Header with `GameName` → 9 columns; 8-cell rows still accepted.
- **Validator**: `checkGameStructure` warns on names longer than 12 characters, info when only some doors are named. `Show game names` added to known boolean settings.
- **Door catalogue**: `Door.name?: string`.
- **Menu**: renders the name under the door number when present and `showGameNames` is on; a11y label includes it.
- **Preferences**: new `usePlayerPreferencesStore` in `data-players` (persisted, keyed by player id; cleared on deletePlayer).
- **Effective settings**: new `@alphaTiles/data-settings` — `effectiveSettingsOf({ settings, preferences })` + `useEffectiveSettings()` / `useSetPreference()`. Pack default + player override, typed, labels in one place.
- **Settings screen**: new `@alphaTiles/feature-settings` (container/presenter), route `/settings`, menu tab. First entry: "Show game names on doors" (default on).
- **Next game**: `findNextUncompletedGame` skips doors with `enabled: false`.
- **Content**: yue names left empty (awaiting customer); `docs/translations/yue-game-names.md` template.

## Capabilities

### New Capabilities
- `door-names`: game name column, parser/validator, Door.name, menu labels.
- `settings`: player preferences, effective settings lookup, settings screen.

## Impact

- Libs: util-lang-pack-parser, util-lang-pack-validator, data-doors, data-players, data-settings (new), feature-game-menu, feature-game-shell, feature-settings (new); app route `settings.tsx`.
- Locales: en.json + zh-HK.json (+ review sheet).
- Packs: yue `aa_games.txt` gains an empty `GameName` column; eng untouched.
