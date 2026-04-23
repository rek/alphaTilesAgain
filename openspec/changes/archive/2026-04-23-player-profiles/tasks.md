## 0. Preflight

- [x] 0.1 Read `AGENTS.md` and `openspec/AGENT_PROTOCOL.md`
- [x] 0.2 Read this change's `proposal.md` and `design.md` in full
- [x] 0.3 Read required upstream change design docs (see `design.md → ## Context`)
- [x] 0.4 Read required `docs/ARCHITECTURE.md` sections and referenced ADRs
- [x] 0.5 Open the source Java files named in `design.md → ## Context`; keep them in view during implementation
- [x] 0.6 Open the fixture files named in `design.md → ## Context`; verify pack content matches the assumptions the design makes
- [x] 0.7 Confirm upstream changes are merged (`openspec status --all`); do not start if an upstream is only in-progress
- [x] 0.8 Confirm `APP_LANG` and `PUBLIC_LANG_ASSETS` env vars are set for local runs
- [x] 0.9 Confirm `nx graph` shows the libs this change will touch don't already exist with conflicting tags

## 1. `libs/alphaTiles/data-players`

- [x] 1.1 Scaffold via `nx g @nx/js:lib data-players --directory=libs/alphaTiles/data-players --tags='type:data-access,scope:alphaTiles'`
- [x] 1.2 Add `zustand` and `@react-native-async-storage/async-storage` deps to root `package.json`
- [x] 1.3 Export `Player` type (id, name, avatarIndex, createdAt, lastPlayedAt)
- [x] 1.4 Implement `usePlayersStore` with `persist` middleware, key `alphatiles:players-v1`, `version: 1`, driver `rnStorage`
- [x] 1.5 Implement `createPlayer({ name, avatarIndex })` — generates UUID, pushes record, returns new `Player`
- [x] 1.6 Implement `renamePlayer(id, name)` — updates matching record
- [x] 1.7 Implement `deletePlayer(id)` — removes record, clears `activePlayerId` if matched
- [x] 1.8 Implement `selectPlayer(id)` — sets `activePlayerId`, updates `lastPlayedAt`
- [x] 1.9 Export selector hooks: `useActivePlayer()`, `usePlayers()`, `useHasAnyPlayer()`
- [x] 1.10 Unit tests:
  - [x] 1.10.1 Create → find in `players`
  - [x] 1.10.2 Create → returns `Player` with non-empty `id`
  - [x] 1.10.3 Rename → name updated, id stable
  - [x] 1.10.4 Delete active → `activePlayerId` null
  - [x] 1.10.5 Delete inactive → active unchanged
  - [x] 1.10.6 Select updates `lastPlayedAt`
  - [x] 1.10.7 Persistence round-trip (manual `getState()` → rehydrate → `getState()`)
  - [x] 1.10.8 Stale `activePlayerId` (id not in players) returns `null` from `useActivePlayer`

## 2. `libs/shared/ui-avatar-grid`

- [x] 2.1 Scaffold `nx g @nx/react:lib ui-avatar-grid --directory=libs/shared/ui-avatar-grid --tags='type:ui,scope:shared'`
- [x] 2.2 Props: `avatars: number[]` (require-id array), `selectedIndex?: number`, `dimmedIndices?: number[]`, `onPick: (i: number) => void`, `a11yLabel: (i: number) => string`
- [x] 2.3 Render a grid of tappable avatars; selected = outlined, dimmed = reduced opacity
- [x] 2.4 Accept `columns: number` prop (default 4); responsive clamp via flex
- [x] 2.5 No `react-i18next` import (verified by lint rule)
- [x] 2.6 Storybook stories: 6 avatars, 12 avatars, with selection, with dimming

## 3. `libs/shared/ui-player-card`

- [x] 3.1 Scaffold `nx g @nx/react:lib ui-player-card --directory=libs/shared/ui-player-card --tags='type:ui,scope:shared'`
- [x] 3.2 Props: `avatar: number`, `name: string`, `onSelect: () => void`, `onRequestDelete?: () => void`, `onConfirmDelete?: () => void`, `deleteState: 'idle'|'armed'|'confirm'`, `a11y: { select: string; delete: string; confirmDelete: string }`
- [x] 3.3 Long-press → call `onRequestDelete` (arms)
- [x] 3.4 Visual states: idle (normal), armed (trash icon visible), confirm (red check icon visible)
- [x] 3.5 No `react-i18next` import
- [x] 3.6 Storybook stories: idle, armed, confirm, with long name (truncation)

## 4. `libs/shared/ui-custom-keyboard`

- [x] 4.1 Scaffold `nx g @nx/react:lib ui-custom-keyboard --directory=libs/shared/ui-custom-keyboard --tags='type:ui,scope:shared'`
- [x] 4.2 Props: `keys: Array<{ text: string; colorHex: string }>`, `onKey: (text: string) => void`, `onBackspace: () => void`, `a11y: { delete: string; next: string; prev: string }`
- [x] 4.3 Internal page state (`useState`) — keys 1..33 on page 1; arrow keys fill slots 34–35 when `keys.length > 35`
- [x] 4.4 Render 35-cell grid; hide / dim cells beyond `keys.length` on final page
- [x] 4.5 No `react-i18next` import
- [x] 4.6 Storybook stories: small (5 keys), medium (28 keys), large (60 keys), RTL

## 5. `libs/alphaTiles/feature-choose-player`

