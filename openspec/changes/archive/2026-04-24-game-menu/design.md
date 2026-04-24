## Context

`Earth.java` is the menu — one screen, many concerns:

1. **Door grid**: iterates `Start.gameList` (parsed from `aa_games.txt`), paginating at `doorsPerPage = 33` (hardcoded in Android) with prev / next arrows.
2. **Per-door visual**: each door is a `TextView` with a number, a tinted `zz_door` drawable, and a style suffix (`""`, `"_inprocess"`, `"_mastery"`). Color is `colorList[parseInt(game.color)]`. Text color varies by state (white for in-process, black for "no-right-wrong" games, the tint color for mastery).
3. **Tracker count**: read from `SharedPreferences` under key `org.alphatilesapps.alphatiles.<country><level><playerString><mode><stage>_trackerCount`. Thresholds: `0` = not started, `1..11` = in-process, `>=12` = mastery.
4. **"No right/wrong" games**: Romania, Sudan, Malaysia, Iraq — forced to `trackerCount = 12` with black text on the `_inprocess` drawable. The code comment notes this should become a column in `aa_games.txt` rather than a hardcoded country list.
5. **Player bar**: avatar (`ChoosePlayer.AVATAR_JPG_IDS[playerNumber - 1]`), name, global points counter.
6. **Utility icons**: about (always shown), share (shown if `aa_share.txt` has content past the header), resources (shown if `aa_resources.txt` has content past the header), audio-instructions (shown if `zzz_earth.mp3` exists).
7. **Back arrow**: returns to `/choose-player` (finishes activity + starts `ChoosePlayer`).
8. **Door press**: routes to the mechanic class via `Class.forName("org.alphatilesapps.alphatiles." + country)`. In the port, this becomes `router.push('/games/<mechanic>?doorIndex=<i>')`.

The port must replicate behavioral parity for 1–7 while deferring 8 to `game-engine-base` (which owns the mechanic routing).

Key design rotation from the Java source:

