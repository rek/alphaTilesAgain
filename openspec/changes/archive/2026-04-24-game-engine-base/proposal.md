## Why

The Android original centralizes every shared game behavior — score counter, tracker-icon progression, back navigation, audio-replay button, stage advancement, player-prefs read/write, RTL flipping, correct / incorrect / final sound orchestration — in a single 1200-line abstract class (`GameActivity.java`). Every concrete game class (`China`, `Chile`, `Thailand`, …, 17 in total) extends it and only overrides the mechanic-specific surface.

Porting that lifecycle is the single biggest infrastructure change in the port. Without it, no concrete game can be ported, because each concrete game assumes the shared shell is already in place (trackers increment through it, audio plays through it, stage selection reads from it, player-progress persists through it, celebration triggers from it).

This change establishes the shared engine — the React/RN equivalent of `GameActivity` — plus the supporting utility, data-access, and presentational libraries it needs. The very next change (`game-china`) ports a concrete game on top of it and proves the architecture end-to-end.

## What Changes

- Add `libs/alphaTiles/feature-game-shell` — `<GameShellContainer>` + `<GameShellScreen>`. Hosts any mechanic as children, owns back navigation, audio-replay button, score bar, tracker-icon row, stage advancement, celebration trigger, pause-on-background, player-prefs read/write. Ports `GameActivity`'s shared lifecycle.
- Add `libs/alphaTiles/util-scoring` — pure: `addPoint`, `computeTrackerCount`, `isGameMastered`, `pointsForStage`, plus the `NO_TRACKER_COUNTRIES` guard (Romania, Sudan, Malaysia, Iraq).
- Add `libs/alphaTiles/util-stages` — pure: `computeStageCorrespondence`, `tileStagesLists`, `wordStagesLists`, `selectWordForStage`. Mirrors `Start.java`'s `buildTileStagesLists` / `buildWordStagesLists` / the stage-ratchet logic inside `chooseWord`.
- Add `libs/alphaTiles/util-phoneme` — pure: `parseWordIntoTiles(word, tileList, scriptType)` and a `registerScriptParser(name, fn)` registry. Ships the default unidirectional parser; Thai / Lao / Khmer / Arabic (and future Devanagari / Chinese) parsers hook in via the registry, not the core fn.
- Add `libs/alphaTiles/data-progress` — Zustand store w/ persist. Keyed by `uniqueGameLevelPlayerModeStageID` (matches Java's `country + challengeLevel + playerString + syllableGame + stage`). Holds `{ points, trackerCount, checked12Trackers, lastPlayed }`.
- Add `libs/shared/ui-tile` — presentational tile: text or image, tint, pressed state, onPress. Variants: word-image tile, audio-button tile, upper-case tile.
- Add `libs/shared/ui-game-board` — generic N-cell portrait-oriented board; accepts children.
- Add `libs/shared/ui-celebration` — Lottie-based mastery animation. Single content-neutral confetti JSON bundled at `apps/alphaTiles/assets/lottie/celebration.json`. Adds `lottie-react-native` as a new runtime dep.
- Add `libs/shared/ui-score-bar` — score + game-number + challenge-level + 12 tracker icons row; accepts pre-translated strings.
- Extend `apps/alphaTiles/` with a dep on `lottie-react-native` and a bundled `assets/lottie/celebration.json`.

## Capabilities

### New Capabilities

- `game-engine` — shared `<GameShellContainer>` lifecycle: mount, unmount, back nav, audio replay, pause-on-background, celebration trigger, mechanic slot.
- `scoring` — points + tracker-count accumulation, mastery detection, no-tracker-country guard.
- `stages` — stage-indexed tile and word lists, correspondence-ratio weighting, stage ratchet when selected stage is empty.
- `phoneme` — script-typed word→tile decomposition + parser registry.
- `progress` — per-player per-game per-stage persistent progress store.
- `tile-ui` — presentational tile component contract.
- `game-board-ui` — presentational board-layout contract.
- `celebration` — presentational mastery-animation component contract.

### Modified Capabilities

_None_ — `precompute-registry` (from `port-foundations`) is consumed as-is by this change; no requirement in it is modified.

## Impact

- **New libs**: 8 (`feature-game-shell`, `util-scoring`, `util-stages`, `util-phoneme`, `data-progress`, `ui-tile`, `ui-game-board`, `ui-celebration`, `ui-score-bar`). Each has `project.json`, `src/index.ts`, tags per `docs/PROJECT_ORGANIZATION.md`.
- **New runtime deps**: `lottie-react-native` (celebration animation). No other additions — the engine reuses `expo-audio`, `expo-router`, `zustand`, `react-i18next`, `i18next` from earlier changes.
- **New bundled asset**: `apps/alphaTiles/assets/lottie/celebration.json` (content-neutral confetti, one file shared across all packs).
- **No breaking changes** — this change layers new libs on top of `port-foundations`, `lang-assets-runtime`, `audio-system`, `i18n-foundation`, `analytics-abstraction`, `theme-fonts`, `player-profiles`. Consumes their exports; does not modify them.
- **Unblocks**: `game-china` (the very next change) and every future concrete-game change (`game-chile`, `game-thailand`, …).
- **Risk: `GameActivity`'s method surface is broad** — 1200 lines, ~40 methods. Mitigation: design.md lists every Java method and its TS mapping (or an explicit "skip — dev-only hack" / "moved to util-X" note). Nothing is silently dropped.

## Out of Scope

- Any concrete game's mechanic — `game-china` lands immediately after; other games (`Chile`, `Thailand`, …) are each their own future change per `docs/ARCHITECTURE.md §17`.
- Game-menu UI (the `Earth` / game-picker screen) — handled by the separate `game-menu` change.
- Thai / Lao / Khmer / Arabic / Devanagari / Chinese tile parsers — the registry is shipped here; concrete non-default parsers are future work per-pack.
- Deep-link / share-a-screenshot — handled by `about-share-resources-screens`.
- The `Testing.tempSoundPoolSwitch` Java toggle — dev-only hack; explicitly not ported.
- E2E testing of the full lifecycle — v1 is manual per ADR-010.
