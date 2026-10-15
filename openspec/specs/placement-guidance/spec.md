# placement-guidance Specification

## Purpose
TBD - created by archiving change difficulty-ladder-onboarding. Update Purpose after archive.

## Requirements

### Requirement: Curriculum tier lookup by mechanic

The engine SHALL expose `tierForGame(classKey: string): number` returning a tier `0..6` for a game mechanic, sourced from a static map keyed by `classKey` (mirroring the existing `classKey` fallback pattern used for `noRightWrong`). Mechanics without a mapped `classKey` SHALL default to tier `3`.

#### Scenario: Mapped mechanic

- **WHEN** `tierForGame('romania')` is called
- **THEN** it returns `1`

#### Scenario: Unmapped mechanic

- **WHEN** `tierForGame('unknown-future-mechanic')` is called
- **THEN** it returns `3`

### Requirement: Persistent "how levels work" explainer

`/menu` SHALL render an info affordance that, when activated, shows a short static explanation of the tier ladder grouped into bands (not per-tier, not per-game). The explainer SHALL be reachable at any time, independent of first-launch state, and SHALL NOT set or read any "seen" flag.

#### Scenario: Open explainer

- **WHEN** the learner or tutor activates the info affordance on `/menu`
- **THEN** a modal/sheet opens showing band descriptions (e.g. listening/matching, whole-word recognition, spelling/analysis/puzzles)

#### Scenario: Reopen after previously closing

- **WHEN** the explainer has been opened and closed once already
- **THEN** activating the info affordance again opens it again, unchanged

### Requirement: No age or audience labeling

The tier indicator and explainer SHALL use only neutral numeric/skill-based language ("Level", tier numbers, skill-band descriptions). They MUST NOT reference age, grade, or audience category (e.g. "adult", "children", "kids").

#### Scenario: Badge text

- **WHEN** a door's tier badge is rendered
- **THEN** its text matches the i18n key `menu.level` interpolated with a number only, with no age/audience term anywhere in the string
