## Context

No prior end-to-end test infrastructure. Maestro is a mobile UI testing framework that drives the simulator/emulator via a YAML DSL — no TypeScript test runner required. Flows target elements by `testID` (mapped to `accessibilityLabel` on iOS) or text, and assert on UI state.

### Required reading for implementers

- `AGENTS.md`
- `openspec/AGENT_PROTOCOL.md`
- `docs/ARCHITECTURE.md`
- `docs/CODE_STYLE.md`
- `apps/alphaTiles/project.json` — NX project config to extend
- `libs/alphaTiles/feature-choose-player/` — player avatar tile component
- `libs/alphaTiles/feature-game-shell/` — back button location
- Maestro docs: https://maestro.mobile.dev/

## Goals / Non-Goals

**Goals:**
- Four stable golden-path flows runnable with one CLI command.
- `testID` props on exactly the four key interactive elements; no broader prop-drilling.
- NX target wraps the Maestro CLI so contributors run `nx run alphaTiles:e2e:maestro`.
- CI fails PRs when any flow fails.

**Non-Goals:**
- Android simulation (v1 iOS only).
- Maestro Cloud / EAS remote runs.
- Per-game exhaustive coverage.
- Error-path or sad-path flows.
- Screenshot diffing.

## Decisions

### D1. Directory layout

All Maestro flows live at `e2e/maestro/<flow-name>.yaml` in the repository root, alongside `apps/` and `libs/`. This keeps E2E artifacts outside the NX library graph so they don't pull NX tags into Maestro config.

```
e2e/
  maestro/
    01-player-creation.yaml
    02-game-door-tap.yaml
    03-correct-answer.yaml
    04-back-navigation.yaml
```

Each file is a standalone Maestro flow (no `runFlow` chaining for v1).

### D2. testID enumeration

The following `testID` values are required. Each maps to the `testID` prop on the React Native component listed. All values are lowercase-kebab; Maestro targets them with `id: <value>`.

| testID | Component / File | Purpose |
|---|---|---|
| `player-avatar-tile` | `libs/alphaTiles/feature-choose-player` — player tile presenter | Flow 1: tap to select/create player |
| `game-door-tile` | `libs/alphaTiles/feature-game-door` (or equivalent door list item) | Flow 2: tap to enter a game |
| `game-board-tile` | `libs/alphaTiles/feature-game-shell` — draggable/tappable answer tile on game board | Flow 3: tap correct answer tile |
| `shell-back-button` | `libs/alphaTiles/feature-game-shell` — back/close button in shell header | Flow 4: tap to return to menu |

If a component is a container/presenter pair, the `testID` prop goes on the presenter; the container passes it down. Do not add `testID` to wrappers that lack a stable single interactive surface.

### D3. NX target shape

Add to `apps/alphaTiles/project.json` under `"targets"`:

```json
"e2e:maestro": {
  "executor": "nx:run-commands",
  "options": {
    "command": "maestro test e2e/maestro/",
    "cwd": "{workspaceRoot}"
  }
}
```

`cwd` is set to the workspace root so the path `e2e/maestro/` resolves from the repo root regardless of where NX is invoked. The target has no `outputs` (test results are printed to stdout only, v1).

### D4. CI workflow

GitHub Actions job in `.github/workflows/e2e-maestro.yml`. Triggers on `pull_request`. Uses `macos-14` runner (Xcode 15, M-series silicon). Steps: checkout → setup Node → install Maestro CLI via official curl script → boot iOS simulator (Expo prebuild or detox-style) → `nx run alphaTiles:e2e:maestro`. Job fails if the NX command exits non-zero; GitHub marks the PR check as failed.

EAS workflows are out of scope for v1.

### D5. Simulator selection

iOS only, v1. `macos-14` GitHub Actions runner. Simulator: iPhone 15, iOS 17 (matches Xcode 15 defaults). Android support deferred — the Maestro YAML itself is platform-neutral, so Android can be layered in a follow-up by adding a second CI job and pointing to an Android emulator.

### D6. Flake mitigation

- Use `id:` selectors (testID) everywhere, never raw text selectors, to avoid locale/font rendering variation.
- Add `- waitForAnimationToEnd` before tap steps that follow transitions.
- Set `maestro` global timeout to 30 s per step in flow headers.
- Avoid `assertVisible` on score text (locale/font-dependent); assert only on element presence by testID.

## Unresolved Questions

- Flow 2–3 target game: China assumed. Confirm default language pack available in CI simulator build.
- Does `feature-game-door` already have a single tappable tile component to receive `testID`, or does the door navigate via a FlatList row?
- Is `macos-14` available on the org's GitHub plan, or must we use `macos-13`?
- Should flows share a Maestro `config.yaml` for appId / timeout defaults, or repeat per file?

## D7. Split: WebMCP vs Maestro (supersedes D1, D4, D5 scope)

Owner decision: most automated checking goes through dev-only WebMCP tools (`at_*`, see docs/TESTING.md) driven by Playwright against the yue web dev server (`apps/alphaTiles-agent-e2e`, `nx run alphaTiles-agent-e2e:e2e`). Tools prove state (door progress, scoring, audio probe), not buttons, and run anywhere Chrome does.

Maestro keeps only what needs a native runtime: cold launch, on-screen keyboard player creation, door tap, the shell back button, and persistence across a full app relaunch, on Android (`yue-apk`, `com.makektm.alphatiles`). Flows 01, 02, 04 and a new 05 (relaunch persistence) remain; 03 (correct answer), the all-doors sweep, game classes, settings and share moved to WebMCP. Both layers are opt-in: no CI job (D4 dropped), no pre-push gate. Android replaces iOS as the Maestro target (the release is Android). Native audible output, release manifest permissions and boot time / memory with ~400 preloads stay manual (#57).
