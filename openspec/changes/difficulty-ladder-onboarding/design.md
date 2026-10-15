## Context

Issue #43 asked for parallel "adult"/"children" tracks. Feedback rejected the naming and the parallel-track shape, proposing a single graduated ladder the learner/tutor self-places into. The ladder isn't new: issue #13 already mapped the 17 shipped mechanics onto a 6-tier skill progression (0 passive exposure → 6 spatial puzzle), and `stages` (`libs/alphaTiles/util-stages`) already grades word difficulty within a single game session on a 7-stage ratchet. Neither is visible to the player today — `/menu` (`game-menu` spec) shows doors keyed only by `aa_games.txt` file order, color, and mastery state.

This change makes the tier ladder a first-class, visible ordering on `/menu`, plus a short always-available explainer, without introducing any new content track or age label.

### Required reading for implementers

- `docs/ARCHITECTURE.md` §3 (taxonomy), §11 (container/presenter)
- `docs/GAME_PATTERNS.md`
- `openspec/specs/game-menu/spec.md`
- `openspec/specs/stages/spec.md` (context only — untouched by this change)
- `openspec/changes/onboarding-tutorial/` (coordination only — untouched by this change)
- Issue #13 (tier ladder source), issue #43 + linked comment (rejected direction + accepted direction)

## Goals / Non-Goals

**Goals:**
- Make the existing tier ladder visible on `/menu` as a neutral numeric "Level" indicator.
- Order/group doors by tier so progression is self-evident without reading documentation.
- Provide a short, persistent, tutor-facing "how levels work" explainer reachable from `/menu` at any time (not just first launch).
- Keep tier metadata engine-owned (per mechanic/`classKey`), not pack-authored — every language pack gets the same ladder for free.

