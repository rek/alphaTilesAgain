# ADR-010: Testing Strategy — Storybook + Jest Unit

**Date**: 2026-04-23
**Status**: Accepted

## Context

We need a testing strategy that:

- Fits v1 scope (one game class — `China` — ported end to end; single-dev-team velocity).
- Catches the high-cost defects in a literacy-game generator: bad pack parsing, bad scoring math, bad stages progression, broken visual layout of tiles/keyboards.
- Does not over-invest in infrastructure we're not ready to maintain (no e2e harness, no device farm).
- Maps cleanly onto the NX library taxonomy (`type:util`, `type:data-access`, `type:ui`, `type:feature`) with per-type rules that are easy to explain.

Over-testing slows v1 shipping. Under-testing risks regressions in the validator, parser, and scoring logic — exactly the code we least want to break and the hardest to manually verify.

## Decision

- **`type:util` and pure-logic `type:data-access` libs**: **Jest unit tests required.** Covers the validator (ADR-008), pack parser, scoring, stages progression, phoneme splitting, precompute. Fixtures driven by `languages/eng/`, `languages/tpx/`, `languages/template/`.
- **`type:ui` libs**: **Storybook stories required**, no mandatory unit tests. Visual review in Storybook (web) serves as the verification loop.
- **`type:feature` libs**: **No mandatory automated tests in v1.** Manual verification during development. (Future v2 change may add container/presenter integration tests.)
- **No Detox / Playwright e2e in v1.** Explicitly deferred.

## Rationale

The defect economics line up cleanly per library type:

- Pure logic is where subtle bugs hide and where unit tests are cheap and exhaustive. Worth the effort.
- Visual components break visually. Storybook gives a repeatable review surface without the cost of a full visual-regression harness.
- Feature libs glue everything together. Integration-level bugs are better caught by actually playing the game during dev than by brittle mocked tests of a React Native screen in Jest.
- End-to-end on a real device is where RN test infrastructure hurts most (flaky, slow, CI-fragile). We skip it for v1 rather than invest in a half-baked version.

### Pros

- Clear per-library-type rule — review-checklist friendly.
- Low maintenance load — no e2e flake, no snapshot pollution, no mock React Native stacks.
- Validator trust is earned the right way: unit tests against fixture packs (ADR-008).
- Storybook doubles as visual documentation — useful for recruiting contributors.
- Fixtures are shared: `languages/eng/` serves both the validator's own tests and feature parsers' tests.

### Cons

- Regressions in feature code (a routing fix that breaks game entry) are caught only by dev's manual play.
- Visual regressions in Storybook require the dev to actually open Storybook on a change — no automated diff.
- No cross-device test matrix (iOS-specific layout bugs, Android back-button handling) — deferred.

## Alternatives Considered

### Alternative 1: Full testing pyramid — unit + integration + e2e

Jest unit, React Testing Library for features, Detox or Playwright for e2e.

- **Why not**: Detox/Playwright setup for RN + Expo is a multi-week investment. The CI cost (emulator in the loop) is nontrivial. For a v1 with one ported game class, the ROI is inverted.

### Alternative 2: Storybook-only for everything

Cover UI in stories; skip unit tests for logic.

- **Why not**: Misses the validator trust boundary (ADR-008) — the validator is pure logic, not visual. Also skips the scoring/stages/phoneme engines, where bugs are silent.

### Alternative 3: Unit-only, no Storybook

Jest for everything; visual review by running the app.

- **Why not**: Visual regressions slip through — a padding change in a shared `ui-tile` component affects every game, but Jest unit tests on a styled component are low-signal. Storybook is the right level of coupling for UI.

### Alternative 4: Visual regression (Chromatic / Loki)

Storybook + automated image diff.

- **Why not**: Adds a third-party service and a CI gate that generates frequent false positives on font rendering / anti-aliasing across machines. Revisit in v2 if the cost lands.

## Consequences

### Positive

- `libs/shared/util-lang-pack-validator` (ADR-008) has full fixture-driven coverage — the load-bearing trust point is verified.
- `libs/shared/ui-*` components render in Storybook with representative props — works as living documentation.
- CI runs fast: Jest for unit libs, Storybook build for `type:ui` (smoke-ensures stories still compile).
- Contributors know the test story per library type at a glance.

### Negative

- Manual playtest is the only safety net for feature-lib regressions in v1. Document what to playtest per PR.
- No protection against a UI lib's Storybook rendering right but the in-app rendering breaking (e.g. due to native vs. web difference). Detectable manually; not by the current strategy.

### Neutral

- Storybook web is the canonical visual surface — stories target web first. Native preview is optional.
- `type:ui` libs pass pre-translated strings as props (ADR-006, `docs/ARCHITECTURE.md` §3) — stories pass plain English strings, no i18n provider needed.
- The three fixture packs (`eng`, `tpx`, `template`) are canonicalized as the test inputs for all logic libs.

## Implementation Notes

- Jest config lives at the repo root (`jest.preset.js`), per-lib `jest.config.ts` extends it.
- Storybook config lives in `libs/shared/ui-*/.storybook/` per library (or a shared preset). Start with the root `libs/shared/ui-*` libs — tile, keyboard-key, button. Game-specific `ui-*` libs get stories as they're created.
- Fixtures imported by path from `languages/eng/` etc. — tests that touch assets require a prebuild step before running (document in `GETTING_STARTED.md`). Tests that don't touch assets run standalone.
- Golden-file pattern for validator tests: expected issue lists committed per fixture pack (ADR-008).
- Feature-lib manual playtest: each OpenSpec change's `tasks.md` includes a "Manual verification" section listing the screens/flows to exercise before merge.
- Revisit: at the start of the second ported game class, re-evaluate whether to add container/presenter integration tests. Adding tests later is strictly easier than un-mocking e2e.

## References

- `docs/ARCHITECTURE.md` §15 (testing)
- `docs/PROJECT_ORGANIZATION.md` — NX library types that drive the rules
- ADR-008 (full validator port) — where fixture-driven unit tests pay off most
- ADR-006 (unified i18n) — why `type:ui` stories don't need an i18n provider
- Storybook for React Native Web docs
