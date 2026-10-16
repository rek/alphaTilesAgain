# Tasks

Implement web platform parity: audio unlock gate, PWA manifest, layout fixes.

Decisions that changed tasks are recorded in `design.md` § Implementation decisions (I1–I10).

## 0. Preflight

- [x] Read `proposal.md` and `design.md`.
- [x] Read `apps/alphaTiles/app/_layout.tsx` — understand current root layout structure.
- [x] Read `libs/alphaTiles/data-audio/src/index.ts` — confirm exported API; note if `resumeAudioContext` already exists. (No; an unused `WebAudioUnlockGate` existed — removed, see I2.)
- [x] Read `libs/shared/util-analytics/src/` — confirm `track()` signature and `audio_unlock_web` event shape. (`track(type, props)`.)
- [x] Confirm icon assets at `apps/alphaTiles/assets/`: verify ≥192×192 and ≥512×512 PNGs exist. (Only the 1024² Expo placeholder `icon.png`; PWA icons resized from it, I8.)

## 1. WebAudioUnlockGate Component

- [x] Generate library — created as `libs/shared/ui-web-audio-unlock-gate` (`type:ui,scope:shared`, I3).
- [x] Add path alias to `tsconfig.base.json`: `@shared/ui-web-audio-unlock-gate`.
- [x] ~~Add `resumeAudioContext()` helper~~ — dropped: no AudioContext to resume (I4). Replaced by `primeAudioHandles()` (chunked) + `millisecondsSinceBoot()` in `data-audio`.
- [x] Implement presenter `WebAudioUnlockGatePresenter.tsx` — `isLocked`, `isReady`, `title`, `label`, `onUnlock`, `children`; pure.
- [x] ~~Implement container `WebAudioUnlockGate.tsx` in `feature-loading`~~ — superseded (1bc1f0f): the gate is `AudioGate` in `data-audio` (render prop `renderLocked`, filled by feature-loading `TapToBegin`); `unlock()` primes all clips in chunks + tracks `audio_unlock_web` once (I6).
- [x] ~~Export `WebAudioUnlockGate` from `@alphaTiles/feature-loading`~~ — superseded: `AudioGate` exported from `@alphaTiles/data-audio`.
- [x] Unit test: overlay renders initially; pressing calls `onUnlock`; children hidden until unlocked; press ignored until ready (`WebAudioUnlockGatePresenter.test.tsx`, `AudioGate.test.tsx`).
- [x] ~~Unit test: `resumeAudioContext`~~ — dropped with the helper (I4). Covered instead: `primeAudioHandles.test.ts`, `millisecondsSinceBoot.test.ts`, `AudioGate.test.tsx`.

## 2. Root Layout Wiring

- [x] `apps/alphaTiles/app/_layout.tsx` wraps every route in `<AudioGate renderLocked={…TapToBegin}>` (inside `AudioProvider`). No `Platform` check at the call site: `AudioGate` passes through on native.
- [x] Verify no other app layout file needs the gate (only `app/_layout.tsx` exists).

## 3. PWA Manifest

- [x] Create `apps/alphaTiles/public/manifest.json` with all fields from design D4 (relative URLs, I8).
- [x] Copy icon assets to `apps/alphaTiles/public/icons/icon-192.png` and `icon-512.png` (placeholder resizes).
- [x] Link manifest — `web.output` already `static`; added `app/+html.tsx` with base-URL-aware `<link rel="manifest">` (I8).
- [x] Smoke-test: yue export served under `/alphaTilesAgain/yueCantonese/` — `/manifest.json` 200 `application/json`, both icons 200, link present in HTML.

## 4. Layout Fixes

### 4a. ui-door-grid

- [x] Read `libs/shared/ui-door-grid/src/` — identify row container style.
- [x] Add `flexWrap: 'wrap'` and `overflow: 'hidden'` (wrap already present; `overflow: 'hidden'` added).
- [x] ~~Compute tile `flexBasis`~~ — not needed: door size comes from the menu container and the grid already wraps; no overflow measured at 320/375/768 (I10).
- [x] Visual test at 320px, 375px, 768px viewport widths: tiles remain inside container (Playwright, headless Chromium).

### 4b. ui-score-bar

- [x] Read `libs/shared/ui-score-bar/src/` — identify fixed `height` constant. (No `SCORE_BAR_HEIGHT`; row uses padding. Badges had fixed `height: 36`.)
- [x] Replace fixed badge `height` with `minHeight` (row already has `paddingVertical: 4`).
- [x] Confirm no downstream consumers rely on the fixed height (`SCORE_BAR_HEIGHT` does not exist).
- [x] Visual test at 320px viewport: bar visible and not collapsed.

### 4c. Game screens (added — found by 28-door sweep at 320px, I10)

- [x] Ecuador: place tiles in measured field; font capped to tile height.
- [x] Georgia: flex rows instead of window-height button maths.
- [x] Malaysia: flex list/rows above arrow bar.
- [x] Taiwan: drop side padding around fixed 300px writer.

## 5. Verification

- [x] Type-check: `nx run-many -t typecheck`.
- [x] Lint: `nx lint ui-web-audio-unlock-gate`.
- [x] Unit tests pass: `nx test ui-web-audio-unlock-gate`.
- [x] `nx lint data-audio`.
- [ ] Grep libs for `Platform.OS === 'web'` — must find zero matches. **Not met**: 9 pre-existing matches in unrelated libs; new code adds none (I7). — not done (accepted deviation: 9 pre-existing matches in unrelated libs; no new ones)
- [x] Smoke (web, headless Chromium, yue export): gate visible; tap dismisses after preload; deep link `/menu` gated then revealed; in-game `play()` calls all resolve (0 `NotAllowedError`), 0 console errors. Audible check on real Chrome desktop + Android Chrome still needs a human.
- [x] Manifest fields present (fetched + parsed in smoke). DevTools → Application → Manifest check on a real browser still recommended.
- [x] Smoke (web, 320px viewport): door grid wraps; score bar visible; all 28 yue doors with no horizontal overflow.
- [ ] Manual smoke (native iOS/Android): confirm gate never appears; audio plays normally. Needs a device (gate is behind `Platform.OS === 'web'`; native `isAudioUnlocked` starts true). — pending: device QA (#57)
