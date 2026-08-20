## Why

Issue #43 proposed splitting content into named "adult" / "children" tracks. Reviewer feedback (Curtis-LeadM, [issue #43 comment](https://github.com/rek/alphaTilesAgain/issues/43#issuecomment-5350983867)) rejects the naming as misleading and age-stigmatizing ("reading ability is not age"), and proposes instead: gradually increasing difficulty the learner/tutor can self-place into, plus a simple explanation of where to start. This is the correct direction — the app already has an implicit difficulty ladder (issue #13's 6-tier mechanic mapping, `stages` spec's 7-stage per-word progression) but never surfaces it. This change makes that ladder visible instead of inventing a parallel track taxonomy.

## What Changes

- Tag each game mechanic (door) with its curriculum tier (0–6, per issue #13's ladder: passive exposure → symbol scan → cross-modal match → whole-word recognition → construction → decoding/analysis → spatial puzzle), as a static engine-level mapping keyed by mechanic/`classKey` — not pack-authored, not per-language.
- Surface tier as a neutral numeric "Level" indicator on `/menu` doors (no age or audience label), and order/group doors by tier so progression is visually obvious.
- Add a lightweight, persistent "where to start" explainer reachable from `/menu` (info affordance) — short, tutor-facing copy on how tiers work. Does not duplicate the one-shot `onboarding-tutorial` walkthrough (that change, still unapplied, stays first-launch-only); this is an always-available reference.
- Explicitly drop: named tracks, age-based branching, per-track wordlist/content tagging. Content-context variants (e.g. adult daily-phrase wordlist from issue #40) remain a content-authoring concern, untouched by this change.

## Capabilities

### New Capabilities
- `placement-guidance`: tier metadata for game mechanics, tier display on the menu, and the persistent "where to start" explainer.

### Modified Capabilities
- `game-menu`: door rendering gains a tier indicator and tier-based ordering; requirements for door layout change.

## Impact

- `libs/alphaTiles/feature-game-menu` (or equivalent menu feature lib): door data gains `tier`, presenter renders it.
- New small util lib (e.g. `libs/shared/util-curriculum-tiers` or `libs/alphaTiles/util-curriculum-tiers`) holding the static `classKey → tier` map, following the existing `classKey` fallback pattern already used for `noRightWrong`.
- No changes to `data-players`, `stages`/`util-stages` (per-word difficulty engine untouched), or pack file schemas.
- Coordinates with, but does not merge into, the pending `onboarding-tutorial` change.
- Supersedes issue #43 as proposed; addresses the reviewer's simplified direction. Does not touch issue #40 (adult content authoring) or #44 (game-names toggle), though #44's settings-screen precedent (persisted per-player prefs pattern) is noted for any future preference here.
