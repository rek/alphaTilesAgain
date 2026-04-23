## Context

The Java source models players as 12 fixed slots keyed by `playerNumber` (1..12). `ChoosePlayer.onCreate` populates slot 1..N from `SharedPreferences` reads (`storedName<N>`), displays the 12 avatars from `zz_avataricon01..12.png`, and hands `playerNumber` to `Earth` (game menu) as an `Intent` extra. `SetPlayerName` receives the same `playerNumber`, looks up the avatar drawable, and offers a custom tab-delimited-file-driven keyboard (`aa_keyboard.txt`) to type a name that overwrites `storedName<N>` in the same `SharedPreferences` bucket. Every downstream screen that cares about who is playing reads `playerNumber` out of an Intent and then reads `SharedPreferences.getString("storedName" + Util.returnPlayerStringToAppend(playerNumber))`.

This pattern has three problems for a React-Native port:

1. Slot-indexed storage couples name to position. Deleting player 3 leaves a gap or forces a shuffle.
2. 12 is a fixed ceiling from the Android layout. The `aa_settings.txt "Number of avatars"` setting is respected at render time but the underlying slot model assumes 12.
3. `SharedPreferences` passed across activities via `Intent.putExtra` has no React equivalent — we need a single source of truth that every screen can subscribe to without prop-drilling.

The port replaces the slot model with an identity model: each player has a UUID `id`, a `name`, an `avatarIndex` (0-based into the avatar asset list), and two timestamps. State lives in a Zustand store persisted via the shared AsyncStorage driver (ADR-005). Selecting a player sets `activePlayerId`. Every downstream screen reads `useActivePlayer()` and gets an always-up-to-date `Player | null`.

The custom keyboard is more subtle. The Android implementation (`SetPlayerName.loadKeyboard`) reads `keyList` (parsed from `aa_keyboard.txt` by `Start.java`) and renders up to 35 keys per page with forward/backward arrows when `keysInUse > 35`. On packs where `aa_keyboard.txt` is empty (rare — Latin-script packs with sufficient device keyboard coverage), the screen would be broken; we improve by falling back to the system `TextInput`. On packs where the custom keyboard is populated, we use it exclusively: the device keyboard cannot reliably produce Thai / Lao / Khmer / N'Ko / custom-orthography characters, and requiring the learner to navigate an OS-level input-method selector is a literacy-app antipattern.

### Required reading for implementers

- `AGENTS.md` — entry doc; read first.
- `openspec/AGENT_PROTOCOL.md` — pickup protocol.
- `docs/ARCHITECTURE.md` §3 (library taxonomy — `feature-players` is `type:feature, scope:alphaTiles`; `data-players` is `type:data-access, scope:alphaTiles`), §7 (state + persistence), §11 (container/presenter), §13 (routing).
- `docs/decisions/ADR-004-state-management-hybrid.md`, `ADR-005-persistence-zustand-persist-asyncstorage.md`.
- **Upstream OpenSpec changes (must be merged before starting):**
  - `i18n-foundation` — for `t('chrome:players.*')` keys + a11y labels.
  - `theme-fonts` — for `useTheme()` + `useFonts()` during keyboard + avatar rendering.
  - `lang-assets-runtime` — for avatar image handles + `aa_keyboard.txt` + `aa_settings.txt` (numberOfAvatars).
  - Read those three changes' `design.md` in full before starting.
- **Source Java files being ported** (absolute paths):
  - `../AlphaTiles/app/src/main/java/org/alphatilesapps/alphatiles/ChoosePlayer.java` — slot grid + routing.
  - `../AlphaTiles/app/src/main/java/org/alphatilesapps/alphatiles/SetPlayerName.java` — custom keyboard + name commit.
  - `../AlphaTiles/app/src/main/java/org/alphatilesapps/alphatiles/Util.java` — `returnPlayerStringToAppend` and related helpers.
  - `../AlphaTiles/app/src/main/java/org/alphatilesapps/alphatiles/Start.java` — `keyList` parse (reference for how `aa_keyboard.txt` is read).
  - `../AlphaTiles/app/src/main/res/layout/activity_choose_player.xml`, `activity_set_player_name.xml` — layout references (not ported 1:1).
