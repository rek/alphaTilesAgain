## Why

The Java `Earth` activity is the home screen for a selected player — a grid of numbered "doors," one per row of `aa_games.txt`, that routes into the mechanic class for the chosen door. It is the first screen with per-player state: each door's color and visual style reflects that player's `trackerCount` (in-process vs. mastery). Without a port of this surface, the player-profiles flow has nowhere to land and the game-engine has no entry point. The Android implementation packs door rendering, pagination, player-bar chrome (avatar + name + score), utility-icon routing (About, Share, Resources), and audio-instructions button into one 400-line class. The port extracts each concern into its own lib so that the game menu remains a thin composition.

## What Changes

- Add `libs/alphaTiles/feature-game-menu` (type:feature) — `GameMenuContainer` + `GameMenuScreen`. Container owns `useLangAssets`, `useActivePlayer`, `useRouter`, `useTranslation`, and (forward-referenced) `useTrackerCounts`. Presenter is pure props → JSX.
- Add `libs/shared/ui-door-grid` (type:ui, scope:shared) — renders a grid of `UiDoor` components with pagination chrome (prev / next arrows).
- Add `libs/shared/ui-door` (type:ui, scope:shared) — a single door: numeric label, tint color, visual style (`not-started` | `in-process` | `mastery`), SVG asset shared across packs.
- Add `apps/alphaTiles/assets/images/door.svg` — the shared door background SVG (tintable via fill color).
- Add Expo-Router route `apps/alphaTiles/app/menu.tsx` — re-exports `GameMenuContainer`.
- Add chrome i18n keys: `chrome:menu.a11y.door`, `chrome:menu.a11y.prev`, `chrome:menu.a11y.next`, `chrome:menu.a11y.back_to_players`, `chrome:menu.a11y.about`, `chrome:menu.a11y.share`, `chrome:menu.a11y.resources`, `chrome:menu.score`.
- Declare `data-progress` (spec'd fully by `game-engine-base`) as a forward-reference dependency: `feature-game-menu` imports the hook but handles the "not yet implemented" case gracefully — all doors render as `not-started`.

## Capabilities

### New Capabilities

- `game-menu`: the door-grid home screen that a selected player lands on. Owns door rendering rules, pagination, player-bar chrome composition, utility-icon routing, and back-to-player-selection navigation.

### Modified Capabilities

_None_ — no prior change has owned door / menu rendering. `player-profiles` routes into `/menu` but does not define what `/menu` renders. `game-engine-base` will consume this change's exported door-press handler contract without modifying it.

## Impact

- **New libs**: `libs/alphaTiles/feature-game-menu`, `libs/shared/ui-door-grid`, `libs/shared/ui-door`.
- **New app route**: `apps/alphaTiles/app/menu.tsx`.
- **New shared asset**: `apps/alphaTiles/assets/images/door.svg`.
- **New dependencies**: `react-native-svg` (if not already present — needed for door SVG tinting).
- **New chrome i18n keys** under `chrome:menu.*`.
- **Forward reference**: depends on `data-progress` hook from `game-engine-base`. This change can merge before `game-engine-base` lands — when the hook is absent, all doors render as `not-started`. A `@todo: wire to trackerCount` comment marks the site.
- **Consumed by**: `game-engine-base` (door-press routes into `/games/<mechanic>/<doorIndex>`), `about-share-resources-screens` (menu icons route to `/about`, `/share`, `/resources`).
- **No breaking changes** — the route `/menu` did not exist in any prior change.

## Out of Scope

- The game-mechanic feature libs (`feature-game-china` and any future `feature-game-<class>`) — out of scope per `ARCHITECTURE.md §17` which states game classes are added on demand. The menu's door-press handler uses a generic dispatch (`router.push('/games/' + door.classKey + '?door=' + door.index)`) that game-engine-base will wire up.
- The `/about`, `/share`, `/resources` routes themselves — spec'd by the separate `about-share-resources-screens` change. This change only exposes the affordances that route to them.
- Per-player progress storage — `data-progress` store lives in `game-engine-base`. This change consumes the read API only.
- Audio instructions button (`zzz_earth.mp3`) — renders only if the asset exists; the play handler uses `data-audio`'s `playInstruction` API (owned by `audio-system`).
- Global points display (Android's `globalPoints` across-session counter) — v1 shows only per-door progress; cross-door score totals are spec'd by `game-engine-base` if at all.
- Grade detection from name (Android parses a digit out of the player name). Dropped — the name is user-entered text, not a grade-coded string. If we need per-grade content tiering, spec a separate `grade-tiering` change.