- [x] 5.1 Scaffold `nx g @nx/react:lib feature-choose-player --directory=libs/alphaTiles/feature-choose-player --tags='type:feature,scope:alphaTiles'`
- [x] 5.2 `ChoosePlayerContainer` (container):
  - [x] 5.2.1 `useTranslation('chrome')`
  - [x] 5.2.2 `useRouter()` from `expo-router`
  - [x] 5.2.3 `usePlayers()`, `useLangAssets()` for `settings.numberOfAvatars`, `langInfo.nameInLocalLang`, `images.avataricons`
  - [x] 5.2.4 Clamp `numberOfAvatars` to `[1, 12]`
  - [x] 5.2.5 Compose `PlayerCardProps[]` + "add" slot
  - [x] 5.2.6 Handlers: `onSelect(id)` → `selectPlayer(id)` + `router.replace('/menu')`; `onAdd()` → `router.push('/set-player-name?mode=create&avatarIndex=…')`; `onDelete(id)` → inline confirm flow
  - [x] 5.2.7 Emit `track('player_selected', { id })` / `identify(id)` on select; `track('player_created', { avatarIndex })` on create entry
- [x] 5.3 `ChoosePlayerScreen` (presenter): pure props → JSX. Renders heading + `UiAvatarGrid` / `UiPlayerCard` grid + "add" card + audio-instructions button (if pack ships `zzz_choose_player`)
- [x] 5.4 Storybook stories for the presenter: empty, one player, N players, N with delete-confirm open, RTL

## 6. `libs/alphaTiles/feature-set-player-name`

- [x] 6.1 Scaffold `nx g @nx/react:lib feature-set-player-name --directory=libs/alphaTiles/feature-set-player-name --tags='type:feature,scope:alphaTiles'`
- [x] 6.2 `SetPlayerNameContainer`:
  - [x] 6.2.1 Read query params (`mode`, `id`, `avatarIndex`) from `expo-router`
  - [x] 6.2.2 Read `keyList`, `colorList`, `images.avatars`, `images.avataricons`, `names` from `useLangAssets()`
  - [x] 6.2.3 Map `keyList` → `Array<{ text, colorHex }>` by indexing `colorList[parseInt(key.color)]`
  - [x] 6.2.4 Name-state via `useState` (default: edit mode → existing name; create mode with `nameInLocalLang === 'custom'` → next unused name from `names`; else empty)
  - [x] 6.2.5 `onKey(c)` handler — append if length < 20, else ignore
  - [x] 6.2.6 `onBackspace` handler — slice last character
  - [x] 6.2.7 Avatar-picker state (edit mode: prefill from player.avatarIndex; create mode: prefill from query param)
  - [x] 6.2.8 `onSubmit` — trim, validate (too-short, too-long, duplicate), call `createPlayer` or `renamePlayer`, then `selectPlayer`, then `router.replace('/menu')`
  - [x] 6.2.9 `track('player_name_submitted', { mode })` — deferred (event not in analytics catalog; will add when analytics-abstraction spec is updated)
- [x] 6.3 `SetPlayerNameScreen`: renders avatar preview, name field, `UiCustomKeyboard` OR native `TextInput` (decided by `keys.length > 0`), inline error row, submit / cancel buttons
- [x] 6.4 Storybook stories: create mode + custom kb, create mode + TextInput fallback, edit mode, validation error states

## 7. Expo-Router routes

- [x] 7.1 Create `apps/alphaTiles/app/choose-player.tsx` — thin wrapper: `export { ChoosePlayerContainer as default } from '@alphaTiles/feature-choose-player'`
- [x] 7.2 Create `apps/alphaTiles/app/set-player-name.tsx` — same pattern for `SetPlayerNameContainer`
- [x] 7.3 Update the root router (`apps/alphaTiles/app/_layout.tsx` — or wherever boot-complete redirect lives) to read `activePlayerId` and `<Redirect>` to `/menu` or `/choose-player`

## 8. i18n chrome keys

- [x] 8.1 Add `chrome:players.*` keys to `apps/alphaTiles/locales/en.json`:
  - `players.heading` (default: `"{{localName}}"` — unused; heading value comes from `langMeta` instead)
  - `players.add` — `"Add new"`
  - `players.delete_confirm` — `"Tap again to delete"`
  - `players.name_placeholder` — `"Your name"`
  - `players.name_submit` — `"Done"`
  - `players.a11y.avatar` — `"Avatar {{index}}"`
  - `players.a11y.delete` — `"Delete player"`
  - `players.a11y.keyboard_delete` — `"Delete last character"`
  - `players.a11y.keyboard_next` — `"Next keyboard page"`
  - `players.a11y.keyboard_prev` — `"Previous keyboard page"`
  - `players.validation.too_short` — `"Enter a name"`
  - `players.validation.too_long` — `"Max 20 characters"`
  - `players.validation.duplicate` — `"Name already used"`

## 9. Verification

- [x] 9.7 `openspec validate player-profiles --strict` passes
- [x] 9.8 `npx tsc --noEmit` passes across the workspace
- [x] 9.9 `nx graph` shows no `ui-*` → `type:feature` or `ui-*` → `type:data-access` edges
- [ ] 9.1 `APP_LANG=eng nx start alphaTiles` boots to `/choose-player` on first run
- [ ] 9.2 Add a player → route to `/menu` (stub screen until `game-menu` lands)
- [ ] 9.3 Kill + relaunch → stays on `/menu` (active player restored)
- [ ] 9.4 Delete active player → next launch goes to `/choose-player`
- [ ] 9.5 On a pack with populated `aa_keyboard.txt` (tpx), custom keyboard renders; keystrokes append non-Latin characters
- [ ] 9.6 On a pack with empty `aa_keyboard.txt`, falls back to `TextInput`