- **Fixture paths** (absolute, under `../PublicLanguageAssets/`):
  - `../PublicLanguageAssets/engEnglish4/res/raw/aa_keyboard.txt` — Latin-script keyboard reference.
  - `../PublicLanguageAssets/tpxTeocuitlapa/res/raw/aa_keyboard.txt` — non-Latin parity fixture.
  - `../PublicLanguageAssets/engEnglish4/res/raw/aa_settings.txt` — `"Number of avatars"` row.
  - `../PublicLanguageAssets/engEnglish4/res/drawable-xxxhdpi/zz_avataricon01.png` … `zz_avataricon12.png` — avatar assets.

## Goals / Non-Goals

**Goals:**

- A first-time launch presents an empty grid with an "add player" slot; tapping it routes to `/set-player-name`. Completing name entry creates a player and routes to `/menu`.
- A returning launch restores the previous `players[]` and `activePlayerId`, routes directly to `/menu` if `activePlayerId` is set, else to `/choose-player`.
- The choose-player screen lists existing players with avatars + names, plus an "add new" slot if room remains.
- The set-player-name screen renders the custom keyboard from `aa_keyboard.txt` when present; falls back to `TextInput` otherwise.
- Name validation is consistent across create and rename: 1–20 chars, unique among existing players (case-sensitive match — local scripts are not case-comparable).
- Deleting a player clears `activePlayerId` if the deleted player was active.
- The store's hydration is observable (`usePlayerStore.persist.hasHydrated()`) — the loading screen (separate change) gates app entry on it.
- All interactive surfaces have `accessibilityLabel` / `accessibilityRole`. A11y labels route through `t('chrome:players.a11y.*')`.

**Non-Goals:**

- Per-player audio setting, theme preference, or any other profile attribute beyond name + avatar. The Android source has none; adding them is a separate change.
- Cloud sync of profiles. There is no backend (ADR-001).
- Player-switching mid-game. Switching players requires returning to `/choose-player` — same as Android.
- Internationalization of the name itself. Names are stored as a single Unicode string; comparison is exact-match.
- The "Days until expiration" behavior (`ChoosePlayer.java` 195–244). Deferred.
- Analytics event schema — `analytics-abstraction` owns the schema; this change fires events but does not define them.

## Decisions

### D1. `Player` shape and identity

```ts
type Player = {
  id: string;              // uuid v4 generated on create
  name: string;            // 1–20 Unicode chars, no validation on script
  avatarIndex: number;     // 0-based index into the pack's avatar list (length = numberOfAvatars)
  createdAt: number;       // Date.now() at create time
  lastPlayedAt: number | null; // updated when selectPlayer fires; null until first play
};
```

Decision: **UUIDs over sequential slot numbers.** Decouples identity from avatar choice and from creation order; enables future rename-without-slot-conflicts and unordered deletion.

Decision: **`avatarIndex` is a number, not an asset path.** The pack determines the actual image; changing the pack (impossible in production, but relevant in dev when swapping `APP_LANG`) would break embedded paths. The index stays portable across pack swaps and degrades gracefully if the new pack has fewer avatars (clamp at render time).

Decision: **`createdAt` / `lastPlayedAt` are `number` (epoch millis), not ISO strings.** Zustand-persist JSON-serializes them as-is; sort comparisons are free; no Date parsing needed on read.

Alternatives considered:

- **Keep `playerNumber` (1..12) as identity.** Rejected — same coupling problem the Android source has.
- **`avatarId: string`** (e.g. `zz_avataricon03`). Rejected — pack-coupled, brittle across dev pack swaps, and no added value over an index.

### D2. Store surface

