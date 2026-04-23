## Context

ARCHITECTURE.md §12 pins the contract: `track(event, props?)`, `identify(playerId, traits?)`, `screen(name, props?)`. v1 ships a no-op default. v2 swaps in a real provider with a one-line change. `aa_settings.txt`'s `"Send analytics"` setting gates whether the adapter fires.

The question this change resolves: **what's the event catalog** and **how do we keep it stable** when feature code starts firing events before any real adapter exists. The catalog must be:

1. Defined up front — not accreted one-off from each feature PR.
2. Type-safe — the discriminated union makes wrong events a compile error.
3. PII-conservative — no player names, no device IDs at this layer.
4. Volume-bounded — tile-tap events alone could swamp any reasonable analytics budget; sampling is the answer.

There's no dedicated ADR for this change. ADR-006 (i18n) is referenced for the "abstract now, impl later" philosophy — the same logic applies: feature code writes against a stable API from day one; implementations swap under the interface.

### Required reading for implementers

- `AGENTS.md` — entry doc; read first.
- `openspec/AGENT_PROTOCOL.md` — pickup protocol.
- `docs/ARCHITECTURE.md` §12 (analytics contract), §3 (library taxonomy — this lib is `type:util, scope:shared`).
- `docs/decisions/ADR-006-i18n-unified-i18next.md` — referenced for the "abstract now, impl later" pattern.
- **Upstream OpenSpec changes:** none (batch 1, no deps). The `analyticsEnabled` settings read is a **forward** contract — this change ships the API without a settings reader; `loading-screen` or `game-engine-base` wires the `aa_settings.txt` flag into `setAnalyticsEnabled` later.
- **Source Java files being ported:** (No Java source ported in this change — clean-slate abstraction. No pre-existing Android analytics exists.)
- **Fixture paths** (absolute, under `../PublicLanguageAssets/`):
  - `../PublicLanguageAssets/engEnglish4/res/raw/aa_settings.txt` — confirm `"Send analytics"` row exists; informs the gate contract.

## Goals / Non-Goals

**Goals:**

- One call API for feature code: `track(...)`, `identify(...)`, `screen(...)`.
- V1 no-op: compile-time enforcement of catalog shape, zero runtime cost.
- V2 adapter swap: one line in `apps/alphaTiles/src/_layout.tsx` — `setAnalyticsAdapter(new PostHogAdapter(...))`.
- Settings-gated: adapter checks `analyticsEnabled` before firing.
- Tile-tap event volume bounded via deterministic 10% sampling.
- Consistent naming: `snake_case` props, `/path/style` screen names.
- Zero PII at this layer — adapter decides what identifiers (if any) to attach.

**Non-Goals:**

- A real adapter implementation. V1 is no-op.
- Batching / buffering. The no-op needs no buffer; a real adapter handles its own batching.
- A dashboard for event inspection. Dev-mode `console.log` adapter is a follow-up.
- GDPR / CCPA compliance machinery. V1 has no backend; when one exists, the adapter handles consent.
- Retroactive parity with any Android analytics (there is none).
- User-controlled opt-in UI. Settings-gate is pack-authored, not user-toggled. If v2 wants per-user opt-in, `setAnalyticsEnabled` gets called from a settings screen.

## Decisions

### D1. Three-primitive API

```ts
export function track<E extends AnalyticsEvent>(event: E['type'], props?: E['props']): void;
export function identify(playerId: string, traits?: Record<string, unknown>): void;
export function screen(name: string, props?: Record<string, unknown>): void;
```

Matches industry standard (Segment, PostHog, Amplitude). Every real adapter speaks this.

### D2. Discriminated union for type-safe events

```ts
export type AnalyticsEvent =
  | { type: 'player_created'; props: { avatarIndex: number } }
  | { type: 'player_deleted'; props: {} }
  | { type: 'player_renamed'; props: {} }
  | { type: 'game_started'; props: { gameDoor: number; country: string; challengeLevel: number; stage: number; syllOrTile: 'syllable' | 'tile' } }
  | { type: 'game_exited'; props: { gameDoor: number; pointsEarned: number; tapsMade: number; durationSeconds: number; completedTracker: boolean } }
  | { type: 'game_mastery_reached'; props: { gameDoor: number; stage: number } }
  | { type: 'screen_viewed'; props: { screenName: string } }
  | { type: 'tile_tap_correct'; props: { gameDoor: number; tileId: string; stage: number } }
  | { type: 'tile_tap_incorrect'; props: { gameDoor: number; tileId: string; stage: number } }
  | { type: 'audio_unlock_web'; props: {} }
  | { type: 'app_boot'; props: { appLang: string; platform: 'ios' | 'android' | 'web'; osVersion: string } };
```

