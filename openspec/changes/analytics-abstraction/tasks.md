## 0. Preflight

- [ ] 0.1 Read `AGENTS.md` and `openspec/AGENT_PROTOCOL.md`
- [ ] 0.2 Read this change's `proposal.md` and `design.md` in full
- [ ] 0.3 Read required upstream change design docs (see `design.md → ## Context`)
- [ ] 0.4 Read required `docs/ARCHITECTURE.md` sections and referenced ADRs
- [ ] 0.5 (No Java source ported in this change — skip)
- [ ] 0.6 Open the fixture files named in `design.md → ## Context`; verify pack content matches the assumptions the design makes
- [ ] 0.7 Confirm upstream changes are merged (`openspec status --all`); do not start if an upstream is only in-progress
- [ ] 0.8 Confirm `APP_LANG` and `PUBLIC_LANG_ASSETS` env vars are set for local runs
- [ ] 0.9 Confirm `nx graph` shows the libs this change will touch don't already exist with conflicting tags

## 1. Library scaffold

- [ ] 1.1 Generate `libs/shared/util-analytics` via `nx g @nx/js:lib util-analytics --directory=libs/shared/util-analytics --tags='type:util,scope:shared'`
- [ ] 1.2 Zero runtime deps — confirm `project.json` lists none

## 2. Type catalog

- [ ] 2.1 Define `AnalyticsEvent` discriminated union exactly as specified:
  - [ ] 2.1.1 `player_created` / `player_deleted` / `player_renamed`
  - [ ] 2.1.2 `game_started` / `game_exited` / `game_mastery_reached`
  - [ ] 2.1.3 `screen_viewed`
  - [ ] 2.1.4 `tile_tap_correct` / `tile_tap_incorrect`
  - [ ] 2.1.5 `audio_unlock_web` with `millisecondsSinceBoot`
  - [ ] 2.1.6 `app_boot` with `appLang`, `platform`, `osVersion`
- [ ] 2.2 Define `AnalyticsAdapter` type — `{ track(event: string, props?: Record<string, unknown>): void; identify(playerId: string, traits?: Record<string, unknown>): void; screen(name: string, props?: Record<string, unknown>): void }`
- [ ] 2.3 Infer public API types via `typeof` / `Parameters` — no separate `.types.ts`

## 3. Default no-op adapter

- [ ] 3.1 Implement `noopAdapter: AnalyticsAdapter` with 3 empty methods
- [ ] 3.2 Module-level `let adapter = noopAdapter`
- [ ] 3.3 Module-level `let analyticsEnabled = false`
- [ ] 3.4 Unit test: `track('app_boot', {...})` with default state → adapter method is NOT called (use a spy adapter to verify)

## 4. Adapter swap + settings gate

- [ ] 4.1 Implement `setAnalyticsAdapter(impl: AnalyticsAdapter): void`
- [ ] 4.2 Implement `setAnalyticsEnabled(bool: boolean): void`
- [ ] 4.3 Unit tests:
  - [ ] 4.3.1 After `setAnalyticsAdapter(spy)` + `setAnalyticsEnabled(true)`, `track('app_boot', {...})` invokes `spy.track`
  - [ ] 4.3.2 After `setAnalyticsEnabled(false)`, further `track` calls do NOT invoke the adapter
  - [ ] 4.3.3 Re-swap: `setAnalyticsAdapter(A)` then `setAnalyticsAdapter(B)` — only `B` receives subsequent calls

## 5. Core call functions

- [ ] 5.1 Implement `track<E extends AnalyticsEvent>(event: E['type'], props?: E['props']): void`:
  - [ ] 5.1.1 Check `analyticsEnabled` — early return if false
  - [ ] 5.1.2 If event is `tile_tap_correct` / `tile_tap_incorrect`, run the sampler (D5/task 6) — skip or inject `_sampled: true`
  - [ ] 5.1.3 Call `adapter.track(event, finalProps)`
- [ ] 5.2 Implement `identify(playerId: string, traits?: Record<string, unknown>): void`:
  - [ ] 5.2.1 Check `analyticsEnabled` — early return if false
  - [ ] 5.2.2 Call `adapter.identify(playerId, traits)`
- [ ] 5.3 Implement `screen(name: string, props?: Record<string, unknown>): void`:
  - [ ] 5.3.1 Check `analyticsEnabled` — early return if false
  - [ ] 5.3.2 Call `adapter.screen(name, props)`

## 6. Tile-tap sampling

- [ ] 6.1 Implement `shouldSampleTileTap(props: { gameDoor: number; tileId: string }, nowMs: number): boolean`:
  - [ ] 6.1.1 Compose `key = \`${props.gameDoor}|${props.tileId}|${Math.floor(nowMs / 100)}\``
  - [ ] 6.1.2 Hash via a cheap string-hash function (djb2 or FNV-1a — inline, no dep)
  - [ ] 6.1.3 Return `hash(key) % 10 === 0`
- [ ] 6.2 Integrate sampler into `track` for the two tile-tap event types
- [ ] 6.3 Unit tests:
  - [ ] 6.3.1 10000 calls with varied timestamps → roughly 1000 pass (±5%)
  - [ ] 6.3.2 Two calls within 50ms for identical `{gameDoor, tileId}` → same sample decision
  - [ ] 6.3.3 Sampled event passed to adapter carries `_sampled: true`
  - [ ] 6.3.4 Non-tile-tap events never receive `_sampled`

## 7. Wire format transform helper

- [ ] 7.1 Implement `camelToSnake(key: string): string` utility
- [ ] 7.2 Export `transformPropsToSnake(props: Record<string, unknown>): Record<string, unknown>` for adapter authors
- [ ] 7.3 Unit tests:
  - [ ] 7.3.1 `camelToSnake('gameDoor')` → `'game_door'`
  - [ ] 7.3.2 `camelToSnake('syllOrTile')` → `'syll_or_tile'`
  - [ ] 7.3.3 Already-snake keys pass through unchanged
- [ ] 7.4 Document in the adapter type-doc that v2 adapters must call `transformPropsToSnake` before transmission

## 8. Screen convention helper

- [ ] 8.1 Export a `useTrackScreenMount(name: string)` hook for container-onMount screen firing:
  - [ ] 8.1.1 Calls `screen(name)` via `useMountEffect` pattern (no direct `useEffect`)
- [ ] 8.2 Unit test: hook renders once → `screen(name)` called once

## 9. Integration with `data-language-assets` (stub here)

- [ ] 9.1 Document the contract in the lib README: `data-language-assets` calls `setAnalyticsEnabled(parsedSettings.sendAnalytics)` at boot
- [ ] 9.2 Document the contract: `apps/alphaTiles/src/_layout.tsx` fires `track('app_boot', {...})` AFTER `setAnalyticsAdapter` + `setAnalyticsEnabled`

## 10. Validation

- [ ] 10.1 `openspec validate analytics-abstraction` passes
- [ ] 10.2 `npx tsc --noEmit` passes — including a smoke test file that invokes each catalog variant with correct props
- [ ] 10.3 `npx tsc --noEmit` correctly rejects a deliberately-wrong call (e.g. `track('game_started', { wrongKey: 1 })`) — negative test via `ts-expect-error`
- [ ] 10.4 `nx run-many -t lint` passes
- [ ] 10.5 Unit tests all green
