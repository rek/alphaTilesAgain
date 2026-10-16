# Tasks

Golden-path E2E. Scope changed (see design.md "D7. Split: WebMCP vs Maestro"): web-automatable checks moved to a WebMCP + Playwright project; Maestro keeps only what needs a native runtime. Re-validated against current code: routes in `apps/alphaTiles/app`, one game route `games/[classKey]`, door grid in `feature-game-menu`, choose-player / set-player-name / settings / self-test screens. Android (`yue-apk`, `com.makektm.alphatiles`) is the Maestro target, not iOS-only.

## 0. Preflight

- [x] Read `proposal.md` and `design.md` in full.
- [ ] Confirm Maestro CLI installable in CI environment — moved: no CI job (manual only), documented in docs/TESTING.md. — pending: device/emulator run
- [x] Identify door tile component: `ModernDoorCard` in `libs/alphaTiles/feature-game-menu/src/GameMenuScreenModern.tsx` (+ classic `UiDoor`).
- [x] Default pack for flows is `yue` (not China); door 1 is Thailand.

## 1. Maestro Setup (native only)

- [x] `e2e/maestro/` at repo root; `config.yaml` selects numbered flows only (`subflows/` are shared steps). `appId` is per flow (workspace config cannot hold it).
- [x] `e2e/` not excluded by `.gitignore`.

## 2. testID Wiring

- [x] `player-avatar-tile` (`UiPlayerCard`), `game-door-tile` (`ModernDoorCard`, `UiDoor`), `shell-back-button` (`GameShellScreen`).
- [x] `game-board-tile` on the answer tile of Thailand, Mexico, Georgia, Italy, Sudan, Iraq (the classes the flows and WebMCP specs drive). Other classes: add as a flow needs them.
- [x] Added for the flows and WebMCP tools: `add-player-button`, `avatar-option-N`, `keyboard-key-N`, `player-name-input`, `set-player-submit/cancel`, `menu-back-button`, `menu-tab-*`, `self-test-button`, `settings-back-button`, `self-test-back-button`, `shell-score-bar`, `shell-{instructions,replay,advance}-button`, `celebration-back-button`.
- [x] No existing test/snapshot broke (`nx run-many -t test`).
- [x] Typecheck affected libs.

## 3. Flow Authoring (Maestro, native)

- [x] `01-player-creation.yaml` — fresh launch, create player with the on-screen keyboard, door grid visible.
- [x] `02-game-door-tap.yaml` — tap door 1, board loads.
- [x] `04-back-navigation.yaml` — shell back button returns to the door grid.
- [x] `05-relaunch-persistence.yaml` — player survives stop + relaunch (QA #57 persistence).
- [ ] ~~`03-correct-answer.yaml`~~ — moved to WebMCP: `at_game_answer` (random correct tile; scoring is state, not a finger).
- [ ] ~~All 28 doors / game classes / settings / share screen~~ — moved to WebMCP (`apps/alphaTiles-agent-e2e/specs`).

## 4. NX Target

- [x] `e2e:maestro` in `apps/alphaTiles/project.json` per D3 (opt-in).
- [ ] `nx run alphaTiles:e2e:maestro` against a booted emulator with the yue APK installed. — pending: device/emulator run

## 5. CI Wiring

- [x] No workflow: owner decision is opt-in e2e, not part of CI or the pre-push gate (D4 superseded; no `.github/workflows/e2e-maestro.yml`).

## 6. Verification

- [ ] Run flows 01, 02, 04, 05 against the `yue-apk` build on an emulator; each exits 0. — pending: device/emulator run
- [ ] Deliberate break (comment out a testID): Maestro fails non-zero. — pending: device/emulator run
- [x] YAML syntax of all flows validated (parse with a YAML loader).

## 7. WebMCP + Playwright (moved scope)

- [x] `libs/shared/util-agent-tools` (`defineAgentTool`, `registerAgentTools`, `agentProbe`), unit-tested; tsconfig path + tags (`type:util`, `scope:shared`).
- [x] `at_location`, `at_navigate`, `at_players`, `at_doors`, `at_game_state`, `at_game_answer`, `at_audio_state`, `at_settings` in `libs/alphaTiles/feature-loading/src/agentTools/`, registered via `AgentToolsBridge` behind `__DEV__` + web; unit-tested.
- [x] Production export carries no tool code (`expo export` grep for `at_*` names: 0 hits).
- [x] `apps/alphaTiles-agent-e2e` Playwright project, `nx run alphaTiles-agent-e2e:e2e` (opt-in); 8 specs pass locally against the yue dev server.
- [x] docs/TESTING.md: hand-check with Claude-in-Chrome, running both e2e layers.
