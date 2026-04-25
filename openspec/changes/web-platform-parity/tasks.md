# Tasks

Implement web platform parity: audio unlock gate, PWA manifest, layout fixes.

## 0. Preflight

- [ ] Read `proposal.md` and `design.md`.
- [ ] Read `apps/alphaTiles/app/_layout.tsx` — understand current root layout structure.
- [ ] Read `libs/alphaTiles/data-audio/src/index.ts` — confirm exported API; note if `resumeAudioContext` already exists.
- [ ] Read `libs/shared/util-analytics/src/` — confirm `track()` signature and `audio_unlock_web` event shape.
- [ ] Confirm icon assets at `apps/alphaTiles/assets/`: verify ≥192×192 and ≥512×512 PNGs exist.

## 1. WebAudioUnlockGate Component

- [ ] Generate library: `./nx g @nx/js:lib ui-web-audio-unlock-gate --directory=libs/alphaTiles/ui-web-audio-unlock-gate --tags='type:ui,scope:alphaTiles'`.
- [ ] Add path alias to `tsconfig.base.json`: `"@alphaTiles/ui-web-audio-unlock-gate": ["libs/alphaTiles/ui-web-audio-unlock-gate/src/index.ts"]`.
- [ ] Add `resumeAudioContext()` helper to `libs/alphaTiles/data-audio/src/lib/resumeAudioContext.ts`; export from `data-audio` index. Uses `typeof AudioContext !== 'undefined'` capability check — no `Platform.OS` guard.
- [ ] Implement presenter `libs/alphaTiles/ui-web-audio-unlock-gate/src/lib/WebAudioUnlockGatePresenter.tsx` — accepts `onUnlock: () => void`, `label: string`, `children: React.ReactNode`; renders full-screen `<Pressable>` overlay until dismissed; pure props→JSX, no hooks, no i18n.
- [ ] Implement container `libs/alphaTiles/ui-web-audio-unlock-gate/src/lib/WebAudioUnlockGate.tsx` — owns `unlocked` state, calls `resumeAudioContext()`, calls `track({ type: 'audio_unlock_web', props: { millisecondsSinceBoot } })` on first gesture, passes `label="Tap to start"` (fixed English for v1 per design unresolved Q).
- [ ] Export `WebAudioUnlockGate` from `libs/alphaTiles/ui-web-audio-unlock-gate/src/index.ts`.
- [ ] Unit test: overlay renders initially; pressing calls `onUnlock` and hides overlay.
- [ ] Unit test: `resumeAudioContext` calls `AudioContext.prototype.resume` when `AudioContext` exists in global; is a no-op when absent.

## 2. Root Layout Wiring

- [ ] In `apps/alphaTiles/app/_layout.tsx`, import `WebAudioUnlockGate` and `Platform`.
- [ ] Wrap `<Slot />` with `<WebAudioUnlockGate>` only when `Platform.OS === 'web'` (ternary or inline conditional per design D1).
- [ ] Verify no other app layout file needs the gate (check nested layouts in `apps/alphaTiles/app/`).

## 3. PWA Manifest

- [ ] Create `apps/alphaTiles/public/manifest.json` with all fields from design D4 table.
- [ ] Copy or symlink icon assets to `apps/alphaTiles/public/icons/icon-192.png` and `icon-512.png`.
- [ ] Update `app.config.ts` (or `app.json`) to reference manifest per Expo PWA docs — `expo.web.output: 'static'` if not already set; add `<link rel="manifest">` injection.
- [ ] Smoke-test: `npx expo export --platform web` then `npx serve dist/` — confirm `/manifest.json` responds 200 with correct `Content-Type: application/json`.

## 4. Layout Fixes

### 4a. ui-door-grid

- [ ] Read `libs/alphaTiles/ui-door-grid/src/` — identify row container style.
- [ ] Add `flexWrap: 'wrap'` and `overflow: 'hidden'` to row container StyleSheet entry.
- [ ] Compute tile `flexBasis` as `(100% - (numCols - 1) * gapSize) / numCols` — derive from existing props, no new props needed.
- [ ] Visual test at 320px, 375px, 768px viewport widths: tiles remain inside container.

### 4b. ui-score-bar

- [ ] Read `libs/alphaTiles/ui-score-bar/src/` — identify fixed `height` constant.
- [ ] Replace `height: SCORE_BAR_HEIGHT` with `minHeight: SCORE_BAR_HEIGHT` + `paddingVertical: 4` (or equivalent) in StyleSheet.
- [ ] Confirm no downstream consumers rely on the fixed height for positioning (grep for `SCORE_BAR_HEIGHT` outside the lib).
- [ ] Visual test at 320px viewport: bar visible and not collapsed.

## 5. Verification

- [ ] Type-check: `npx tsc --noEmit -p apps/alphaTiles/tsconfig.json`.
- [ ] Lint: `nx lint alphaTiles-ui-web-audio-unlock-gate`.
- [ ] Unit tests pass: `nx test alphaTiles-ui-web-audio-unlock-gate`.
- [ ] `nx lint alphaTiles-data-audio` — confirm `resumeAudioContext` passes lint.
- [ ] Grep libs for `Platform.OS === 'web'` — must find zero matches.
- [ ] Manual smoke (web, Chrome): load app, confirm gate overlay visible; tap/click, confirm gate dismisses and audio plays in a game.
- [ ] Manual smoke (web, Chrome): open DevTools → Application → Manifest; confirm all required fields present.
- [ ] Manual smoke (web, 320px viewport): door grid tiles wrap; score bar visible.
- [ ] Manual smoke (native iOS/Android): confirm gate never appears; audio plays normally.
