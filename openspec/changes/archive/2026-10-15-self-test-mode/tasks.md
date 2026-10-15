# Tasks

## 1. Thailand lib: expose question builder + presenter

- [x] Extract `thailandRoundView.ts` from `ThailandContainer` (no behaviour change).
- [x] Add `thailandQuestion`; export it, `ThailandScreen`, `thailandRoundView` from `index.ts`.

## 2. feature-self-test lib

- [x] Scaffold `libs/alphaTiles/feature-self-test` (`type:feature,scope:alphaTiles`), tsconfig path.
- [x] `buildSelfTest` (D1, D2) + `selfTestScore`.
- [x] Tests: real yue run; empty for no Thailand doors; seeded determinism; score; no progress/analytics imports (D5).
- [x] `SelfTestScreen` presenter (question view + end card), `SelfTestContainer` (D3, D7).

## 3. App + menu

- [x] Route `apps/alphaTiles/app/self-test.tsx`.
- [x] Menu footer button (D6), hidden without source doors.

## 4. i18n + docs

- [x] `chrome.selfTest.*`, `chrome.menu.self_test` in en + zh-HK; review sheet rows.
- [x] GLOSSARY "Self-test"; ARCHITECTURE note.

## 5. Verify

- [x] typecheck, lint, test, tools tests, yue web export.
- [x] Playwright smoke: menu → self-test → 10 answers → score screen, no console errors.
