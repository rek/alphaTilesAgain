## 0. Preflight

- [ ] 0.1 Read `AGENTS.md` and `openspec/AGENT_PROTOCOL.md`
- [ ] 0.2 Read this change's `proposal.md` and `design.md` in full
- [ ] 0.3 Read required upstream change design docs (see `design.md → ## Context`)
- [ ] 0.4 Read required `docs/ARCHITECTURE.md` sections and referenced ADRs
- [ ] 0.5 Open the source Java files named in `design.md → ## Context`; keep them in view during implementation
- [ ] 0.6 Open the fixture files named in `design.md → ## Context`; verify pack content matches the assumptions the design makes
- [ ] 0.7 Confirm upstream changes are merged (`openspec status --all`); do not start if an upstream is only in-progress
- [ ] 0.8 Confirm `APP_LANG` and `PUBLIC_LANG_ASSETS` env vars are set for local runs
- [ ] 0.9 Confirm `nx graph` shows the libs this change will touch don't already exist with conflicting tags

## 1. `libs/alphaTiles/data-players`

- [ ] 1.1 Scaffold via `nx g @nx/js:lib data-players --directory=libs/alphaTiles/data-players --tags='type:data-access,scope:alphaTiles'`
- [ ] 1.2 Add `zustand` and `@react-native-async-storage/async-storage` deps to root `package.json`
- [ ] 1.3 Export `Player` type (id, name, avatarIndex, createdAt, lastPlayedAt)
- [ ] 1.4 Implement `usePlayersStore` with `persist` middleware, key `alphatiles:players-v1`, `version: 1`, driver `rnStorage`
- [ ] 1.5 Implement `createPlayer({ name, avatarIndex })` — generates UUID, pushes record, returns new `Player`
- [ ] 1.6 Implement `renamePlayer(id, name)` — updates matching record
- [ ] 1.7 Implement `deletePlayer(id)` — removes record, clears `activePlayerId` if matched
- [ ] 1.8 Implement `selectPlayer(id)` — sets `activePlayerId`, updates `lastPlayedAt`
- [ ] 1.9 Export selector hooks: `useActivePlayer()`, `usePlayers()`, `useHasAnyPlayer()`
- [ ] 1.10 Unit tests:
  - [ ] 1.10.1 Create → find in `players`
  - [ ] 1.10.2 Create → returns `Player` with non-empty `id`
  - [ ] 1.10.3 Rename → name updated, id stable
  - [ ] 1.10.4 Delete active → `activePlayerId` null
  - [ ] 1.10.5 Delete inactive → active unchanged
  - [ ] 1.10.6 Select updates `lastPlayedAt`
  - [ ] 1.10.7 Persistence round-trip (manual `getState()` → rehydrate → `getState()`)
  - [ ] 1.10.8 Stale `activePlayerId` (id not in players) returns `null` from `useActivePlayer`

## 2. `libs/shared/ui-avatar-grid`

- [ ] 2.1 Scaffold `nx g @nx/react:lib ui-avatar-grid --directory=libs/shared/ui-avatar-grid --tags='type:ui,scope:shared'`
- [ ] 2.2 Props: `avatars: number[]` (require-id array), `selectedIndex?: number`, `dimmedIndices?: number[]`, `onPick: (i: number) => void`, `a11yLabel: (i: number) => string`
- [ ] 2.3 Render a grid of tappable avatars; selected = outlined, dimmed = reduced opacity
- [ ] 2.4 Accept `columns: number` prop (default 4); responsive clamp via flex
- [ ] 2.5 No `react-i18next` import (verified by lint rule)
- [ ] 2.6 Storybook stories: 6 avatars, 12 avatars, with selection, with dimming

## 3. `libs/shared/ui-player-card`

- [ ] 3.1 Scaffold `nx g @nx/react:lib ui-player-card --directory=libs/shared/ui-player-card --tags='type:ui,scope:shared'`
- [ ] 3.2 Props: `avatar: number`, `name: string`, `onSelect: () => void`, `onRequestDelete?: () => void`, `onConfirmDelete?: () => void`, `deleteState: 'idle'|'armed'|'confirm'`, `a11y: { select: string; delete: string; confirmDelete: string }`
- [ ] 3.3 Long-press → call `onRequestDelete` (arms)
- [ ] 3.4 Visual states: idle (normal), armed (trash icon visible), confirm (red check icon visible)
- [ ] 3.5 No `react-i18next` import
- [ ] 3.6 Storybook stories: idle, armed, confirm, with long name (truncation)

## 4. `libs/shared/ui-custom-keyboard`

- [ ] 4.1 Scaffold `nx g @nx/react:lib ui-custom-keyboard --directory=libs/shared/ui-custom-keyboard --tags='type:ui,scope:shared'`
- [ ] 4.2 Props: `keys: Array<{ text: string; colorHex: string }>`, `onKey: (text: string) => void`, `onBackspace: () => void`, `a11y: { delete: string; next: string; prev: string }`
- [ ] 4.3 Internal page state (`useState`) — keys 1..33 on page 1; arrow keys fill slots 34–35 when `keys.length > 35`
- [ ] 4.4 Render 35-cell grid; hide / dim cells beyond `keys.length` on final page
- [ ] 4.5 No `react-i18next` import
- [ ] 4.6 Storybook stories: small (5 keys), medium (28 keys), large (60 keys), RTL

