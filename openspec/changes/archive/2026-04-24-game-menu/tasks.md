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

## 1. `libs/shared/ui-door`

- [ ] 1.1 Scaffold `nx g @nx/react:lib ui-door --directory=libs/shared/ui-door --tags='type:ui,scope:shared'`
- [ ] 1.2 Add `react-native-svg` dep at root (if not already present)
- [ ] 1.3 `DoorSvg.tsx` — the shared door SVG as a React component. Props: `fill`, `stroke`, `textColor`, `number`, `width`, `height`
- [ ] 1.4 `UiDoor.tsx` — composes `DoorSvg` with a `Pressable` wrapper. Props: `index: number`, `colorHex: string`, `visual: 'not-started'|'in-process'|'mastery'`, `onPress: () => void`, `a11yLabel: string`
- [ ] 1.5 Visual-state color rules:
  - `not-started` → fill `#FFFFFF`, stroke `colorHex`, textColor `colorHex`
  - `in-process` → fill `colorHex`, stroke none, textColor `#FFFFFF` (or `#000000` iff `noRightWrong` → caller passes a modified `visual` or explicit `textColorHex` override)
  - `mastery` → fill `#E0E0E0` (muted), stroke `colorHex`, textColor `colorHex`
- [ ] 1.6 Add explicit `textColorHex?: string` override prop for the black-text no-right-wrong case
- [ ] 1.7 No `react-i18next` import (lint-verified)
- [ ] 1.8 Storybook stories: each visual state × 3 tint colors, with and without text-color override

## 2. `libs/shared/ui-door-grid`

- [ ] 2.1 Scaffold `nx g @nx/react:lib ui-door-grid --directory=libs/shared/ui-door-grid --tags='type:ui,scope:shared'`
- [ ] 2.2 Props: `doors: Array<{ index: number; colorHex: string; visual: ..., textColorHex?: string; a11yLabel: string; }>`, `columns: number` (default 5), `page: number`, `totalPages: number`, `onDoorPress: (index: number) => void`, `onPrev: () => void`, `onNext: () => void`, `a11y: { prev: string; next: string }`
- [ ] 2.3 Render grid of `UiDoor` + pagination row (prev arrow, page indicator, next arrow)
- [ ] 2.4 Hide prev arrow on page 0; hide next arrow on final page
- [ ] 2.5 No `react-i18next` import
- [ ] 2.6 Storybook stories: 1 / 12 / 20 / 33 / 50 doors at various page indices

## 3. `libs/alphaTiles/feature-game-menu`

- [ ] 3.1 Scaffold `nx g @nx/react:lib feature-game-menu --directory=libs/alphaTiles/feature-game-menu --tags='type:feature,scope:alphaTiles'`
- [ ] 3.2 `deriveVisual.ts` — pure function per spec. Unit-tested with every state combination.
- [ ] 3.3 `useTrackerCounts.ts` — dynamic-require shim. Try-import `@alphaTiles/data-progress`; fall back to `() => ({})`. Add `@todo: wire to trackerCount` comment.
- [ ] 3.4 `useDoors.ts`:
  - [ ] 3.4.1 Read `gameList`, `colorList`, `settings.doorsPerPage` (default 20, clamp `[6, 40]`), fallback no-right-wrong class list
  - [ ] 3.4.2 Read `trackerCounts = useTrackerCounts(activePlayerId)`
  - [ ] 3.4.3 Compose `Door[]` — one per `gameList` entry with pre-resolved `colorHex`, derived `visual`, effective `noRightWrong`
  - [ ] 3.4.4 Slice into the current page based on `page` state
  - [ ] 3.4.5 Return `{ pageDoors, totalPages, doorsPerPage }`
