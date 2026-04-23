## Context

`ADR-009` commits to EAS Update with one channel per language pack. This change is the implementation of that decision. The design space has already been narrowed (EAS over CodePush / custom OTA / rebuild-only); what remains is the runtime shape: when does the app check, how long does it wait, what happens on success / failure, and what happens to binaries whose native surface has drifted from the update's assumptions.

The boot sequence surrounding the update check matters because the user is staring at a loading screen. Either the app is already fast (no noticeable difference from no-OTA) or it fails silently and continues — the user should never be stuck because of an OTA call.

### Required reading for implementers

- `AGENTS.md` — entry doc; read first.
- `openspec/AGENT_PROTOCOL.md` — pickup protocol.
- `docs/ARCHITECTURE.md` §4 (per-language build pipeline — EAS channel per language), §6 (runtime data flow — boot sequence where the check fits).
- `docs/decisions/ADR-009-ota-via-eas-update.md`.
- **Upstream OpenSpec changes (must be merged before starting):**
  - `analytics-abstraction` — supplies `track('app_update_available' | 'app_update_applied' | 'app_update_failed')` events.
  - Optional forward dep: `loading-screen` — the OTA check lives in the loading orchestration; if `loading-screen` is already merged, wire into it; otherwise ship the hook and let `loading-screen` consume it.
  - Read `openspec/changes/analytics-abstraction/design.md` in full; skim `openspec/changes/loading-screen/design.md` for sequence context.
- **Source Java files being ported:** (No Java source ported in this change — EAS Update is new-build plumbing with no Android analog.)
- **Fixture paths:** (No pack fixture relevant to this change — skip. EAS channel-per-language is driven by `eas.json` from `port-foundations`, not by pack content.)
- Confirm `eas.json` (from `port-foundations`) already has per-language profiles; OTA channel names must mirror `APP_LANG` values.

## Goals / Non-Goals

**Goals:**

- Content-only updates (JS bundle + bundled assets reachable from JS) ship to installed apps within one launch of publishing.
- The OTA check never blocks boot for more than 5 seconds in the worst case.
- Per-language isolation — an `eng` update never reaches a `tpx` install and vice versa.
- Native-code changes are rejected from OTA by the runtime-version policy; users on an old native binary continue to run their bundled pack (no crash, no broken state).
- Development builds do not contact the EAS endpoint (`Updates.isEnabled` is false in dev).
- Analytics capture the three meaningful transition points (`available`, `applied`, `failed`) so we can observe update adoption and debug regressions.
- No UI surface added.

**Non-Goals:**

- Staged rollouts (branches / rollout percentages). Full-channel only in v1.
- User-facing "update available" prompt. Auto-apply, no dialog.
- CI publish step. The runtime is ready; wiring `eas update` in CI is a separate change.
- A diagnostics screen. Referenced in ADR-009 but owned by a future change.
- Offline-specific handling beyond "on any failure, continue with bundled assets."

## Decisions

### D1. Check timing — during loading screen, after i18n init, before menu mount

The loading screen already blocks user interaction for asset preload + i18n init. Inserting the OTA check there is free from a UX standpoint — the user is already waiting. Placing it **after** i18n init means if the update downloads and reloads, the user sees the loading screen again but at worst once; placing it **before** would force a double-init if an update lands.

Sequence:

1. Loading screen mounts.
2. i18n init resolves.
3. Language-pack asset preload starts (in parallel with OTA check).
4. OTA check runs with a 5s timeout.
5. On update: fetch → reload. User sees the loading screen restart; second pass has `isEnabled` → already-applied update, no further check.
6. On no-update / error: continue.
7. Asset preload finishes → mount menu.

Alternatives rejected:

- **Check before i18n init.** Rejected: if an update changes i18n strings, current-session i18n init is wasted. Also: checking while loading the previous session's strings is cognitively awkward.
- **Check after menu mounts** (background). Rejected: the `reloadAsync()` call would interrupt an interactive user mid-tap. Loading screen is the one moment where reload is free.
- **Check in parallel with asset preload, fire-and-forget**. Appealing — zero wall-clock cost on the happy path. Rejected for v1: if the update fetch is in flight when asset preload finishes, we either block (defeats the point) or abandon the fetch (wastes bandwidth and leaves the update for "next launch"). Hybrid in D2.

