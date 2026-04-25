## Context

No Java analog. The legacy Android app shipped a single baked-in lang pack; over-the-air content delivery is new.

`util-ota` handles EAS OTA JS bundle updates — a separate concern. This lib handles language content delivery only and does not interact with `util-ota`.

The active lang pack path is currently resolved by `libs/shared/util-langassets`. The downloader writes to `documentDirectory`; loader integration must check that path before falling back to the bundled assets.

### Required reading for implementers

- `AGENTS.md`
- `openspec/AGENT_PROTOCOL.md`
- `docs/ARCHITECTURE.md`
- `docs/CODE_STYLE.md`
- `libs/alphaTiles/util-ota/` — understand the OTA separation boundary; do not couple
- `libs/shared/util-langassets/` — current lang asset resolution; downloader output must plug in here
- `expo-file-system` docs: https://docs.expo.dev/versions/latest/sdk/filesystem/

## Goals / Non-Goals

**Goals:**
- Boot-time version check via `latest.json`.
- Download + unzip full pack ZIP when a newer compatible version is available.
- Stage the downloaded pack for activation on the next full boot.
- Degrade gracefully on network error, bad zip, or missing env vars.

**Non-Goals:**
- Delta / partial downloads.
- Hot-swap without restart.
- Pack signature verification in v1.
- User-facing progress UI.
- Cross-language switching.
- Interaction with `util-ota`.

## Decisions

### D1. API surface

Three public functions exported from the library index:

```ts
// Check remote for a newer pack; returns remote version string or null if no update needed / error.
function checkForLangPackUpdate(): Promise<string | null>;

// Download and unzip the given version into the staged directory.
function downloadLangPack(version: string): Promise<void>;

// Return the path to the active pack: downloaded if present, else null (caller falls back to bundled).
function getActiveLangPackPath(): Promise<string | null>;
```

No React hooks — pure async functions. Callers are boot-time wiring code in the app shell.

### D2. Directory layout

```
${FileSystem.documentDirectory}downloaded/<langCode>/<version>/
```

Example: `…/downloaded/yue/1.2.0/`

A `current.txt` file at `downloaded/<langCode>/current.txt` records the activated version string. `getActiveLangPackPath` reads this file to resolve the full path.

### D3. Version comparison

Treat version strings as semver. Use a lightweight semver compare (no full `semver` package — implement a three-part numeric compare to avoid native dep churn).

Remote version is considered "newer" iff `semver.gt(remote, local)` where `local` is read from `current.txt` (or `"0.0.0"` if absent).

### D4. minAppVersion check

`latest.json` shape:
```ts
{ version: string; minAppVersion: string }
```

Read the running app version from `expo-constants` (`Constants.expoConfig.version`). If `semver.lt(appVersion, minAppVersion)`, skip download and log a warning. Never crash.

### D5. Failure modes

| Failure | Behavior |
|---|---|
| Network error on `latest.json` fetch | Log, return `null` from `checkForLangPackUpdate`, continue boot |
| `latest.json` parse error | Same as network error |
| Download error (non-2xx, timeout) | Log, leave staged dir untouched, continue boot |
| Unzip error / invalid ZIP | Delete partial staged dir, continue boot |
| `LANG_PACK_BASE_URL` absent | `checkForLangPackUpdate` returns `null` immediately (no-op) |
| `APP_LANG` absent | Same no-op |

No user-facing error display in v1. All errors are swallowed after logging (`console.warn`).

### D6. Activation model

Activation is deferred: the newly downloaded pack is written to the staged directory, `current.txt` is updated, and the pack is available on the **next full app boot** via `getActiveLangPackPath`. No live reload, no React state invalidation triggered.

### D7. Env var names

| Var | Example | Used by |
|---|---|---|
| `LANG_PACK_BASE_URL` | `https://cdn.example.com/packs` | Constructs fetch URL |
| `APP_LANG` | `yue` | Lang code path segment |

Both injected at EAS build time via `app.config.js` `extra` → `process.env`. If either is falsy, all functions are no-ops.

CDN URL pattern:
- Version manifest: `<LANG_PACK_BASE_URL>/<APP_LANG>/latest.json`
- Pack ZIP: `<LANG_PACK_BASE_URL>/<APP_LANG>/<version>.zip`

### D8. Relationship to util-ota

`util-ota` triggers JS bundle updates via EAS Update channels. `util-lang-pack-downloader` downloads language content ZIPs from a separate CDN. They share no code, no state, and no coordination. Boot wiring calls each independently.

## Unresolved Questions

- Retry policy on failed download: retry once immediately, retry on next boot, or never retry?
- Should `latest.json` fetch have a hard timeout (e.g., 5 s)? Which value?
- Should old downloaded versions be pruned after a successful update to reclaim storage?
- Should `current.txt` be replaced atomically (write temp + rename) or direct write?
