## Why

There are no automated end-to-end tests. Regressions in boot, player creation, game navigation, and answer scoring are caught only by manual QA — slow, inconsistent across contributors, and skipped under time pressure. A golden-path Maestro suite gives the team fast, deterministic signal on every PR.

## What Changes

- Add top-level `e2e/maestro/` directory with four golden-path flow files.
- Wire `testID` props on the four key interactive elements so Maestro can target them stably.
- Add NX target `e2e:maestro` to `apps/alphaTiles/project.json` running `maestro test e2e/maestro/`.
- Add GitHub Actions job that boots an iOS simulator and runs the suite on every PR.

## Capabilities

### New Capabilities

- `e2e-tests-maestro` — golden-path Maestro flows covering boot → player creation → game door tap → game load → correct answer → points increment → back navigation.

## Impact

- New `e2e/maestro/` directory at repo root (four `.yaml` flow files).
- `testID` props added to: player avatar tile, game door tile, game tile in board, back button in shell.
- `apps/alphaTiles/project.json` gains one NX target.
- New GitHub Actions workflow (or job) runs on every PR.
- No changes to runtime game logic, scoring, or persistence.
- No new runtime deps.

## Out of Scope

- Android simulator runs (iOS only v1).
- Per-game full-game-completion flows.
- Performance benchmarks or screenshot diffing.
- Maestro Cloud or EAS-hosted runs (local simulator only v1).
- Testing non-golden error paths (wrong answers, network errors).

## Unresolved Questions

- Which specific game is used in flow 2–3? (China assumed as simplest; confirm.)
- Are `testID` props safe to add to existing presenter components without breaking storybooks or snapshot tests?
- GitHub Actions iOS simulator image — `macos-14` with Xcode 15 assumed; confirm availability in org.