`track<E>('game_started', { gameDoor: 41, ... })` — TS enforces that `props` matches the specific event's shape. Misspelled event name = compile error.

### D3. Event catalog rationale

- `player_created` / `player_deleted` / `player_renamed` — lifecycle of the player profile feature. Retention questions hang on these.
- `game_started` / `game_exited` — the core funnel. `gameDoor` is the game-instance number from `aa_games.txt`. `country` is the game class name (Chile, China, …). `challengeLevel` + `stage` + `syllOrTile` describe the config. `durationSeconds` + `tapsMade` + `pointsEarned` + `completedTracker` are the session's outcomes.
- `game_mastery_reached` — fired when a player's tracker count first hits 12 for a given game (pack setting `"After 12 checked trackers"` determines what happens next). High-signal retention event.
- `screen_viewed` — container fires on mount. Canonical route-path names per D6.
- `tile_tap_correct` / `tile_tap_incorrect` — SAMPLED. See D5.
- `audio_unlock_web` — fires once when the web gesture gate completes. Adoption and drop-off telemetry.
- `app_boot` — fires once per cold boot. Platform-level distribution.

### D4. Clean-slate catalog vs mirroring Android

Android has no structured analytics — just file-level `LOGGER.info`. Mirroring it would produce a catalog of debug events, not product events. The clean-slate catalog here is organized around the v1 product questions (retention, funnel drop-off, web unlock conversion, per-pack adoption). When a real adapter ships and we see data, we'll revise — but the v1 catalog is shaped for the questions we know we have.

### D5. Sample `tile_tap_*` events at 10%

A 5-minute gameplay session easily emits 100+ tile taps. Across 10k sessions, that's 1M tile-tap events — realistic monthly adapter cost. Sampling at 10% brings it to 100k; still enough to see correct/incorrect ratios per stage per tile, well within any free-tier adapter quota.

Deterministic sample (not random): `hash(gameDoor + tileId + timestamp.floor(100ms)) % 10 === 0`. Why deterministic:

- Reproducible in tests (no `Math.random()` mocking).
- Stable per-(game, tile, moment) so a rapid-fire retry doesn't double-sample.
- `timestamp.floor(100ms)` — sub-100ms identical events collapse to one sample decision. Prevents a double-tap double-sampling.

Sampled events carry a `_sampled: true` prop so adapters can upweight by 10× if desired. Non-sampled (game_started, mastery_reached, etc.) carry no such flag.

Alternative: always fire. **Rejected** — volume economics. Alternative 2: fire only in dev. **Rejected** — then we never see the aggregate per-stage correct-ratio data in production.

### D6. Screen naming convention — route path

`screen('/')`, `screen('/choose-player')`, `screen('/game/41')`. Why:

- Routes already exist (via expo-router). Using them means no extra mapping table to maintain.
- `/game/41` trivially joins against `aa_games.txt` at analysis time.
- `screen()` is fired by the container on mount via `useMountEffect` — one-line boilerplate per screen.

Alternative: human-readable names (`'GameMenu'`, `'ChoosePlayer'`). **Rejected** — drifts from routes, requires a mapping table.

### D7. Prop naming: snake_case, lowercase

- `{ game_door: 41 }` not `{ gameDoor: 41 }` at the adapter boundary.

Wait — the discriminated union above uses camelCase. Reconciliation:

**Decision**: the API type signature is camelCase (matches TS ecosystem conventions); the adapter automatically transforms to snake_case at the wire layer. Each adapter writes that transform once. The no-op adapter skips it. Feature code writes camelCase; wire format is snake_case.

