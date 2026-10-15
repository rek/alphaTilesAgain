## 1. Tier data

- [x] 1.1 Create `libs/alphaTiles/util-curriculum-tiers` (`type:util`, `scope:alphaTiles`)
- [x] 1.2 Add static `classKey → tier` map (0–6) per issue #13's ladder
- [x] 1.3 Add `tierForGame(classKey): number` with default tier `3` for unmapped keys
- [x] 1.4 Unit tests: mapped mechanic, unmapped mechanic default

## 2. Menu door ordering + badge

- [x] 2.1 In `useDoors`/`buildDoors`, keep `door.index` computed exactly as today (raw `aa_games.txt` row order, `i + 1`) — do NOT derive it from any sort
- [x] 2.2 Add a separate tier-sort step for **grid/render position only**: sort `allDoors` by `(tierForGame(classKey), original index)` before pagination slicing; each door keeps its own unchanged `index`
- [x] 2.3 Add `tier`/badge text (i18n key `menu.level`, interpolated) to door props, derived from `tierForGame(classKey)`
- [x] 2.4 Presenter renders the tier badge on each door; verify no `useTranslation` in presenter (container pre-translates)
- [x] 2.5 Regression-check: pressing a door after tier reordering still sends the door's original `index` as `doorIndex`, and `GameShellContainer`'s `assets.games.rows[doorIndex - 1]` lookup still resolves the pressed game (not the grid-adjacent one) — add an explicit test for a pack where tier order differs from file order
- [x] 2.6 Update/extend `game-menu` tests: tier grouping order, badge text, empty-gameList unchanged, `index`/`doorIndex` invariance under reordering

## 3. Placement-guidance explainer

- [x] 3.1 Decide library placement (standalone `feature-placement-guidance` vs. addition to menu feature) per design D4 open question
- [x] 3.2 Add info affordance ("?") to `/menu`
- [x] 3.3 Add modal/sheet presenter with static band descriptions (3 bands: 0–1, 2–3, 4–6)
- [x] 3.4 New i18n namespace `placementGuidance` (device-locale only, no lang-pack content) with band copy + badge/level strings
- [x] 3.5 No persisted "seen" flag — verify reopening works every time
- [x] 3.6 Copy review: confirm no age/audience terms anywhere (badge, explainer, i18n keys)

## 4. Docs + cleanup

- [x] 4.1 Document the `classKey → tier` map maintenance step in `docs/GAME_PATTERNS.md` (new mechanic ⇒ add tier entry)
- [x] 4.2 Note in release notes that door display order changed (identity unchanged) — text drafted in design.md "Release note"; no release-notes file in repo, owner to publish
- [x] 4.3 Close out issue #43 referencing this change; link this change in the issue — owner (GitHub)