**Non-Goals:**
- No named tracks, no age-based labels or branching anywhere in the UI.
- No changes to `stages`/`util-stages` (per-word difficulty is a different, already-solved layer).
- No changes to wordlist authoring, content tagging, or pack schema — content-context variants (issue #40) stay a content concern.
- No merge into or duplication of the pending `onboarding-tutorial` one-shot walkthrough — this explainer is a separate, always-available surface.
- No new persisted per-player preference (tier ordering is a global display concern, not per-player state).

## Decisions

### D1. Tier data lives in the engine, keyed by `classKey`

Add `libs/alphaTiles/util-curriculum-tiers` (`type:util`) exporting a static `classKey → tier (0–6)` map and a `tierForGame(classKey): number` lookup, mirroring the existing `classKey` fallback list pattern used for `noRightWrong` in `game-menu`. Tiers come from issue #13's mapping (verbatim: Romania=1, Thailand/Georgia=2, Peru/Ecuador/Mexico=3, Brazil/Colombia/Italy=4, Chile/Japan=5, Myanmar/China=6, Sudan/Iraq/Malaysia=0). Games without a mapped `classKey` default to tier 3 (mid-ladder) rather than crashing or hiding.

**Alternative considered**: pack-authored tier column in `aa_games.txt`. Rejected — tier is a property of the mechanic (shared across every language pack), not pack content; pack authors shouldn't have to assign it, and it would drift from issue #13's canonical mapping.

### D2. Menu ordering: group by tier for grid position only; `doorIndex` stays raw file order

`/menu`'s door *grid position* is re-sorted by `(tier, original aa_games.txt index)`. This is a **presentation-only** reorder: `door.index` (1-based, = raw `aa_games.txt` row position) is computed exactly as today, before any tier sort, and is what gets sent as `doorIndex` on press and shown as the door's number badge. Tier grouping changes *where on the grid* a door sits and adds the "Level N" badge; it must not change `index`.

This distinction is load-bearing: `GameShellContainer` and other downstream readers resolve all per-door state via `assets.games.rows[doorIndex - 1]` (raw file-order lookup — see `docs/GAME_PATTERNS.md` "Door-press navigation contract" and its shell-side counterpart). `useDoors.ts` currently sets `door.index = i + 1` from `gameRows.map` order for exactly this reason. Renumbering `index` from tier-sorted position (as originally drafted here) would desync the badge/routed `doorIndex` from the row it actually opens — pressing a door would launch the wrong game. `buildDoors` therefore computes `allDoors` with `index` unchanged, then derives a separate `displayOrder`/grid-position sort for rendering; pagination (`doorsPerPage` slicing) operates on the tier-sorted sequence, not on `index`.

The door's visible number badge continues to show `index` (raw file position, per the existing unmodified "Door grid derived from `aa_games.txt`" scenario wording) — it will not always read 1..N in strict grid order once grouped by tier, which is acceptable: the number identifies the door, the new "Level N" badge (D3) communicates progression, and grouping communicates order visually without requiring the numbers to be contiguous.

**Alternative considered**: leave file order untouched and only annotate with a tier badge. Rejected — feedback specifically asked for a way to "discern where they should start," which needs visual grouping, not just a label learners must interpret.

**Alternative considered**: renumber `index` post-sort and thread the tier-sorted position through to `GameShellContainer` as a translation layer. Rejected — `docs/GAME_PATTERNS.md` caps the menu push at exactly `{ classKey, doorIndex, challengeLevel }` with `doorIndex` as the raw row lookup key; changing that contract is a much larger, riskier change than this proposal's scope, and `classKey` (already passed) makes it unnecessary — the shell doesn't need `index` to mean "grid position."

### D3. Tier indicator is a neutral "Level N" badge

Rendered on each door as small text/badge, sourced from `tierForGame`, i18n key `menu.level` with `{{n}}` interpolation (e.g. "Level 2"). No color-coding by age, no icon implying audience.

### D4. Explainer is a persistent info affordance, not a flow

Add a small "?" / info button on `/menu` (new `feature-placement-guidance` container + presenter, or a light addition to the existing menu feature — implementer's call at task time) that opens a short static modal/sheet: 1–2 sentences per tier band (e.g. "Levels 0–1: listening and matching sounds" / "Levels 2–3: recognizing whole words" / "Levels 4–6: spelling, analyzing, and puzzles"), device-locale i18n only (same pattern as `onboarding-tutorial`'s `onboarding` namespace — new `placementGuidance` namespace). No dismissal-tracking, no persisted flag — it's reference material, always reachable.

**Alternative considered**: extend `onboarding-tutorial`'s card sequence with a tier card. Rejected per non-goal — that flow is one-shot and skippable; tutors coming back later (per Curtis-LeadM's "coaching before install" point) need something they can reopen anytime.

## Risks / Trade-offs

