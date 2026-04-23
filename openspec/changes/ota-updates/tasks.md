## 0. Preflight

- [ ] 0.1 Read `AGENTS.md` and `openspec/AGENT_PROTOCOL.md`
- [ ] 0.2 Read this change's `proposal.md` and `design.md` in full
- [ ] 0.3 Read required upstream change design docs (see `design.md → ## Context`)
- [ ] 0.4 Read required `docs/ARCHITECTURE.md` sections and referenced ADRs
- [ ] 0.5 (No Java source ported in this change — skip)
- [ ] 0.6 (No pack fixture relevant to this change — skip)
- [ ] 0.7 Confirm upstream changes are merged (`openspec status --all`); do not start if an upstream is only in-progress
- [ ] 0.8 Confirm `APP_LANG` and `PUBLIC_LANG_ASSETS` env vars are set for local runs
- [ ] 0.9 Confirm `nx graph` shows the libs this change will touch don't already exist with conflicting tags

## 1. Prerequisites (manual, one-time)

- [ ] 1.1 Developer runs `eas init` interactively in the repo root (once per project lifetime)
- [ ] 1.2 Commit the resulting `extra.eas.projectId` value in `app.config.ts`
- [ ] 1.3 Verify `eas whoami` shows the expected Expo org

## 2. Dependencies

- [ ] 2.1 Add `expo-updates` to runtime deps
- [ ] 2.2 Verify `@react-native-async-storage/async-storage` is present (installing if not)
- [ ] 2.3 Run `bun install` + `npx expo install --check` to confirm version alignment with the installed Expo SDK

## 3. Expo config — `app.config.ts`

- [ ] 3.1 Add `extra.eas.projectId` (populated by `eas init`, step 1)
- [ ] 3.2 Add `updates.url = "https://u.expo.dev/<projectId>"` — derived from projectId
- [ ] 3.3 Add `updates.checkAutomatically = "NEVER"`
- [ ] 3.4 Add `runtimeVersion = { policy: "appVersion" }`
- [ ] 3.5 Resolve config against `APP_LANG=eng` and assert shape via a test (or a `tsx --eval` snippet in CI)

## 4. `eas.json`

- [ ] 4.1 Add `"channel": "eng"` to the `eng` profile
- [ ] 4.2 Add `"channel": "tpx"` to the `tpx` profile
- [ ] 4.3 Add `"channel": "yue"` to the `yue` profile
- [ ] 4.4 Confirm `development`, `preview`, `production` profiles have no `channel` field
- [ ] 4.5 Document "adding a new language = adding a profile with `channel`" in the `eas.json` header comment (if JSON allows — else in `docs/GETTING_STARTED.md`)

## 5. `libs/alphaTiles/util-ota` library

- [ ] 5.1 Scaffold via `nx g @nx/js:lib util-ota --directory=libs/alphaTiles/util-ota --tags='type:util,scope:alphaTiles'`
- [ ] 5.2 Implement `runOtaCheck(opts: { checkTimeoutMs?: number, fetchTimeoutMs?: number, track: AnalyticsTrack }): Promise<OtaResult>`:
  - [ ] 5.2.1 Short-circuit if `Updates.isEnabled === false` → return `{ status: 'skipped-dev' }`
  - [ ] 5.2.2 Read `channel` via `Updates.channel ?? process.env.APP_LANG` (fallback for dev environments)
  - [ ] 5.2.3 Race `Updates.checkForUpdateAsync()` against a 5s timeout promise (configurable)
  - [ ] 5.2.4 On timeout → fire `app_update_failed` stage `'check'` reason `'timeout'`; return `{ status: 'failed', stage: 'check', reason: 'timeout' }`
  - [ ] 5.2.5 On error → fire `app_update_failed` stage `'check'` reason `'error'` with truncated message; return failed
  - [ ] 5.2.6 On `isAvailable: false` → return `{ status: 'no-update' }`
  - [ ] 5.2.7 On `isAvailable: true` → fire `app_update_available` with `{ updateId, channel }`
  - [ ] 5.2.8 Race `fetchUpdateAsync()` against a 10s timeout; on timeout / error → fire `app_update_failed` for stage `'fetch'`
  - [ ] 5.2.9 On fetch `isNew: true` → call `Updates.reloadAsync()`; on reload error fire `app_update_failed` stage `'reload'`
  - [ ] 5.2.10 Return discriminated union `OtaResult`
