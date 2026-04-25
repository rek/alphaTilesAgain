## Why

Expo web builds have three known gaps vs. native: (1) browsers block audio until a user gesture (autoplay policy), causing silent games on first load; (2) several UI components overflow or collapse on narrow browser viewports; (3) the app lacks a PWA manifest, so it cannot be installed from Chrome/Safari.

## What Changes

- Add `<WebAudioUnlockGate>` component (web-only render) to the root layout; fires `track({ type: 'audio_unlock_web', ... })` on unlock.
- Add `manifest.json` PWA manifest to `apps/alphaTiles/public/`; link in `app.config.ts`.
- Fix layout overflow in `ui-door-grid` and fixed-height collapse in `ui-score-bar` for narrow viewports.

## Capabilities

### New Capabilities

- `web-audio-unlock-gate` — full-screen "Tap to start" overlay rendered only on web; dismissed after first touch/click; resumes AudioContext and fires analytics.
- `pwa-manifest` — installable web app via `manifest.json` with required icons (192×192, 512×512), `display: standalone`, theme color from `palette[0]`.

### Modified Capabilities

- `ui-door-grid` — adds `overflow: hidden` + flex wrap constraints; tiles no longer bleed outside viewport on narrow screens.
- `ui-score-bar` — replaces fixed pixel height with `minHeight` + padding; adapts to viewport without collapse.

## Impact

- New file `libs/alphaTiles/ui-web-audio-unlock-gate/` (web-only component, app shell imports it).
- `apps/alphaTiles/app/_layout.tsx` gains conditional `<WebAudioUnlockGate>` wrapping.
- `apps/alphaTiles/public/manifest.json` added; `app.config.ts` updated.
- `libs/alphaTiles/ui-door-grid` and `libs/alphaTiles/ui-score-bar` style changes only; no prop API changes.
- No changes to game logic, scoring, or persistence.

## Out of Scope

- Deep linking / universal links on web.
- OAuth or auth flows on web.
- Safari-specific audio quirks beyond the unlock gate.
- Offline / service-worker caching.

## Unresolved Questions

- Which icon assets exist at ≥512×512? Need to confirm before generating manifest.
- Should the unlock gate be skippable on desktop (hover vs. touch)? Defaulting to click/touch both for v1.
- Should `ui-score-bar` min-height be a theme token or a hardcoded constant?
