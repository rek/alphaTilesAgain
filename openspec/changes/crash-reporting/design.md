## Context

No Java analog. The legacy Android app had no crash reporting. This is a pure-new feature.

`util-crash-reporting` is a thin wrapper over `@sentry/react-native`. The library is `type:util` — it may not import `feature` libraries. Scope-tag wiring requires a container (`type:feature` is acceptable for the container component; the pure util functions live in the lib). The `<CrashReportingScope>` container reads `usePlayer` and `useLangAssets` and calls Sentry scope APIs as a side effect of value availability — using a handler/callback pattern, not a bare `useEffect`.

### Required reading for implementers

- `AGENTS.md`
- `openspec/AGENT_PROTOCOL.md`
- `docs/ARCHITECTURE.md` §3 (taxonomy), §11 (container/presenter)
- `docs/CODE_STYLE.md`
- `docs/PROJECT_ORGANIZATION.md` — `type:util` rules (no React imports beyond hooks; no `feature` imports)
- `libs/shared/util-langassets/` — `useLangAssets` shape and `langCode` location
- `libs/shared/data-players/` — `usePlayer` shape and `playerId` location
- `@sentry/react-native` external docs: https://docs.sentry.io/platforms/react-native/

## Goals / Non-Goals

**Goals:**
- Automatic unhandled JS + native crash capture via Sentry.
- Single root-level React error boundary via HOC.
- Sentry scope tags (`playerId`, `langCode`) attached when values first become available.
- Dev-safe: absent DSN → warn once, all functions no-op.
- Web safe: Sentry React Native silently no-ops on web.

**Non-Goals:**
- Per-screen or per-game error boundaries.
- Sentry performance tracing / profiling.
- User-visible error UI.
- Source-map upload CI automation.
- Per-event breadcrumb customization.

## Decisions

### D1. DSN environment handling

`SENTRY_DSN` is baked in at EAS build time via `app.config.ts` `extra` field. `initCrashReporting()` reads `Constants.expoConfig?.extra?.sentryDsn`. If falsy, it calls `console.warn('[crash-reporting] SENTRY_DSN not set — Sentry disabled')` once and returns. This makes all local dev builds functional without credentials.

```ts
// libs/alphaTiles/util-crash-reporting/src/lib/initCrashReporting.ts
export function initCrashReporting(): void {
  const dsn = Constants.expoConfig?.extra?.sentryDsn as string | undefined;
  if (!dsn) {
    console.warn('[crash-reporting] SENTRY_DSN not set — Sentry disabled');
    return;
  }
  Sentry.init({ dsn, enableNative: true });
}
```

### D2. Init order vs analytics-firebase

`initCrashReporting()` is called first in the root layout's boot sequence, before `initAnalytics()`. Rationale: crash reporting should be active before any code that might throw. Both calls live in the root layout — coordinate with `analytics-firebase` implementer to avoid merge conflicts.

### D3. Scope tag container

`<CrashReportingScope>` is a `type:feature` container (it imports hooks from `data-access` libs). It renders no JSX of its own — returns `null` or its children prop. It sets Sentry scope tags via `Sentry.setTag` inside a stable callback triggered by value changes. Avoids bare `useEffect`; instead uses a `useMountEffect` or value-driven handler pattern.

```ts
// Pseudocode — no bare useEffect
function CrashReportingScope({ children }: { children: React.ReactNode }) {
  const { player } = usePlayer();
  const { langCode } = useLangAssets();
  // called as a handler when values resolve, not a side-effect watcher
  useMountEffect(() => {
    if (player?.id) Sentry.setTag('playerId', player.id);
    if (langCode) Sentry.setTag('langCode', langCode);
  });
  return <>{children}</>;
}
```

Because player and langCode are available synchronously from context after their respective providers mount, a single `useMountEffect` is sufficient for v1. If they can change at runtime, revisit.

### D4. Error boundary placement

`withCrashBoundary(Component)` wraps only the root app layout component. Individual game containers are NOT wrapped — a crash inside a game should bubble to the root boundary. Wrapping game containers would suppress the error and silently show a blank sub-view.

```ts
// apps/alphaTiles/app/_layout.tsx
export default withCrashBoundary(RootLayout);
```

### D5. Web behavior

`@sentry/react-native` is designed to no-op gracefully on web. No platform branching needed in the utility functions. The `withCrashBoundary` HOC still provides a React error boundary on web (React error boundaries work on all platforms).

### D6. captureError signature

```ts
export function captureError(
  error: unknown,
  context?: Record<string, unknown>
): void;
```

Internally calls `Sentry.captureException(error, { extra: context })`. When DSN is absent (Sentry not initialized), this is a no-op (Sentry itself guards this).

## Unresolved Questions

- Should `CrashReportingScope` re-set tags if player or langCode changes mid-session (e.g., player switches language pack)? Default: yes, re-set on every render where values differ — evaluate perf in practice.
- EAS profile scope: apply `SENTRY_DSN` to `preview` and `production` profiles only, or also `development`? Deferred to implementer + team decision.