```ts
type PlayersState = {
  players: Player[];
  activePlayerId: string | null;
};

type PlayersActions = {
  createPlayer: (input: { name: string; avatarIndex: number }) => Player;
  renamePlayer: (id: string, name: string) => void;
  deletePlayer: (id: string) => void;
  selectPlayer: (id: string) => void;
};

export const usePlayersStore = create<PlayersState & PlayersActions>()(
  persist(
    (set, get) => ({ /* … */ }),
    { name: 'alphatiles:players-v1', storage: rnStorage, version: 1 },
  ),
);

export const useActivePlayer = (): Player | null =>
  usePlayersStore(state =>
    state.activePlayerId
      ? state.players.find(p => p.id === state.activePlayerId) ?? null
      : null,
  );
```

Decision: **one store, not two.** `players` and `activePlayerId` are always updated together (deleting the active player clears the active ID; selecting sets it). Splitting them creates sync-effect surface without benefit.

Decision: **`createPlayer` returns the new `Player`** so the container can immediately `selectPlayer(p.id)` + `router.replace('/menu')` without re-subscribing to the store.

Decision: **versioned persist key (`alphatiles:players-v1`)** per ADR-005 migration-readiness. V1 ships no `migrate` function (there is no v0); the version field is a forward hook.

Decision: **Actions mutate via `set((state) => ({...}))` patches.** No immer middleware — the store is small enough that spread-based updates are readable.

Alternatives considered:

- **Separate `playerStore` + `activePlayerStore`.** Rejected — cross-store coordination wastes the selector-ergonomics Zustand provides.
- **Persist `activePlayerId` separately from the list.** Rejected — same argument; also adds a second persist key to gate boot on.

### D3. Avatar count and source

The pack setting `"Number of avatars"` in `aa_settings.txt` (default 12) caps how many avatars the choose-player grid displays. The container reads `useLangAssets().settings.numberOfAvatars`, clamps to `[1, 12]`, and passes that as an `avatarCount` prop to the presenter. Avatars themselves come from `langManifest.images.avatars[i]` — an array of 12 `require()` numbers (per `port-foundations` manifest contract).

Decision: **clamp to 12 hard maximum** — the Android source has exactly 12 avatar drawables; packs that declare `"Number of avatars" = 16` are authoring errors that the validator will flag, but we don't explode at runtime.

