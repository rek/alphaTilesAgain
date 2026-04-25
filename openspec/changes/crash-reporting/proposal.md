## Why

Unhandled JS exceptions and native crashes currently disappear silently in production. Without visibility into errors from field devices (Android phones in minority language communities, often low-end hardware), regressions go undetected until a user reports by word-of-mouth. Sentry gives automatic crash capture with stack traces and contextual metadata.

## What Changes

- Add `libs/alphaTiles/util-crash-reporting` (`type:util`, `scope:alphaTiles`).
- Add `@sentry/react-native` as an explicit app dependency.
- Implement and export: `initCrashReporting()`, `captureError(error, context?)`, `withCrashBoundary(Component)` HOC.
- Add `<CrashReportingScope>` container that sets `playerId` and `langCode` as Sentry scope tags.
- Wrap root app layout in `withCrashBoundary`; wire `<CrashReportingScope>` inside the layout.
- `initCrashReporting()` called once at app boot before any other init; safe no-op when `SENTRY_DSN` absent.
- EAS build config gains `SENTRY_DSN` as a build-time env var.

## Capabilities

### New Capabilities

- `crash-reporting` — automatic forwarding of unhandled JS errors and native crashes to Sentry, tagged with active player and language pack; opt-out-safe in dev builds lacking DSN.

## Impact

- New lib `libs/alphaTiles/util-crash-reporting`.
- New runtime dep `@sentry/react-native`.
- Root layout (`apps/alphaTiles/app/_layout.tsx`) gains `withCrashBoundary` wrap and `<CrashReportingScope>` child — **potential merge-conflict surface** with sibling change `analytics-firebase`, which also touches this bootstrap file.
- `eas.json` / EAS secrets gain `SENTRY_DSN` env var documentation.
- No game logic changes. No user-facing UI.

## Out of Scope

- A settings UI or user-visible error dialog.
- Per-screen or per-game boundaries (root boundary only).
- Source-map upload automation (CI step, deferred).
- Performance monitoring (Sentry tracing/profiling).

## Unresolved Questions

- Should `captureError` be a no-op (silently) or log to console when DSN absent? Currently: warn once then no-op.
- Which EAS profile(s) receive the DSN — preview + production only, or dev profile too?
