# Tasks

Implement per-player stats screen and supporting aggregation hooks.

## 0. Preflight

- [ ] Read `proposal.md` and `design.md`.
- [ ] Read `data-progress/src/lib/useTotalPoints.ts` (or equivalent file) for the existing aggregation pattern.
- [ ] Read `feature-choose-player/src/` to locate the player detail view.

## 1. data-progress: New Hooks

- [ ] Implement `libs/alphaTiles/data-progress/src/lib/useTotalTrackers.ts` per design D2.
- [ ] Implement `libs/alphaTiles/data-progress/src/lib/useLastPlayed.ts` per design D2.
- [ ] Export both from `libs/alphaTiles/data-progress/src/index.ts`.
- [ ] Unit tests: empty store → `useTotalTrackers` returns 0, `useLastPlayed` returns 0.
- [ ] Unit tests: multiple entries for one player → sums and max are correct.
- [ ] Unit tests: entries for other players are excluded.

## 2. feature-player-stats: Library & Route

- [ ] Generate library: `./nx g @nx/react-native:lib feature-player-stats --directory=libs/alphaTiles/feature-player-stats --tags='type:feature,scope:alphaTiles'`.
- [ ] Add path alias to `tsconfig.base.json`.
- [ ] Create route `apps/alphaTiles/app/player-stats.tsx` rendering `<PlayerStatsContainer />`.

## 3. PlayerStatsScreen (Presenter)

- [ ] Define `PerGameRow` and `PlayerStatsScreenProps`.
- [ ] Implement `<PlayerStatsScreen>`: header block (player name + 3 stat values), then a list of per-game rows.
- [ ] No `react-i18next` import in presenter.
- [ ] Storybook stories: `never played`, `single game`, `many games`.

## 4. PlayerStatsContainer

- [ ] Implement `<PlayerStatsContainer>`:
  - Reads `playerId` from `useLocalSearchParams()`.
  - Hooks: `usePlayersStore` selector for name; `useTotalPoints`, `useTotalTrackers`, `useLastPlayed`.
  - Builds `rows: PerGameRow[]` from `useProgressStore` filtered by `playerId`, sorted `lastPlayed` desc.
  - Formats `lastPlayedLabel` via `Intl.DateTimeFormat`; "—" when 0.
  - Pre-translates labels via `useTranslation('playerStats')`.
  - `onBack` → `router.back()`.

## 5. Navigation Entry

- [ ] Add a "Stats" button to the player detail view in `feature-choose-player`.
- [ ] Wire to `router.push({ pathname: '/player-stats', params: { playerId } })`.

## 6. i18n

- [ ] Add `playerStats` namespace with English keys: `totalPoints`, `totalTrackers`, `lastPlayed`, `perGame`, `points`, `trackers`, `neverPlayed` (em-dash literal — translation key still allowed).

## 7. Verification

- [ ] Type-check: `npx tsc --noEmit -p libs/alphaTiles/feature-player-stats/tsconfig.lib.json`.
- [ ] Type-check: `npx tsc --noEmit -p libs/alphaTiles/data-progress/tsconfig.lib.json`.
- [ ] Lint: `nx lint alphaTiles-feature-player-stats` and `nx lint alphaTiles-data-progress`.
- [ ] Unit tests pass for both libs.
- [ ] Smoke test (Web): play a few rounds, navigate to stats, verify totals and per-game rows.
- [ ] Smoke test: brand-new player with zero plays → zeros and "—".
