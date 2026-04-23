## Why

Per ARCHITECTURE.md §12, v1 ships a no-op analytics interface with a complete event catalog so feature code can fire events from day one and v2 swaps in a real adapter (PostHog, Firebase — TBD) with a one-line change. Laying the abstraction and the catalog now — before feature code exists — means we never have to retrofit event calls into 17 game classes after the fact.

The Android source has ad-hoc logging but no structured analytics pipeline. This is a clean-slate design aligned with v1's actual product questions (which games retain players, which drop off, web audio unlock completion rate, per-pack adoption).

`aa_settings.txt`'s `"Send analytics"` setting must gate the adapter. Without this change, there's no place to read that setting, no place for features to call `track()`, and no catalog anyone can reference.

## What Changes

- Add `libs/shared/util-analytics` (`type:util`, `scope:shared`) — pure-TS, zero runtime deps.
- Expose `track(event, props?)`, `identify(playerId, traits?)`, `screen(name, props?)` — the three standard analytics primitives.
- Expose `setAnalyticsAdapter(impl)` — one-line swap to plug in a real adapter in v2.
- Expose `setAnalyticsEnabled(bool)` — called once at boot by `data-language-assets` with the parsed `aa_settings.txt "Send analytics"` value.
- Default adapter: no-op. Events hit the adapter, adapter discards. No in-process buffering.
- Define the v1 event catalog as an exported `AnalyticsEvent` discriminated union — documented in the spec, typed in TS.
- Sampled tile-tap events — `tile_tap_correct` / `tile_tap_incorrect` fire at 10% sample rate (deterministic via hash of `{gameDoor, tileId, timestamp}`) to keep event volume bounded.
- Screen naming convention: route path (`'/'`, `'/choose-player'`, `'/game/41'`).
- Prop naming: snake_case, lowercase.
- PII policy: no player name in props, no device IDs (adapter may attach at its layer).

## Capabilities

### New Capabilities

- `analytics`: a three-function API (`track`, `identify`, `screen`), an adapter swap seam (`setAnalyticsAdapter`), a settings-gate (`setAnalyticsEnabled`), a typed event catalog, sampling for high-volume tile-tap events, a stable screen-name convention.

### Modified Capabilities

_None_ — first analytics change.

## Impact

- **New lib**: `libs/shared/util-analytics/` (source, project.json, unit tests).
- **New deps**: none. Pure TS.
- **Downstream unblocks**: every `type:feature` container + `data-language-assets` (for `setAnalyticsEnabled`).
- **No breaking changes** — additive.
- **Risk**: feature code builds up a hundred `track()` calls before the v2 adapter ships; if the catalog shape shifts, those calls update in lockstep. **Mitigation**: discriminated union typing forces catalog conformance at compile time.
