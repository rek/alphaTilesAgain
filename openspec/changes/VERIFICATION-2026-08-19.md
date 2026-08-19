# Verification sweep — 2026-08-19

Every open change checked against the **code**, not its `tasks.md` checkbox count.
Prompted by `yue-writing-audio` reading 2/51 while the work had fully shipped.

**Baseline:** 132 suites / 976 tests pass; `tsc -p apps/alphaTiles/tsconfig.app.json`
is clean. (Note `tsconfig.base.json` has no `jsx` flag — typechecking against it
produces spurious TS17004 errors. Use the app config.)

## Corrected

| Change | Was | Truth |
|---|---|---|
| `yue-writing-audio` | 2/51 | **Code complete.** Commit `7a27f56` shipped both the 13 mp3s and `pickAudioForChar.ts`. Boxes now ticked; only manual QA remains. |
| `yue-composite-numerals` | 38/49 | **Code complete.** Chain shipped in `GameShellContainer.tsx` (`GAP_MS = 150`). Remaining = deferred tests + QA. |
| `game-taiwan` | 57/68 | Accurate, but **no code outstanding** — all remaining boxes are manual QA, PM confirmations or legal. |
| `scorebar-hud-fidelity` | 15/19 | Component + assets + a11y label all correct, but a **route-wiring gap** was found — see § 7 in its tasks.md. |

## New defect found

`ScoreBar` tracker icons are injected per-route and **only 9 of 19 routes pass them**.
`thailand.tsx` is missing them, and Thailand is **5 of yue's 11 live doors** — so nearly
half of what a yue player sees today falls back to non-image trackers. Recorded as
tasks 7.1/7.2 in `scorebar-hud-fidelity`.

## Confirmed genuinely not started

`analytics-firebase` (no firebase dep; `libs/shared/util-analytics` adapter registry
exists as a no-op, as documented), `crash-reporting` (no sentry — an earlier grep hit
was `ProgressEntry` matching "sEntry"), `e2e-tests-maestro` (no `.maestro/`),
`lang-pack-downloader`, `onboarding-tutorial`, `player-stats-screen` (no route;
`useTotalPoints` exists unrendered), `storybook-visual-regression`, plus the remaining
backlog changes.

`haptics-feedback` is 0/26, but **`expo-haptics ~15.0.8` is already a dependency** and
entirely unused — a small head start.

## Rule going forward

Checkbox ratios in this repo are documentation artifacts, not build signals. To judge
whether a change is done: grep for the symbols its design names, check assets on disk,
run the lib's tests, and read `git log` for the touched paths.