## 5. `libs/alphaTiles/feature-choose-player`

- [ ] 5.1 Scaffold `nx g @nx/react:lib feature-choose-player --directory=libs/alphaTiles/feature-choose-player --tags='type:feature,scope:alphaTiles'`
- [ ] 5.2 `ChoosePlayerContainer` (container):
  - [ ] 5.2.1 `useTranslation('chrome')`
  - [ ] 5.2.2 `useRouter()` from `expo-router`
  - [ ] 5.2.3 `usePlayers()`, `useLangAssets()` for `settings.numberOfAvatars`, `langInfo.nameInLocalLang`, `images.avataricons`
  - [ ] 5.2.4 Clamp `numberOfAvatars` to `[1, 12]`
  - [ ] 5.2.5 Compose `PlayerCardProps[]` + "add" slot
  - [ ] 5.2.6 Handlers: `onSelect(id)` → `selectPlayer(id)` + `router.replace('/menu')`; `onAdd()` → `router.push('/set-player-name?mode=create&avatarIndex=…')`; `onDelete(id)` → inline confirm flow
  - [ ] 5.2.7 Emit `track('player_selected', { id })` / `identify(id)` on select; `track('player_created', { avatarIndex })` on create entry
- [ ] 5.3 `ChoosePlayerScreen` (presenter): pure props → JSX. Renders heading + `UiAvatarGrid` / `UiPlayerCard` grid + "add" card + audio-instructions button (if pack ships `zzz_choose_player`)
- [ ] 5.4 Storybook stories for the presenter: empty, one player, N players, N with delete-confirm open, RTL

## 6. `libs/alphaTiles/feature-set-player-name`

- [ ] 6.1 Scaffold `nx g @nx/react:lib feature-set-player-name --directory=libs/alphaTiles/feature-set-player-name --tags='type:feature,scope:alphaTiles'`
- [ ] 6.2 `SetPlayerNameContainer`:
  - [ ] 6.2.1 Read query params (`mode`, `id`, `avatarIndex`) from `expo-router`
  - [ ] 6.2.2 Read `keyList`, `colorList`, `images.avatars`, `images.avataricons`, `names` from `useLangAssets()`
  - [ ] 6.2.3 Map `keyList` → `Array<{ text, colorHex }>` by indexing `colorList[parseInt(key.color)]`
  - [ ] 6.2.4 Name-state via `useState` (default: edit mode → existing name; create mode with `nameInLocalLang === 'custom'` → next unused name from `names`; else empty)
  - [ ] 6.2.5 `onKey(c)` handler — append if length < 20, else ignore
  - [ ] 6.2.6 `onBackspace` handler — slice last character
  - [ ] 6.2.7 Avatar-picker state (edit mode: prefill from player.avatarIndex; create mode: prefill from query param)
  - [ ] 6.2.8 `onSubmit` — trim, validate (too-short, too-long, duplicate), call `createPlayer` or `renamePlayer`, then `selectPlayer`, then `router.replace('/menu')`
  - [ ] 6.2.9 `track('player_name_submitted', { mode })`
- [ ] 6.3 `SetPlayerNameScreen`: renders avatar preview, name field, `UiCustomKeyboard` OR native `TextInput` (decided by `keys.length > 0`), inline error row, submit / cancel buttons
- [ ] 6.4 Storybook stories: create mode + custom kb, create mode + TextInput fallback, edit mode, validation error states

## 7. Expo-Router routes

- [ ] 7.1 Create `apps/alphaTiles/app/choose-player.tsx` — thin wrapper: `export { ChoosePlayerContainer as default } from '@alphaTiles/feature-choose-player'`
- [ ] 7.2 Create `apps/alphaTiles/app/set-player-name.tsx` — same pattern for `SetPlayerNameContainer`
- [ ] 7.3 Update the root router (`apps/alphaTiles/app/_layout.tsx` — or wherever boot-complete redirect lives) to read `activePlayerId` and `<Redirect>` to `/menu` or `/choose-player`

## 8. i18n chrome keys

- [ ] 8.1 Add `chrome:players.*` keys to `apps/alphaTiles/locales/en.json`:
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

- [ ] 9.1 `APP_LANG=eng nx start alphaTiles` boots to `/choose-player` on first run
- [ ] 9.2 Add a player → route to `/menu` (stub screen until `game-menu` lands)
- [ ] 9.3 Kill + relaunch → stays on `/menu` (active player restored)
- [ ] 9.4 Delete active player → next launch goes to `/choose-player`
- [ ] 9.5 On a pack with populated `aa_keyboard.txt` (tpx), custom keyboard renders; keystrokes append non-Latin characters
- [ ] 9.6 On a pack with empty `aa_keyboard.txt`, falls back to `TextInput`
- [ ] 9.7 `openspec validate player-profiles --strict` passes
- [ ] 9.8 `npx tsc --noEmit` passes across the workspace
- [ ] 9.9 `nx graph` shows no `ui-*` → `type:feature` or `ui-*` → `type:data-access` edges