- **Pagination constant `doorsPerPage`**: Android hardcodes 33 (via layout XML slot count). The port reads `aa_settings.txt "Doors per page"` if present, default 20. A 20-door page fits more comfortably on a phone than 33; 33 works on Android tablets. If a pack's settings file omits it, default `20` to match RN's more-portable aspect ratios.
- **Door drawable**: Android ships `zz_door.png` / `zz_door_inprocess.png` / `zz_door_mastery.png` in `res/drawable`. Port uses one SVG at `apps/alphaTiles/assets/images/door.svg` with three visual variants controlled by fill / stroke / text-color props. Shared across packs — packs don't ship a door asset.
- **No-right-wrong classification**: rather than hardcoding `["Romania", "Sudan", "Malaysia", "Iraq"]` in two places, the port reads a new optional column from `aa_games.txt` called `noRightWrong` (boolean `"1"` / `"0"`, default `"0"`). If the column is absent (older pack schema), the port falls back to the Android hardcoded list for the four classes named above. The validator (separate change) will warn on packs missing the column.
- **Tracker-count source**: Android reads per-door from `SharedPreferences`. Port reads from a `useTrackerCount(playerId, gameIndex)` hook exported by `data-progress` (`game-engine-base`). Until that lands, the hook is stubbed to return `0` for all `(playerId, gameIndex)` pairs and all doors render as `not-started`. A `@todo: wire to trackerCount` comment marks the substitution site.
- **Utility-icon presence**: Android checks the raw file contents at render time. Port computes these flags once at boot (in the lang-pack parser spec'd by `lang-pack-parser`): `langAssets.hasShare`, `langAssets.hasResources`. `hasAbout` is always `true`.

### Required reading for implementers

- `AGENTS.md` — entry doc; read first.
- `openspec/AGENT_PROTOCOL.md` — pickup protocol.
- `docs/ARCHITECTURE.md` §3 (taxonomy — `feature-game-menu` is `type:feature, scope:alphaTiles`), §11 (container/presenter), §13 (routing), §14 (game taxonomy).
- `docs/decisions/ADR-004-state-management-hybrid.md`.
- **Upstream OpenSpec changes (must be merged before starting):**
  - `lang-assets-runtime` — supplies `gameList`, `colorList`, `hasShare`, `hasResources` flags.
  - `theme-fonts` — palette + typography.
  - `i18n-foundation` — `t('chrome:menu.*')`.
  - `player-profiles` — active player for player bar.
  - Optional forward dep: `game-engine-base` (`useTrackerCount` hook) — stub until available.
  - Read `openspec/changes/lang-assets-runtime/design.md` and `player-profiles/design.md`.
- **Source Java files being ported** (absolute paths):
  - `../AlphaTiles/app/src/main/java/org/alphatilesapps/alphatiles/Earth.java` — the menu screen being ported.
  - `../AlphaTiles/app/src/main/java/org/alphatilesapps/alphatiles/ChoosePlayer.java` — `AVATAR_JPG_IDS` lookup (reference for player-bar avatar binding).
  - `../AlphaTiles/app/src/main/java/org/alphatilesapps/alphatiles/Start.java` — `gameList`, `colorList`, `SharedPreferences` key conventions.
  - `../AlphaTiles/app/src/main/res/layout/activity_earth.xml` — door-grid layout reference.
  - `../AlphaTiles/app/src/main/res/drawable/zz_door*.png` — the three door drawables the SVG replaces.
- **Fixture paths** (absolute, under `../PublicLanguageAssets/`):
  - `../PublicLanguageAssets/engEnglish4/res/raw/aa_games.txt` — the door list (game count, countries, colors).
  - `../PublicLanguageAssets/engEnglish4/res/raw/aa_colors.txt` — color index lookup.
  - `../PublicLanguageAssets/engEnglish4/res/raw/aa_settings.txt` — `"Doors per page"` (if present).
  - `../PublicLanguageAssets/engEnglish4/res/raw/aa_share.txt`, `aa_resources.txt` — gate utility-icon visibility.
  - `../PublicLanguageAssets/engEnglish4/res/raw/zzz_earth.mp3` (if present) — audio-instructions gate.

## Goals / Non-Goals

**Goals:**

- Render one door per `gameList` entry, in order, with correct tint and visual style based on `trackerCount`.
- Pagination respects `doorsPerPage` and shows prev / next arrows only when applicable.
- Player bar shows active player's avatar + name.
- Utility icons appear iff the pack provides the underlying data.
- Back arrow clears `activePlayerId` and routes to `/choose-player` (explicit player-switch affordance).
- Door press calls a handler provided by the container — the handler routes via `expo-router` to a path that `game-engine-base` will implement.
- A11y labels for every interactive: doors announce their number and state, arrows announce direction, utility icons announce their destination.
- Presenter is pure and Storybookable with any door-count / state combination.

**Non-Goals:**

- Mechanic screens — out of scope; `game-engine-base` owns them.
- Per-pack door drawable variants. The port uses one shared SVG.
- Global-points counter — deferred to `game-engine-base`'s score model.
- Editing door layout at runtime (reorder, hide). Not a feature.
- Long-press on a door for "reset progress". Not in Android; out of scope here.

## Decisions

### D1. Door data model and rendering

```ts
type Door = {
  index: number;                // 1-based display number (matches Android)
  classKey: string;             // normalized mechanic id, e.g. 'china', 'romania', 'thailand'
  challengeLevel: number;       // from aa_games.txt 'Level' column
  colorHex: string;             // pre-resolved from colorList[parseInt(game.color)]
  noRightWrong: boolean;        // from aa_games.txt; falls back to Android hardcoded list
  trackerCount: number;         // 0..N from data-progress; 0 during pre-game-engine-base
};

type DoorVisual = 'not-started' | 'in-process' | 'mastery';

function deriveVisual(door: Door): DoorVisual {
  if (door.noRightWrong) return 'in-process';
  if (door.trackerCount >= 12) return 'mastery';
  if (door.trackerCount > 0) return 'in-process';
  return 'not-started';
}
```

Decision: **visual derivation is a pure function.** Testable, colocated with the door component.

Decision: **`classKey` is normalized at parse time** (lowercased) — `aa_games.txt` has `Country` column values like `"Romania"`, `"china"`. The parser (owned by `lang-pack-parser`) normalizes to lowercase. The port's `router.push('/games/romania?door=…')` uses the normalized key.

Decision: **`colorHex` is pre-resolved** — the container looks up `colorList[parseInt(game.color)]` once and passes the resolved string. The `ui-door` presenter doesn't know about `colorList`.

### D2. "No right/wrong" classification

Android hardcodes `["Romania", "Sudan", "Malaysia", "Iraq"]` in two places (`Earth.java` lines ~198, ~209). The port's `lang-pack-parser` reads an optional `NoRightWrong` column from `aa_games.txt`; if the column exists, it's authoritative. If the column is absent (older pack), the parser falls back to the hardcoded list `['romania', 'sudan', 'malaysia', 'iraq']` — matching the four classes Android treats specially.

Decision: **column-driven with fallback, not hardcoded in menu code.** The menu never inspects country names; it reads `door.noRightWrong` from the parsed data. Parser owns the fallback.

Decision: **fallback list is exact-match lowercase classKey.** Not a substring / regex match.

### D3. Pagination

`doorsPerPage`:

1. Read `aa_settings.txt` `"Doors per page"` if present.
2. Else default 20.
3. Clamp to `[6, 40]` — any value outside is a pack-author error, clamp and warn.

Pagination state lives in `GameMenuContainer` via `useState<number>(0)`. Prev / next arrows update it. Page 0 hides prev; final page hides next.

Decision: **state lives in the container**, not the store. Pagination is UI state, not persisted — a fresh visit to `/menu` resets to page 0.

Decision: **defaults change from Android's 33 to 20.** RN's target form-factor spread (phones + tablets + web) favors a smaller grid. 33 felt cramped on phones in playtesting (informally). Pack authors who need 33 can set it explicitly.

### D4. Door-press handler contract

`GameMenuContainer` receives the active player and calls:

```ts
const onDoorPress = (door: Door) => {
  track('door_opened', { classKey: door.classKey, index: door.index, challengeLevel: door.challengeLevel });
  router.push({
    pathname: '/games/[classKey]',
    params: {
      classKey: door.classKey,
      doorIndex: String(door.index),
      challengeLevel: String(door.challengeLevel),
    },
  });
};
```

Decision: **dynamic route segment (`[classKey]`) rather than per-class named routes.** `game-engine-base` implements a single route that dispatches on `classKey` to the right mechanic lib. Keeps the menu decoupled from the engine.

Decision: **pass only identifiers** as params. The game screen reads `classKey` + `doorIndex` and re-resolves the game record from `useLangAssets()`. No denormalized `Door` object in the query string.

### D5. Back arrow clears `activePlayerId`

Android's back arrow (`goBackToChoosePlayer`) just launches `ChoosePlayer`. The port additionally clears `activePlayerId` — explicit player-switch UX. Without this, the return trip would instantly re-route to `/menu` because the loading-screen's route-resolver sees a non-null `activePlayerId`.

But `/menu` is reached in two ways:

1. From loading screen with `activePlayerId` set (returning launch).
2. From `/choose-player` after picking a player (which sets `activePlayerId`).

Both ways, entering `/menu` implies "this is the active player now." Back-arrow means "I want to pick a different player." Therefore:

```ts
const onBack = () => {
  clearActivePlayer();  // setActivePlayer(null)
  router.replace('/choose-player');
};
```

Decision: **back arrow clears active player.** Consistent semantics: `activePlayerId === null` ⇔ learner is currently on `/choose-player`.

Decision: **`router.replace` (not `push`) so the menu isn't in the back-stack.** Matches `player-profiles`' decision.

### D6. Utility-icon visibility

Computed at boot by the pack parser:

```ts
// in useLangAssets()
langAssets.hasShare: boolean       // aa_share.txt has content past the header
langAssets.hasResources: boolean   // aa_resources.txt has content past the header
langAssets.hasEarthInstructions: boolean  // 'zzz_earth.mp3' is present in audio/instructions/
```

`hasAbout` is always `true`.

Decision: **precompute at parse, not at render.** Reading file contents at render time was an Android pattern driven by `SharedPreferences`-adjacent APIs. In the port, the parsed pack is already in memory; checking it once at boot is free.

### D7. Library structure

```
libs/alphaTiles/feature-game-menu/
  src/
    index.ts
    GameMenuContainer.tsx
    GameMenuScreen.tsx
    deriveVisual.ts              # Door → DoorVisual
    useDoors.ts                  # hook: composes gameList + trackerCounts + colorList → Door[]
    __tests__/
      deriveVisual.test.ts
      useDoors.test.ts

libs/shared/ui-door-grid/
  src/
    index.ts
    UiDoorGrid.tsx
    stories/
      UiDoorGrid.stories.tsx

libs/shared/ui-door/
  src/
    index.ts
    UiDoor.tsx
    DoorSvg.tsx                  # shared SVG (three visual variants)
    stories/
      UiDoor.stories.tsx
```

Decision: **`ui-door` + `ui-door-grid` are separate libs** — a single door is reusable outside a grid (e.g. a "next game" surface that shows one door). Grid pulls door.

Decision: **`deriveVisual` lives in `feature-game-menu`, not `ui-door`.** The derivation uses `trackerCount` + `noRightWrong`, which are domain concepts; `ui-door` should accept the already-derived `DoorVisual`.

Decision: **SVG rather than rasterized PNG.** SVG supports clean tinting at any size; we avoid shipping a 3x / 2x / 1x raster set for a shape we can describe in <1KB of XML.

### D8. `data-progress` forward reference

```ts
// libs/alphaTiles/feature-game-menu/src/useTrackerCounts.ts
import type { TrackerCountMap } from '@alphaTiles/data-progress';

// Try-import pattern; fall back to a stub if the module isn't yet built.
let useTrackerCountsImpl: (playerId: string | null) => TrackerCountMap;
try {
  useTrackerCountsImpl = require('@alphaTiles/data-progress').useTrackerCounts;
} catch {
  // @todo: wire to trackerCount — remove this shim once game-engine-base lands
  useTrackerCountsImpl = () => ({});
}

export const useTrackerCounts = useTrackerCountsImpl;
```

Decision: **dynamic `require` guarded by try/catch** so the menu can ship before `game-engine-base`. Once `data-progress` exists, the guard is unnecessary but harmless.

Decision: **fall-back returns empty map.** Every `trackerCount` lookup resolves to `0` → every door is `not-started`. Visible degradation, documented in the TODO.

## Risks / Trade-offs

- **[Risk]** The dynamic-require shim for `data-progress` tricks TypeScript — the return type must be typed-only-imported. **Mitigation**: `import type` is erased at runtime; the `require` is runtime-only. No type conflict.
- **[Risk]** A pack with `aa_games.txt` missing the `NoRightWrong` column falls back to the hardcoded list. If a future no-right-wrong class is added and the pack doesn't update its schema, its doors render as right/wrong (miscategorization). **Mitigation**: the validator warns when `NoRightWrong` column is missing; the fallback list is clearly documented. Accepted.
- **[Risk]** SVG rendering performance on large grids (50+ doors). **Mitigation**: `react-native-svg` handles 100+ nodes comfortably. If slow in practice, memoize the per-door tree.
- **[Trade-off]** Back-arrow clears active player. A user who just wanted to see a different screen (say, About) and then return to the menu has to re-select their player. **Accepted**: the About / Share / Resources icons don't clear; only the explicit back arrow does. This is intentional UX.
- **[Trade-off]** Pagination default dropped from 33 to 20. Packs with 30–40 games now paginate where Android didn't. **Accepted**: the arrow chrome makes it discoverable.
- **[Trade-off]** Door count derives from `gameList.length`. A pack with 100+ games creates 5+ pages. **Accepted**: matches Android.

## Migration Plan

1. Land `ui-door` with Storybook stories for all three visual states and multiple tint colors.
2. Land `ui-door-grid` with Storybook stories for 1 / 10 / 33 / 50 doors across single / multi-page.
3. Land `feature-game-menu`'s presenter + `deriveVisual` + unit tests.
4. Land `useDoors` + container with the `data-progress` shim.
5. Add the `/menu` route.
6. Add chrome i18n keys.
7. Manual-verify on `eng` (small gameList) + `tpx` (larger gameList).
8. After `game-engine-base` lands, remove the shim; remove the TODO.

Rollback: revert the commit. `/menu` route vanishes; `player-profiles` select currently routes to `/menu` so post-login the user would hit a 404. Ensure `/menu` has at least a placeholder before `player-profiles` lands if order gets reversed.

## Open Questions

- Should doors show a small progress indicator (`trackerCount / 12` as a ring around the number) or just the color-state? Android shows color-state only. **Defer to playtesting.** V1 = color-state only.
- Should the menu's "audio instructions" button pre-load its audio? The file is shipped as `zzz_earth.mp3` under `audio/instructions/`. Since all instruction audio preloads at boot (loading-screen change), the answer is yes automatically.
- Is `challengeLevel` always numeric, or can it be a tier identifier? Looking at `aa_games.txt` fixtures: always numeric, padded. Port types it as `number`. If that's wrong, the parser spec can widen it.
- Does `game-engine-base` need `grade` (Android's `studentGrade` char parsed from player name)? **Deferred — we dropped it from proposal.** If some mechanic needs per-grade content, spec it separately.