### D2. Timeout — 5 seconds on the `checkForUpdateAsync` call

`Updates.checkForUpdateAsync()` is the metadata fetch; `fetchUpdateAsync()` downloads the bundle. The 5-second budget covers the metadata round trip (typically <1s on decent connectivity; 5s accommodates slow mobile networks without being painful).

Budget breakdown:

- **0–5s**: `checkForUpdateAsync()` — if `isAvailable` resolves, proceed to fetch.
- **5s+**: timeout wins → log `app_update_failed` with reason `'check_timeout'` → continue with bundled assets.
- **If `isAvailable`**: `fetchUpdateAsync()` gets its own timeout. Design question: do we time-box the fetch?
  - Decision: yes — **additional 10 seconds for fetch**. Total OTA budget: 15s worst case. Over that → abort, log `app_update_failed` reason `'fetch_timeout'`, continue.
  - Rationale: a fetch that takes >10s on modern mobile connectivity is pathological; the user is better served by the bundled pack than by a minute-long loading screen.

Timeouts are implemented by racing `checkForUpdateAsync()` / `fetchUpdateAsync()` against `new Promise((_, rej) => setTimeout(rej, ...))`. On timeout, the underlying call is not cancelled (expo-updates doesn't expose cancellation) — it runs to completion in the background and the next launch benefits from any cached result.

### D3. Runtime-version policy — `{"policy": "appVersion"}`

Two binaries with the same `version` / `versionCode` / `buildNumber` (which Expo maps to `appVersion` in CFBundle / PackageInfo) can OTA each other. Different versions are isolated — an OTA published against `1.2.0` will never apply to a `1.1.0` install.

This maps "native binary" to "OTA pool" at the right granularity: any JS-only change ships via OTA; any native-surface change (new module, Expo SDK bump, native plugin added to `app.config.ts`) requires an app-version bump → new build → new pool.

Alternatives rejected:

- **Manual `runtimeVersion` string.** Requires a developer to remember to bump it on every native change. Human-error-prone; `appVersion` policy couples to the thing that's already bumped for release.
- **`sdkVersion` policy.** Only re-pools on Expo SDK bumps; misses changes like added plugins or native modules that don't bump SDK.
- **`nativeVersion` policy.** Expo-deprecated; same scope as `appVersion`.

Consequence: every production release must bump `version` (or `versionCode` / `buildNumber`) in `app.config.ts`. Forgetting means OTA would incorrectly reach the previous version's users with code that references a newer native surface. CI lint should guard this (future change).

### D4. Channel-per-language — declared in `eas.json`, not at runtime

Each language-pack profile in `eas.json` gets a `"channel": "<lang>"` field. `expo-updates` reads the channel from the compiled binary's embedded `channel` (set at build time by EAS), not from runtime — there's no runtime API to change channels.

```json
{
  "build": {
    "eng": { "extends": "production", "env": { "APP_LANG": "eng" }, "channel": "eng" },
    "tpx": { "extends": "production", "env": { "APP_LANG": "tpx" }, "channel": "tpx" },
    "yue": { "extends": "production", "env": { "APP_LANG": "yue" }, "channel": "yue" }
  }
}
```

Shared profiles (`development`, `preview`, `production`) get no `channel` — they're not OTA targets for end users.

Consequence: channel is bound at build time. Adding a new language = adding a profile = new build per the existing process (per ADR-001). No new mechanism for OTA.

### D5. Dev-mode skip via `Updates.isEnabled`

In a development build (run via `expo start --dev-client` or Metro), `Updates.isEnabled === false`. Guard the check at the top of the boot logic:

```ts
if (!Updates.isEnabled) return { status: 'skipped-dev' };
```

No OTA telemetry fires in dev. This prevents dev builds from contacting the EAS endpoint and from logging noisy `app_update_failed` events (which they would otherwise, because the dev build has no embedded update manifest).

### D6. Failure semantics — always fall through, always log

Every failure path ends in "continue boot with bundled assets":

| Path | Event | Reason tag |
|---|---|---|
| `Updates.isEnabled === false` | none | dev build, silent |
| `checkForUpdateAsync` throws | `app_update_failed` | `'check_error'` |
| `checkForUpdateAsync` times out (5s) | `app_update_failed` | `'check_timeout'` |
| `isAvailable === false` | none | nothing to do |
| `isAvailable === true` | `app_update_available` | — (then proceed to fetch) |
| `fetchUpdateAsync` throws | `app_update_failed` | `'fetch_error'` |
| `fetchUpdateAsync` times out (10s) | `app_update_failed` | `'fetch_timeout'` |
| `reloadAsync` throws | `app_update_failed` | `'reload_error'` |
| Fetch + reload succeeds | `app_update_applied` | — (app reloads, event fires in the new session via a boot flag read from Updates metadata) |

`app_update_applied` is tricky: `reloadAsync()` restarts the app, so the event must fire **in the next session**. We detect "just applied an update" by reading `Updates.updateId` on boot and comparing to a value persisted from the previous session. If they differ, the update was applied → fire `app_update_applied` with `{ from, to }` ids, then persist the new id. (`to` is always `Updates.updateId`; `from` is the previous persisted value.) First-ever launch: no prior value → suppress the event (it's not an applied update, it's an initial install).

Persistence layer: AsyncStorage under key `ota.lastUpdateId`. Writes happen at the end of the boot flow (after successful app mount) to avoid attributing a crash to a "successful update apply."

### D7. Event payloads

| Event | Payload |
|---|---|
| `app_update_available` | `{ updateId: string, channel: string }` |
| `app_update_applied` | `{ fromUpdateId: string \| null, toUpdateId: string, channel: string }` |
| `app_update_failed` | `{ stage: 'check' \| 'fetch' \| 'reload', reason: 'timeout' \| 'error', errorMessage?: string, channel: string }` |

`channel` is always attached for cross-event correlation. `errorMessage` is best-effort — on timeout it's literally `'timeout'`; on throw it's `err.message` truncated to 256 chars.

### D8. `eas init` as a one-time manual prerequisite

Running `eas init` creates an EAS project and writes `extra.eas.projectId` into `app.config.ts`. This is a one-shot developer action, not a build step. Documented in `docs/GETTING_STARTED.md` under "Initial setup" with the exact command. After `eas init`, the `projectId` is committed to the repo.

Rationale for not automating: `eas init` is interactive (prompts for org / project name) and should only ever run once per project. Automating would either require non-interactive flags (fragile) or risk running it twice (creates duplicate projects). Manual + documented is the right shape.

### D9. The update-check module lives in `util-ota` (new util lib) — OR inlined in the loading-screen container

Two shapes considered:

**Option A: new `libs/alphaTiles/util-ota` library.**

- Pro: boot-time side effects isolated; easy to unit-test with a mocked `expo-updates`; reusable if a diagnostics screen later surfaces update state.
- Con: adds a lib for ~80 lines of code.

**Option B: inline in `feature-loading` (the loading-screen feature).**

- Pro: smaller blast radius; the loading screen already owns boot flow.
- Con: testing needs to stub `expo-updates` at the feature level; harder to reuse for a diagnostics screen.

Decision: **Option A** — `libs/alphaTiles/util-ota`. Cost is low; isolation is worth it. Surface:

```ts
export async function runOtaCheck(opts: {
  checkTimeoutMs: number;  // default 5000
  fetchTimeoutMs: number;  // default 10000
  track: AnalyticsTrack;   // injected for testability
}): Promise<OtaResult>;

export async function reportApplyIfNeeded(opts: {
  track: AnalyticsTrack;
}): Promise<void>;
```

`OtaResult` is a discriminated union: `{ status: 'skipped-dev' | 'no-update' | 'applied' | 'failed', ... }`. `reportApplyIfNeeded` is the boot-time check for "did we just apply an update?" (D6) — called separately because it needs to fire **after** the mount succeeds, not during the pre-mount check.

Tags: `type:util`, `scope:alphaTiles`. Depends on `expo-updates`, `@react-native-async-storage/async-storage`, and the `util-analytics` type-only import for `AnalyticsTrack`.

### D10. `Updates.checkAutomatically = "NEVER"` in `app.config.ts`

`expo-updates` can auto-check on app load without any code. We disable that because:

- Auto-check fires on every app foreground, not just cold start — noisy.
- No control over timeout or error handling with auto-check.
- Can't integrate with our analytics catalog.

Manual control via `runOtaCheck` is the right shape.

## Risks / Trade-offs

- **[Risk]** Forgetting to bump `appVersion` on a native-surface change → OTA incorrectly reaches users on an incompatible binary → crash on launch. **Mitigation**: lint rule in CI that requires `version` bump when `app.config.ts` plugins array, native deps, or `expo-updates`/`expo-*` versions change. Out of scope for this change; tracked as follow-up.
- **[Risk]** Bad update gets published → users get it on next launch → crash loop (update is applied before we can un-publish). **Mitigation**: EAS Update supports `eas update:republish` — republishing a prior update version to the same channel recovers affected users on their next launch. Document in `docs/GETTING_STARTED.md`.
- **[Risk]** `reloadAsync()` is called on a non-updated install (edge case in expo-updates' internal state) → unnecessary restart. **Mitigation**: only call `reloadAsync` after `fetchUpdateAsync` returns `isNew: true`.
- **[Risk]** Analytics `app_update_applied` double-fires if boot crashes between "apply" and "persist new id" and the user retries. **Mitigation**: persist the new id immediately after the mount-success boundary (D6). Accept that a boot crash exactly between mount and persist re-fires the event — rare, non-critical for a telemetry event.
- **[Risk]** 5s check timeout is too aggressive on poor connectivity → users miss updates they'd otherwise have received. **Mitigation**: the check retries on the next cold launch. Most users launch daily; missing one check costs at most one day of update latency. Accept.
- **[Trade-off]** Auto-apply (no user prompt) means users can't defer an update. **Accepted** — forcing a user through a prompt on every launch where an update is available adds friction for no gain; AlphaTiles has no data loss risk from a restart mid-session (state is persisted).
- **[Trade-off]** AsyncStorage write for `ota.lastUpdateId` on every boot — small, but a native-side I/O call. **Accepted** — AsyncStorage is already the persistence layer for settings/profiles; one extra key is negligible.
- **[Trade-off]** Separate `util-ota` library for ~80 lines of code. **Accepted** — isolation + testability outweigh the line-count overhead; library scaffolding is free in NX.

## Migration Plan

1. Run `eas init` once (developer, not CI). Commit the generated `extra.eas.projectId`.
2. Install `expo-updates` + `@react-native-async-storage/async-storage` (latter may already be present for player profiles).
3. Update `apps/alphaTiles/app.config.ts`: add `updates.url`, `updates.checkAutomatically = "NEVER"`, `runtimeVersion.policy = "appVersion"`, `extra.eas.projectId`.
4. Update `eas.json`: add `"channel": "<lang>"` to each language profile.
5. Scaffold `libs/alphaTiles/util-ota`.
6. Implement `runOtaCheck` + `reportApplyIfNeeded` with tests against mocked `expo-updates`.
7. Wire `runOtaCheck` into the loading-screen container's boot flow (after i18n init, before menu mount).
8. Wire `reportApplyIfNeeded` into the app entry post-mount (`useMountEffect` on the root).
9. Add the three events to `util-analytics`'s event catalog.
10. Document publishing + version-skew policy in `docs/GETTING_STARTED.md`.
11. First preview build: verify end-to-end by publishing a no-op JS change, confirming the `eng` preview build picks it up on next launch.

Rollback: revert the commit. The app reverts to no-OTA behavior — always boots from bundled assets. `expo-updates` dependency remains installed but unused until the wiring returns.

## Open Questions

- Do we expose `Updates.runtimeVersion` + `Updates.updateId` anywhere user-visible in v1? **Defer to diagnostics change.** Not urgent — support requests for OTA issues are zero until OTA exists.
- Is AsyncStorage the right place for `ota.lastUpdateId`, or should we use `expo-file-system` for better crash durability? **AsyncStorage is fine** — the event duplication risk is low enough; file-system would add boilerplate.
- Should we delay the OTA check by N seconds on first-ever launch (so the user sees the menu sooner at the cost of first-launch updates)? **No** — first launch is the one time the user has no expectation of latency; accepting the 5-15s budget is fine. The next launch is the one to optimize.
- Preview / development channels: do we want OTA on the `preview` profile for dogfooding? **Defer** — for v1 only language-pack profiles get channels; revisit if preview testers need faster iteration.