Decision: **`avatarIndex` is assigned by user pick, not auto-incremented.** A learner on a 6-avatar pack picks whichever avatar they want from the 6 visible; the picker shows the full grid with already-taken avatars dimmed (not blocked — two players can share an avatar, matching Android's slot model where any slot could hold any name).

### D4. Name-in-local-language heading

`aa_langinfo.txt` has a `"NAME in local language"` field (e.g. `Student`, `Player`, `custom`). The heading on `/choose-player` renders this string. When the field value is `custom`, the default name for an add-player slot comes from the next entry in `aa_names.txt`; otherwise the Java default is `"<localWord> <playerNumber>"`. In the port, since slot numbers are gone, we keep `"<localWord>"` as the heading and leave the name field empty (no auto-numbered default) — the user types their actual name. If `"NAME in local language" = custom`, the first unused name from `aa_names.txt` prefills the name field.

Decision: **drop slot-number suffix from default names.** "Player 3" meant something when slot 3 was persistent identity; in the UUID model it's noise. If the pack uses `custom` names, we prefill the field from `aa_names.txt`; otherwise the user supplies a name from scratch.

### D5. Custom keyboard from `aa_keyboard.txt`

The pack's keyboard file is a tab-delimited table where each row is one key. The `data-language-assets` change parses it into `keyList: { text: string; color: string }[]` (same shape as Android's `Start.Key`). The `ui-custom-keyboard` library accepts `keys: Array<{ text: string; colorHex: string }>` and renders them in a grid, paginated at `keysPerPage = 33` (matching Android's `KEYS.length - 2`). Forward / back arrow keys appear when `keys.length > 35`.

Decision: **always render the custom keyboard when `keyList.length > 0`.** The keyboard is not "nice to have" — for most packs, the device keyboard cannot produce the script. A pack author shipping an empty `aa_keyboard.txt` is signaling "use the device keyboard" and we fall back to `TextInput`.

Decision: **`ui-custom-keyboard` owns pagination state internally.** The keyboard is a self-contained UI primitive; the outer container passes `keys`, `onKey(char)`, `onBackspace()`, and does not need to know about pages. Paging is presentational.

Decision: **`ui-custom-keyboard` has no i18n import.** It accepts pre-translated a11y labels as props (`backLabel`, `forwardLabel`, `deleteLabel`) — the container passes `t('chrome:players.a11y.keyboard_prev')` etc.

Decision: **the fallback `TextInput` path still mounts a backspace / submit row.** The set-name screen has a consistent footer regardless of which keyboard variant is active — the custom-keyboard's backspace is a dedicated key, the TextInput's backspace is the OS keyboard's, but both variants show the same "Submit" / "Cancel" chrome.

### D6. Validation rules and UX

On submit:

- `trimmedName.length < 1` → show inline error `chrome:players.validation.too_short`, stay on screen.
- `trimmedName.length > 20` → show `chrome:players.validation.too_long`. Also prevent additional keystrokes once at 20 (both custom keyboard and `TextInput`).
- Exact-match collision with another player's name (excluding the player being edited) → `chrome:players.validation.duplicate`.
- Otherwise: `createPlayer({ name: trimmedName, avatarIndex })` (or `renamePlayer` in the edit path), `selectPlayer(result.id)`, `router.replace('/menu')`.

Decision: **case-sensitive uniqueness check.** Local scripts are not reliably case-normalizable; two learners named "Aya" and "aya" might legitimately be distinct. Case-insensitive matching would be Western-centric.

Decision: **errors render inline below the name field, not as toasts.** Inline errors are screen-reader-native and don't depend on the toast library; they also disappear naturally when the user edits the field.

### D7. Delete confirmation UX

Android uses `AlertDialog` with an OK/Cancel (long-press on a player triggers a menu → delete). Ports vary: long-press is unreliable on RN (especially on web), and modal dialogs are chrome we don't need for a destructive action of trivial scope.

Decision: **Inline tap-to-confirm.** A long-press on a player card reveals a small trash icon; tapping the trash icon transitions the card to "confirm delete?" state (icon becomes a red check). A second tap on the check confirms; a tap anywhere else cancels. No modal.

Alternatives considered:

- **Modal confirm dialog** (matches Android). Rejected — heavier, no a11y win, and modal management in RN is more friction than the interaction deserves.
- **Swipe to delete.** Rejected — not discoverable on web; also inconsistent with the rest of the app's tap-only surface.
- **No delete.** Rejected — the Android source has no delete either, but scope creep: a slot-based model lets you overwrite a slot, which is a rename, not a delete. The UUID model needs a delete to avoid graveyards.

### D8. Navigation

Routes:

- `/choose-player` — renders the grid. First-run: shows only the "add player" slot. Second-run: shows existing players + "add" slot.
- `/set-player-name?mode=create&avatarIndex=N` or `/set-player-name?mode=edit&id=<uuid>` — Expo-Router query params distinguish create vs. rename.
- `/menu` — post-select destination. Owned by `game-menu` change.

Decision: **query params, not route params, for mode + identity.** Expo-Router supports both; query params are URL-friendly for web and simpler to type-guard.

Decision: **`router.replace` (not `router.push`) on navigation between these three screens.** The stack should never have two copies of `/choose-player`; back-navigation from `/menu` to `/choose-player` is an explicit affordance on the menu, not a stack pop.

### D9. Library dependencies and boundaries

```
apps/alphaTiles
  └─→ feature-choose-player
        ├─→ data-players     (type:data-access)
        ├─→ data-language-assets  (read: settings.numberOfAvatars, langInfo.nameInLocalLang, images.avatars)
        ├─→ util-i18n        (useTranslation)
        ├─→ util-theme
        ├─→ util-analytics
        └─→ ui-avatar-grid, ui-player-card   (type:ui scope:shared)
  └─→ feature-set-player-name
        ├─→ data-players
        ├─→ data-language-assets  (read: settings.numberOfAvatars, keyList, images.avatars)
        ├─→ util-i18n, util-theme, util-analytics
        └─→ ui-custom-keyboard, ui-player-card
```

Decision: **`ui-*` libs are `scope:shared`** — none of them encode anything alphaTiles-specific; another literacy app could reuse the avatar grid.

Decision: **`data-players` depends on the ADR-005 `rnStorage` factory** — not re-implementing the JSON storage adapter per store. A future `libs/shared/util-storage` may expose `rnStorage`; until then, `data-players` imports directly from the shared persist module.

Decision: **No direct `useEffect` in any of these libs.** Per `CLAUDE.md` rules: the initial-route logic lives in a container via derived state (read `activePlayerId` during render; `<Redirect>` if null); the delete-confirm state lives in `useState` with handler callbacks; no `useEffect` sync.

## Risks / Trade-offs

- **[Risk]** A pack with `"Number of avatars" > 12` is impossible to honor — only 12 avatars ship. **Mitigation**: validator warns, runtime clamps to 12. Accepted; spec'd in the `lang-pack-validator` change.
- **[Risk]** A learner on a pack with empty `aa_keyboard.txt` falls through to the device keyboard, which on iOS may not have the right script installed. **Mitigation**: pack authors should not ship empty `aa_keyboard.txt` for non-Latin scripts; the validator will flag it as a warning (separate change). Acceptable v1 behavior.
- **[Risk]** UUID collisions in `crypto.randomUUID()` — negligible.
- **[Trade-off]** Inline tap-to-confirm delete is slightly less discoverable than a long-press menu. **Accepted**: trash-icon affordance is obvious once a player card is long-pressed; two-tap confirm is standard iOS pattern.
- **[Trade-off]** Players can share avatars (no uniqueness constraint on `avatarIndex`). **Accepted**: matches Android behavior (any slot can have any avatar image since avatars are slot-indexed, and slot 3 + slot 7 can trivially show the same avatar). Dimming-only visual cue respects learner choice.
- **[Trade-off]** 20-char name ceiling. **Accepted**: Android has no explicit ceiling but 20 characters renders cleanly in the player-card layout and most of the test packs. Long names truncate visually regardless.
- **[Trade-off]** No migration path from a hypothetical Android install. **Accepted per ADR-005** — no existing user base to migrate.

## Migration Plan

1. Land `data-players` store with unit tests (create, rename, delete, select, collision, persistence round-trip).
2. Land `ui-avatar-grid`, `ui-player-card`, `ui-custom-keyboard` with Storybook stories (per ADR-010). Each accepts only presentational props.
3. Land `feature-choose-player` container + presenter. Storybook stories cover the presenter (empty, one player, N players, N players with delete-confirm open).
4. Land `feature-set-player-name` container + presenter. Storybook stories cover create-mode + edit-mode + custom-keyboard + fallback-TextInput.
5. Add the Expo-Router routes.
6. Wire chrome i18n keys into `apps/alphaTiles/locales/en.json`.
7. Manual-verify on `eng`, `tpx`, and a pack with a populated `aa_keyboard.txt`.

Rollback: revert the commit. No persisted data that other changes depend on.

## Open Questions

- Should `deletePlayer` also nuke that player's `data-progress` store slice? Depends on the shape of `data-progress` (owned by `game-engine-base`). **Defer to the `game-engine-base` change's spec** — it will declare a `clearProgressForPlayer(id)` action that this change's container calls on delete.
- Should the "add player" affordance respect `numberOfAvatars` as a hard cap on total players? (Android: 12 slots; port: unlimited.) **Proposal: no hard cap.** Avatars repeat visually; the store has no length limit. Revisit if playtesting shows confusion.
- Long-press threshold: Android ~500ms. RN default is ~500ms. Keep default unless playtesting complains.