- [ ] 5.3 Implement `reportApplyIfNeeded(opts: { track: AnalyticsTrack }): Promise<void>`:
  - [ ] 5.3.1 Read persisted `ota.lastUpdateId` from AsyncStorage
  - [ ] 5.3.2 Read current `Updates.updateId`
  - [ ] 5.3.3 If persisted is null → do not fire; persist current id; return
  - [ ] 5.3.4 If persisted equals current → do not fire; return
  - [ ] 5.3.5 If persisted differs from current → fire `app_update_applied` with `{ fromUpdateId, toUpdateId, channel }`; persist current
- [ ] 5.4 Truncate `errorMessage` to 256 chars via helper
- [ ] 5.5 Export `runOtaCheck` + `reportApplyIfNeeded` + types from `src/index.ts`
- [ ] 5.6 Unit tests against mocked `expo-updates`:
  - [ ] 5.6.1 `isEnabled: false` → `status: 'skipped-dev'`, no events
  - [ ] 5.6.2 Check timeout → `app_update_failed` stage `'check'` reason `'timeout'`
  - [ ] 5.6.3 Check error → `app_update_failed` stage `'check'` reason `'error'`
  - [ ] 5.6.4 No update → no events, `status: 'no-update'`
  - [ ] 5.6.5 Update available + fetch success + reload → `app_update_available` fired, `reloadAsync` called
  - [ ] 5.6.6 Fetch timeout → `app_update_failed` stage `'fetch'` reason `'timeout'`
  - [ ] 5.6.7 Reload error → `app_update_failed` stage `'reload'` reason `'error'`
  - [ ] 5.6.8 `reportApplyIfNeeded` first launch → no event, persists id
  - [ ] 5.6.9 `reportApplyIfNeeded` same id → no event
  - [ ] 5.6.10 `reportApplyIfNeeded` different id → `app_update_applied` fired, new id persisted

## 6. Wire into boot flow

- [ ] 6.1 In the loading-screen container (`feature-loading` — assumed present per `loading-screen` change), after i18n init and before menu mount, call `await runOtaCheck({ track })`
- [ ] 6.2 Behavior does not block asset preload — run `runOtaCheck` and asset preload in parallel; await both before proceeding to menu (order: check resolves → if `applied` the app reloads; else asset preload finishes → menu)
- [ ] 6.3 In the app entry (`apps/alphaTiles/app/_layout.tsx`), invoke `reportApplyIfNeeded({ track })` via `useMountEffect` at the root
- [ ] 6.4 Confirm no `useEffect` antipattern is introduced (per `CLAUDE.md` rule — use `useMountEffect`)

## 7. Analytics event catalog

- [ ] 7.1 Extend `util-analytics`'s event catalog type with `app_update_available`, `app_update_applied`, `app_update_failed`
- [ ] 7.2 Extend the payload schema types to match the spec's payloads
- [ ] 7.3 Add catalog unit tests: each event type accepts its documented payload and rejects stray fields

## 8. Documentation

- [ ] 8.1 Add section "Publishing OTA updates" to `docs/GETTING_STARTED.md`:
  - [ ] 8.1.1 The `eas init` one-time prerequisite
  - [ ] 8.1.2 Publishing: `eas update --channel <lang> --message "<summary>"`
  - [ ] 8.1.3 Rollback: `eas update:republish --channel <lang>`
  - [ ] 8.1.4 Version-skew policy: `appVersion` must bump on any native-surface change; content-only changes do not bump
  - [ ] 8.1.5 What ships via OTA vs. what requires a rebuild (matrix)
- [ ] 8.2 Cross-link the new section from `ARCHITECTURE.md §13` and `ADR-009`

## 9. Verification

- [ ] 9.1 `openspec validate ota-updates` passes
- [ ] 9.2 `npx tsc --noEmit` passes across the workspace
- [ ] 9.3 Production build with `eas build --profile eng --platform android` succeeds and produces a binary whose embedded channel is `eng`
- [ ] 9.4 Publish a no-op update: `eas update --channel eng --message "smoke"` — confirm the binary picks it up on next cold launch
- [ ] 9.5 Observe `app_update_available` + `app_update_applied` events in analytics (or stdout in dev no-op adapter)
- [ ] 9.6 Confirm `Updates.isEnabled === false` in a dev build → no network call to EAS endpoint (verify via proxy / network inspector)
- [ ] 9.7 Simulate a check timeout (mock) and confirm `app_update_failed` fires with `stage: 'check', reason: 'timeout'`
