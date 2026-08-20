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

## Open Questions

- Exact tier→band grouping text for the explainer (3 bands vs. 7 individual tier descriptions) — recommend 3 bands (0–1, 2–3, 4–6) for brevity; confirm with content/PM before writing copy.
- Whether the info affordance lives inside `game-menu`'s existing feature lib or as a standalone `feature-placement-guidance` lib — recommend standalone per one-function/one-concern library convention, but a small addition to the menu feature is acceptable if the surface stays trivial.