This keeps feature code idiomatic and the analytics warehouse queryable without fighting casing. Industry-common pattern (Segment's spec does exactly this).

### D8. PII policy

- **Never** pass player name in `props`.
- **Never** pass device IDs in `props`.
- `identify(playerId, traits)` — `playerId` is a local UUID (Zustand-generated), not anything externally meaningful. `traits` may carry `avatarIndex` but never `playerName`.
- The adapter may attach device IDs at its layer (PostHog does this automatically via its anonymous ID). `util-analytics` doesn't care.

This is a layer-boundary decision: call sites don't think about PII, because the layer that could smuggle it in is this one, and this one's typed catalog forbids it.

### D9. Settings-gate — `setAnalyticsEnabled`

Per ARCHITECTURE.md §12 and `aa_settings.txt`: `"Send analytics"` is the pack-level toggle. `data-language-assets` parses that and calls `setAnalyticsEnabled(bool)` during boot.

Implementation: module-level `let analyticsEnabled = false`. Default is `false` — events are no-ops until `setAnalyticsEnabled(true)` fires. The adapter checks the flag inside `track` / `identify` / `screen`. Defaulting to `false` is safer than `true` (data-less-by-default before config is applied).

### D10. No-op default, 3-line impl

```ts
let adapter: AnalyticsAdapter = {
  track() {},
  identify() {},
  screen() {},
};
```

That's it. No queue, no buffer, no `console.log`. Why not even a dev-mode `console.log` by default? Because the dev-mode log is its own adapter — `setAnalyticsAdapter(new ConsoleAdapter())` in `_layout.tsx` under `__DEV__`. Keeping the default zero-cost means tests don't get spammed.

### D11. Adapter swap seam

```ts
let adapter: AnalyticsAdapter = noopAdapter;
export function setAnalyticsAdapter(impl: AnalyticsAdapter): void {
  adapter = impl;
}
```

V2 change:

```tsx
// apps/alphaTiles/src/_layout.tsx
setAnalyticsAdapter(new PostHogAdapter({ apiKey: ... }));
```

One line. Every feature's `track(...)` call is unchanged.

## Risks / Trade-offs

- **[Risk]** Feature code writes a hundred `track('something_i_made_up')` calls before someone reviews the catalog — and `tsc` catches it because it's not in the union. **Mitigation**: the discriminated union is the review gate; CI fails on divergent events.
- **[Risk]** Catalog shape needs to change after we ship — every call site with the old shape errors. **Mitigation**: that's the point. A rename or prop change is a typechecked refactor, not a grep-and-hope.
- **[Risk]** Sampling hides correctness issues (a tile that's always incorrect only fires 10% of the time). **Mitigation**: 10% of a busy tile's taps is still hundreds of events per day. Broken tiles surface. If a deeper investigation is needed, a one-off 100% sample for a specific gameDoor is an adapter-level concern.
- **[Risk]** `setAnalyticsEnabled` called late — early events fire as no-ops by default. **Accepted**: early events (`app_boot`) are fired from `_layout.tsx` before pack load; if analytics is gated-off by pack settings, those events never fire. That's desired.
- **[Trade-off]** camelCase API vs snake_case wire — means adapter has a transform step. **Accepted**: idiomatic TS; transform is a one-liner `Object.fromEntries(Object.entries(props).map(...))`.
- **[Trade-off]** No-op default means no dev visibility into event firing. **Accepted**: a `ConsoleAdapter` dev-time swap is a one-liner. We just don't bundle it by default.
- **[Trade-off]** No buffering = events fired before adapter is set are lost. **Accepted**: `app_boot` + `setAnalyticsEnabled` + `setAnalyticsAdapter` should happen in the same tick of `_layout.tsx`'s init. If we're worried, we add a small buffer later — trivial follow-up.

## Open Questions

- Should there be a dedicated ADR for this change? **Yes, but not in this change's scope.** Added to follow-up list — `ADR-011: Analytics Abstraction` to be written before v2 adapter lands.
- `identify(playerId, traits)` — what traits are allowed? **Defer** until the v2 adapter is chosen. For v1, pass only `avatarIndex` (not name). If more are needed, expand the types.
- Is a `page_viewed` alias for `screen_viewed` needed for web-specific analytics tools? **Defer** until a real web adapter shows up with its own conventions. Easy to add.
- Should `audio_unlock_web` capture the time-to-unlock? **Maybe** — measures UX friction on web. Add `{ millisecondsSinceBoot: number }` prop. Include it now since it's cheap.
