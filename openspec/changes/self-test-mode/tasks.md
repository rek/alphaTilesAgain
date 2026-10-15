# Tasks

## 1. Thailand lib: expose question builder + presenter

- [ ] Extract `thailandRoundView.ts` from `ThailandContainer` (no behaviour change).
- [ ] Export `setupThailandRound`, `decodeThailandChallengeLevel`, `ThailandScreen`, `thailandRoundView` from `index.ts`.

## 2. feature-self-test lib

- [ ] Scaffold `libs/alphaTiles/feature-self-test` (`type:feature,scope:alphaTiles`), tsconfig path.
- [ ] `buildSelfTest` (D1, D2) + `selfTestScore`.
- [ ] Tests: real yue run; empty for no Thailand doors; seeded determinism; score; no progress/analytics imports (D5).
- [ ] `SelfTestScreen` presenter (question view + end card), `SelfTestContainer` (D3, D7).

## 3. App + menu

- [ ] Route `apps/alphaTiles/app/self-test.tsx`.
- [ ] Menu footer button (D6), hidden without source doors.

## 4. i18n + docs

- [ ] `chrome.selfTest.*`, `chrome.menu.self_test` in en + zh-HK; review sheet rows.
- [ ] GLOSSARY "Self-test"; ARCHITECTURE note.

## 5. Verify

- [ ] typecheck, lint, test, tools tests, yue web export.
- [ ] Playwright smoke: menu → self-test → 10 answers → score screen, no console errors.
