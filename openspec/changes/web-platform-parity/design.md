## Context

Expo web runs on a real browser engine. Two browser constraints differ fundamentally from native:

1. **Autoplay policy** — `AudioContext` is suspended on page load; audio only plays after a user gesture. `expo-av` silently fails calls made before gesture. The unlock gate wraps the root layout on web and resolves the suspended context on first touch/click.
2. **Viewport flexibility** — RN StyleSheet pixel values translate to CSS `px`. Components that use fixed widths or absolute heights work fine on a phone canvas but overflow or collapse on arbitrary browser window widths.

No Java analog. Both gaps are Expo web regressions vs. the native path.

### Required reading for implementers

- `AGENTS.md`
- `openspec/AGENT_PROTOCOL.md`
- `docs/ARCHITECTURE.md`
- `docs/CODE_STYLE.md`
- `docs/PROJECT_ORGANIZATION.md`
- `apps/alphaTiles/app/_layout.tsx`
- `libs/alphaTiles/data-audio/` — `useAudio()` implementation; understand how AudioContext is held
- `libs/shared/util-analytics/` — `track()` signature; `AnalyticsEvent` for `audio_unlock_web`
- MDN autoplay policy guide: https://developer.mozilla.org/en-US/docs/Web/Media/Autoplay_guide
- Expo PWA / web manifest docs: https://docs.expo.dev/guides/progressive-web-apps/

## Goals / Non-Goals

**Goals:**
- Block audio-dependent UI until first user gesture on web; dismiss gate and resume AudioContext.
- Fire `audio_unlock_web` analytics event with `millisecondsSinceBoot` on unlock.
- PWA manifest served at `/manifest.json` with all required fields.
- `ui-door-grid` and `ui-score-bar` lay out correctly at viewport widths ≥320px.
- Zero `Platform.OS === 'web'` guards in shared libs.

**Non-Goals:**
- Service worker / offline caching.
- Deep linking on web.
- Safari autoplay quirks beyond the unlock gate.
- Desktop-specific UI (hover states, keyboard nav).

## Decisions

### D1. `<WebAudioUnlockGate>` placement

The gate component renders only at the root layout (`apps/alphaTiles/app/_layout.tsx`). It wraps `<Slot />` with a full-screen overlay until unlocked. Placement at the root ensures no game screen can play audio before the gesture, regardless of navigation state.

The root layout is the only file where a web-only branch is permitted. Conditional render:

```tsx
// apps/alphaTiles/app/_layout.tsx
import { Platform } from 'react-native';
import { WebAudioUnlockGate } from '@alphaTiles/ui-web-audio-unlock-gate';

// ...
return Platform.OS === 'web'
  ? <WebAudioUnlockGate><Slot /></WebAudioUnlockGate>
  : <Slot />;
```

`Platform.OS === 'web'` is permitted here because `_layout.tsx` is an app-shell file, not a shared lib.

### D2. Gesture detection

The gate listens for `onPress` (React Native `<Pressable>` / `TouchableWithoutFeedback`). On web this maps to both mouse click and touch events. No custom DOM event listeners required; Expo's renderer handles the mapping.

The overlay is a full-screen absolute-positioned `<Pressable>` above the `children`. On first press: call `onUnlock`, set `unlocked = true`, unmount the overlay.

### D3. AudioContext.resume() lifecycle

`useAudio()` from `data-audio` holds an `AudioContext` reference. On web, that context starts in `"suspended"` state. The gate component calls `AudioContext.resume()` (via a `resumeAudioContext()` helper exported by `data-audio`) on the first gesture. The helper is a no-op on native (no AudioContext exists).

`resumeAudioContext()` lives in `libs/alphaTiles/data-audio/` in a new file `resumeAudioContext.ts`, exported from `src/index.ts`. It is the only place in shared libs that touches the web AudioContext — but it does so without a `Platform.OS === 'web'` guard: it checks `typeof AudioContext !== 'undefined'` instead, which is a capability check, not a platform check.

### D4. PWA manifest fields

| Field | Value |
|---|---|
| `name` | `"AlphaTiles"` |
| `short_name` | `"AlphaTiles"` |
| `start_url` | `"/"` |
| `display` | `"standalone"` |
| `theme_color` | `palette[0]` (read from theme at build time; hardcode hex in manifest) |
| `background_color` | `"#ffffff"` |
| `icons[0].src` | `"/icons/icon-192.png"` |
| `icons[0].sizes` | `"192x192"` |
| `icons[0].type` | `"image/png"` |
| `icons[1].src` | `"/icons/icon-512.png"` |
| `icons[1].sizes` | `"512x512"` |
| `icons[1].type` | `"image/png"` |

Manifest file lives at `apps/alphaTiles/public/manifest.json`. `app.config.ts` sets `expo.web.output = 'static'` and links the manifest via `expo.web.favicon` / meta tag injection per Expo PWA docs.

### D5. Layout fixes

| Component | Symptom on narrow viewport | Fix |
|---|---|---|
| `ui-door-grid` | Tile row overflows horizontally; tiles cut off at right edge | Add `flexWrap: 'wrap'`, `overflow: 'hidden'` to the row container; constrain tile width to `(100% - gaps) / numCols` using `flexBasis` |
| `ui-score-bar` | Bar collapses to 0 height when parent has no explicit height on web | Replace `height: SCORE_BAR_HEIGHT` (fixed px) with `minHeight: SCORE_BAR_HEIGHT`, add vertical `paddingVertical` so content never clips |

No prop API changes on either component; fix is style-sheet-only.

### D6. `Platform.OS === 'web'` boundary rule

`Platform.OS === 'web'` (or any string comparison against `'web'`) is forbidden in any file under `libs/`. The only permitted locations are:

- `apps/alphaTiles/app/_layout.tsx` (gate wrapping, per D1)
- Files explicitly named `*.web.ts` / `*.web.tsx` using Expo's platform-extension resolution

Capability checks (`typeof AudioContext !== 'undefined'`, `typeof navigator !== 'undefined'`) are permitted in shared libs because they test environment capability, not platform identity.

## Unresolved Questions

- Confirm 192×192 and 512×512 icon assets exist in `apps/alphaTiles/assets/`; if not, source or generate before task 3.
- Should the gate show a localized string or a fixed English "Tap to start"? If i18n is needed, container must own the string — gate presenter accepts it as a prop.
- Is `palette[0]` stable enough to hardcode in `manifest.json`, or does it vary per lang pack? If it varies, `theme_color` may need to be a build-time env var.
