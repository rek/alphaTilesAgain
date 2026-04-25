# Tasks

Implement golden-path Maestro E2E suite.

## 0. Preflight

- [ ] Read `proposal.md` and `design.md` in full.
- [ ] Confirm Maestro CLI installable in CI environment (`curl -Ls "https://get.maestro.mobile.dev" | bash`).
- [ ] Confirm `macos-14` runner available on GitHub org plan; fall back to `macos-13` if not.
- [ ] Identify which component exposes the game door tile (confirm `feature-game-door` or equivalent); note file path.
- [ ] Confirm default language pack (China) is bundled in the Expo dev build used by CI.

## 1. Maestro Setup

- [ ] Create `e2e/maestro/` directory at repo root.
- [ ] Create `e2e/maestro/config.yaml` with shared `appId` and default step timeout (30 s).
- [ ] Verify `e2e/` is not excluded by `.gitignore`; add `e2e/` allowlist entry if needed.

## 2. testID Wiring

Wire the four required `testID` props per design D2 table.

- [ ] `player-avatar-tile`: add `testID="player-avatar-tile"` to the player tile presenter in `libs/alphaTiles/feature-choose-player/`. Pass prop from container if needed.
- [ ] `game-door-tile`: add `testID="game-door-tile"` to the game door tile/list-item presenter. Pass prop from container if needed.
- [ ] `game-board-tile`: add `testID="game-board-tile"` to the tappable answer tile presenter in `libs/alphaTiles/feature-game-shell/`. Pass prop from container if needed.
- [ ] `shell-back-button`: add `testID="shell-back-button"` to the back/close button in the shell header in `libs/alphaTiles/feature-game-shell/`.
- [ ] Confirm no existing tests or storybook snapshots break due to the new `testID` props.
- [ ] Type-check affected libs: `npx tsc --noEmit`.

## 3. Flow Authoring

Write four Maestro `.yaml` flow files. Each file should start with `appId` (or reference config) and include `- waitForAnimationToEnd` before taps that follow navigation transitions.

### Flow 1 — first-launch player creation (`01-player-creation.yaml`)

- [ ] App launches to choose-player screen (or onboarding).
- [ ] `waitForAnimationToEnd`.
- [ ] Assert `player-avatar-tile` is visible.
- [ ] Tap `player-avatar-tile`.
- [ ] Assert app transitions away from choose-player screen (e.g., home/door screen visible).

### Flow 2 — game door tap → game loads (`02-game-door-tap.yaml`)

- [ ] App launches; navigate past player selection (tap `player-avatar-tile`).
- [ ] `waitForAnimationToEnd`.
- [ ] Assert `game-door-tile` is visible.
- [ ] Tap `game-door-tile`.
- [ ] `waitForAnimationToEnd`.
- [ ] Assert `game-board-tile` is visible (game has loaded).

### Flow 3 — correct answer tap → points increment (`03-correct-answer.yaml`)

- [ ] Navigate to game (reuse steps from flow 2).
- [ ] Assert `game-board-tile` is visible.
- [ ] Tap `game-board-tile` (correct answer tile).
- [ ] `waitForAnimationToEnd`.
- [ ] Assert game progresses (next round or celebration visible; assert by element presence not score text).

### Flow 4 — back navigation to menu (`04-back-navigation.yaml`)

- [ ] Navigate to game (reuse steps from flow 2).
- [ ] Assert `shell-back-button` is visible.
- [ ] Tap `shell-back-button`.
- [ ] `waitForAnimationToEnd`.
- [ ] Assert `game-door-tile` or home screen is visible (returned to menu).

## 4. NX Target

- [ ] Open `apps/alphaTiles/project.json`.
- [ ] Add `e2e:maestro` target per design D3 JSON snippet.
- [ ] Verify `nx run alphaTiles:e2e:maestro` resolves (dry-run without simulator: confirm command echoes correctly via `--verbose`).

## 5. CI Wiring

- [ ] Create `.github/workflows/e2e-maestro.yml`.
- [ ] Trigger: `on: pull_request`.
- [ ] Runner: `macos-14`.
- [ ] Steps:
  - [ ] `actions/checkout@v4`
  - [ ] `actions/setup-node@v4` with Node version matching `.nvmrc` / `package.json engines`.
  - [ ] Install Maestro CLI: `curl -Ls "https://get.maestro.mobile.dev" | bash && echo "$HOME/.maestro/bin" >> $GITHUB_PATH`.
  - [ ] `npm ci` (or `yarn install --frozen-lockfile`).
  - [ ] Boot iOS simulator: `xcrun simctl boot "iPhone 15"` (or Expo CLI prebuild step).
  - [ ] Build/install app on simulator (Expo: `npx expo run:ios --configuration Release --simulator "iPhone 15"`).
  - [ ] `nx run alphaTiles:e2e:maestro`.
- [ ] Confirm job name appears in PR required checks (update branch protection if needed).

## 6. Verification

- [ ] Run all four flows locally against a booted iOS simulator: `maestro test e2e/maestro/`.
- [ ] Each flow exits 0 individually.
- [ ] `nx run alphaTiles:e2e:maestro` runs all four and exits 0.
- [ ] Introduce a deliberate break (comment out a `testID`), confirm Maestro fails and exits non-zero.
- [ ] Push a PR; confirm GitHub Actions job appears and passes.
- [ ] Confirm a PR with the deliberate break triggers a failed check.
- [ ] Restore the break; merge.