- [ ] 3.5 `GameMenuContainer.tsx`:
  - [ ] 3.5.1 `useRouter()`, `useActivePlayer()`, `useLangAssets()`, `useTranslation('chrome')`, `usePlayersStore` for `clearActivePlayer`
  - [ ] 3.5.2 Redirect to `/choose-player` via `<Redirect href="/choose-player" />` when `activePlayer === null`
  - [ ] 3.5.3 `useState<number>(0)` for current page
  - [ ] 3.5.4 Compose `useDoors()` output + a11y labels + handlers
  - [ ] 3.5.5 `onDoorPress(door)` → `track('door_opened', …)` + `router.push('/games/[classKey]', { classKey, doorIndex, challengeLevel })`
  - [ ] 3.5.6 `onBack()` → `clearActivePlayer()` + `router.replace('/choose-player')`
  - [ ] 3.5.7 Utility-icon handlers → `router.push('/about')`, `router.push('/share')`, `router.push('/resources')`
  - [ ] 3.5.8 Audio-instructions handler → call `playInstruction('zzz_earth')` from `data-audio`
- [ ] 3.6 `GameMenuScreen.tsx` — presenter. Props: `player: { name; avatarSrc }`, `doors`, pagination, handlers, utility flags, a11y labels. Pure props → JSX. No hooks, no i18n.
- [ ] 3.7 Unit tests:
  - [ ] 3.7.1 `deriveVisual` — every state combination (x4)
  - [ ] 3.7.2 `useDoors` — empty gameList, single-page, multi-page, clamping `doorsPerPage`, color-index OOB, noRightWrong fallback
  - [ ] 3.7.3 Back-arrow clears active + replaces route (spied hooks)
- [ ] 3.8 Storybook stories for presenter: 1-page / 2-page / all-mastered / all-not-started / with-share / no-share / RTL

## 4. Route and i18n

- [ ] 4.1 Create `apps/alphaTiles/app/menu.tsx` — thin `export { GameMenuContainer as default }`
- [ ] 4.2 Add `apps/alphaTiles/assets/images/door.svg` (source SVG)
- [ ] 4.3 Add chrome i18n keys to `apps/alphaTiles/locales/en.json`:
  - `menu.score` — `"Score: {{points}}"`
  - `menu.a11y.door` — `"Game {{index}}, {{state}}"`
  - `menu.a11y.prev` — `"Previous page"`
  - `menu.a11y.next` — `"Next page"`
  - `menu.a11y.back_to_players` — `"Back to player selection"`
  - `menu.a11y.about` — `"About"`
  - `menu.a11y.share` — `"Share"`
  - `menu.a11y.resources` — `"Resources"`
  - `menu.a11y.audio_instructions` — `"Play audio instructions"`

## 5. Asset-loader contract additions (cross-ref `lang-pack-parser`)

_(This change depends on the parser exposing a few boolean flags. Coordinate with `lang-pack-parser` to add them.)_

- [ ] 5.1 `langAssets.hasShare: boolean` — true iff `aa_share.txt` has content past the header row
- [ ] 5.2 `langAssets.hasResources: boolean` — same for `aa_resources.txt`
- [ ] 5.3 `langAssets.hasEarthInstructions: boolean` — true iff `audio/instructions/zzz_earth.mp3` exists
- [ ] 5.4 `langAssets.gameList[i].noRightWrong: boolean` — column-driven with hardcoded fallback `['romania','sudan','malaysia','iraq']`
- [ ] 5.5 `langAssets.gameList[i].classKey: string` — lowercased `Country` value
- [ ] 5.6 `langAssets.settings.doorsPerPage: number` — parsed from `aa_settings.txt "Doors per page"`, default 20, clamp `[6, 40]`

## 6. Verification

- [ ] 6.1 `APP_LANG=eng nx start alphaTiles` → loading → choose-player → pick player → `/menu` shows correct door count for eng pack
- [ ] 6.2 Door press logs `track('door_opened', …)` and routes to `/games/<classKey>` (placeholder page until `game-engine-base` lands)
- [ ] 6.3 Pagination works end-to-end for `eng` (if >20 games) or a synthetic pack with 30 games
- [ ] 6.4 Back arrow clears `activePlayerId` and returns to `/choose-player`
- [ ] 6.5 Utility-icon visibility matches pack content on `eng` (has share) and `template` (no share)
- [ ] 6.6 RTL build (Arabic pack when available) — doors arrange RTL, arrows direction-correct
- [ ] 6.7 `openspec validate game-menu --strict` passes
- [ ] 6.8 `npx tsc --noEmit` passes
- [ ] 6.9 Storybook renders all stories cleanly
