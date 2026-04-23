# util-analytics

Pure-TS analytics abstraction for AlphaTiles. Zero runtime deps. v1 ships a no-op default; v2 swaps in a real adapter with one call. See `openspec/changes/analytics-abstraction/design.md` for rationale.

## Public surface

```ts
import {
  track, identify, screen,
  setAnalyticsAdapter, setAnalyticsEnabled,
  transformPropsToSnake,
  useTrackScreenMount,
} from '@shared/util-analytics';
import type { AnalyticsEvent, AnalyticsAdapter } from '@shared/util-analytics';
```

## Boot wiring contracts

### 1. `data-language-assets` → `setAnalyticsEnabled`

After parsing `aa_settings.txt`, call:

```ts
setAnalyticsEnabled(parsedSettings.sendAnalytics);
```

Default is `false` — events are no-ops until this fires.

### 2. `apps/alphaTiles/src/_layout.tsx` → boot sequence

Fire `app_boot` AFTER both `setAnalyticsAdapter` and `setAnalyticsEnabled` are called:

```ts
// In _layout.tsx init (v2 example):
setAnalyticsAdapter(new PostHogAdapter({ apiKey: '...' }));
setAnalyticsEnabled(parsedSettings.sendAnalytics);
track('app_boot', { appLang: APP_LANG, platform: Platform.OS, osVersion: Platform.Version.toString() });
```

Events fired before `setAnalyticsEnabled(true)` are silently dropped.

## V2 adapter authors

Implement `AnalyticsAdapter` and call `transformPropsToSnake(props)` before transmitting:

```ts
import { transformPropsToSnake } from '@shared/util-analytics';

const posthogAdapter: AnalyticsAdapter = {
  track(event, props) {
    posthog.capture(event, props ? transformPropsToSnake(props) : undefined);
  },
  identify(playerId, traits) {
    posthog.identify(playerId, traits ? transformPropsToSnake(traits) : undefined);
  },
  screen(name, props) {
    posthog.screen(name, props ? transformPropsToSnake(props) : undefined);
  },
};
```

## Tile-tap sampling

`tile_tap_correct` and `tile_tap_incorrect` are sampled at 10% (deterministic hash). Sampled events carry `_sampled: true` — adapters may upweight by 10x. See design.md D5.

## Building

Run `nx build util-analytics` to build the library.

## Running unit tests

Run `nx test util-analytics` to execute the unit tests via [Jest](https://jestjs.io).