- **Re-sorting grid position changes muscle memory for existing installs** (a returning player's door moves on screen) → mitigate: documented in release notes; door *identity and number badge* (`index`, `doorIndex`) are unchanged, only grid position.
- **`index`/`doorIndex` no longer read as a contiguous 1..N sequence in grid order once tier-grouped** → acceptable trade-off (see D2); must not be "fixed" by renumbering, which would break the `assets.games.rows[doorIndex - 1]` lookup contract.
- **Tier map is a hand-authored constant, can drift from future new mechanics** (issue #13's next 20 proposals) → mitigate: `tierForGame` defaults unmapped `classKey`s to tier 3 instead of failing, and adding a mechanic requires a one-line map entry (documented in `GAME_PATTERNS.md` as part of task work).
- **Scope creep temptation to fold in issue #42 (self-test) or #44 (game-names toggle)** → explicitly out of scope; this change only touches ordering/labeling and the explainer.

## Implementation decisions (#52, 2026-10)

Choices the decisions above left open, made at apply time. Simplest sound option each.

- **I1 Tier is a Door field.** `Door.tier = tierForGame(classKey)` in `doorsOf` (`@alphaTiles/data-doors`) — ARCHITECTURE "a new per-door fact is one field in `doorsOf`". Nobody calls `tierForGame` outside the catalogue. Still engine-owned per D1: no `aa_games.txt` column, no pack edit.
- **I2 Classes #13's table names but D1's list omitted / classes newer than #13.** `united-states` = 4 (in #13's table, construction/keyboard). `taiwan` (stroke-order tracing, #13 proposal #21, shipped later) = 4: producing a character stroke by stroke is construction. Unmapped default stays 3.
- **I3 One ordering function.** `ladderOrder(doors)` (data-doors): stable sort by `(tier, index)`, returns a new array, never touches `index`. `useLadderDoors()` memoizes it. The menu (`buildMenuDoors`) and the shell's next-door search both use it.
- **I4 Play order = ladder order.** Mastery mode 3 ("celebrate, then next door") searches `nextUnmasteredDoor({ order: useLadderDoors() })`, so "next" is the next door on screen, not the next file row. Spec delta: `specs/game-engine` (Celebration requirement).
- **I5 Pagination.** The shipped menu (`GameMenuScreenModern`) is one scrolling grid; the paged classic screen is disabled. D2's "pagination slices the tier-sorted sequence" holds trivially — sorting happens before the presenter.
- **I6 Badge.** Small "Level N" text in the card's top-start corner (mastery tick stays top-end), same colour as the door number. Door a11y label gains the level: `menu.a11y.door_with_level` = `{{door}}, {{level}}`.
- **I7 i18n keys live in `chrome`.** Only the `chrome` namespace exists for UI text (the `onboarding` namespace never landed), so "namespace `placementGuidance`" = `chrome:placementGuidance.*`; badge = `chrome:menu.level`. zh-HK badge is 第 N 階, not 級, because the shell header already says 第 N 級 for a game's own challenge level (`game_door_level`). English "Level" collides with that header (flagged to owner).
- **I8 Explainer placement (open question 2).** Inside `feature-game-menu`: `PlacementGuidanceSheet` presenter (RN `Modal`) + one `useState` in `GameMenuContainer`; opened by a "?" (help-circle) button at the end of the top bar. Surface is trivial, so no new lib.
- **I9 Bands (open question 1).** 3 bands — 0–1 listen & explore, 2–3 match & recognise, 4–6 build & solve — each with a "start here if…" line by reading skill, plus a one-line "move up when…" tip. Copy in `locales/*.json`, zh-HK rows in `docs/translations/zh-HK-review.md` (content review pending there).
- **I10 Not built.** No placement step, no stored per-player tier/start choice (Non-goals: no new preference). Tutors place learners by reading the sheet and picking a door.

### yue door → tier (derived, 28 doors)

| Tier | Doors (`aa_games.txt` row) | Class |
|---|---|---|
| 0 | 26, 27, 28 | Malaysia, Sudan (S), Iraq — browse/hear |
| 1 | — | (no Romania door in yue) |
| 2 | 1–5, 16–19 · 9–11 | Thailand (picture/word/audio match) · Georgia S (syllable listen-and-tap) |
| 3 | 12–14 · 15 | Mexico (memory pairs) · Ecuador (word→image) |
| 4 | 6–8 · 20–22 · 23 · 24–25 | Taiwan (stroke order) · Colombia S (build word) · Brazil S (missing syllable) · Italy T/S (lotería) |
| 5–6 | — | (no Chile/Japan/Myanmar/China door in yue) |

Grid order: 26 27 28 · 1 2 3 4 5 9 10 11 16 17 18 19 · 12 13 14 15 · 6 7 8 20 21 22 23 24 25. Pinned by `doorsOf.test.ts` ("ladder order") and `buildMenuDoors.test.ts` (real yue pack: every pressed door routes to the row it shows).

### Release note

"Menu doors are now grouped by difficulty level (Level 0–6, shown on each door) with a "?" guide to where to start. Door numbers, progress and game content are unchanged; doors may sit in a different place on the menu. After mastering a game, "next game" now follows the level order."

## Open Questions

- ~~Tier→band grouping text~~ — resolved I9 (3 bands). Copy still needs content/PM review (zh-HK review sheet).
- ~~Info affordance placement~~ — resolved I8 (inside `feature-game-menu`).
