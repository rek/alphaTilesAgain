## Why

Issue #42. Games score points but a learner has no way to check themselves: no run of questions with a score at the end. Decision taken (issue): an **ungraded self-check** — answer a run of questions, see own score, nothing stored, nothing reported. Cantonese (yue) first.

## What Changes

- New lib `libs/alphaTiles/feature-self-test` (`type:feature`): `buildSelfTest` (pure run builder), `selfTestScore` (pure), `SelfTestContainer` + `SelfTestScreen`.
- Questions come from an existing mechanic's question builder — Thailand's `setupThailandRound` (4-choice match) — using the challenge levels of the pack's own Thailand doors. No new mechanic.
- `feature-game-thailand` exports `setupThailandRound`, `decodeThailandChallengeLevel`, `ThailandScreen` and a new extracted `thailandRoundView` (display mapping, shared with `ThailandContainer`; behaviour unchanged).
- New route `apps/alphaTiles/app/self-test.tsx`.
- Menu: "Check yourself" button below the door grid (only when the pack can build a self-test).
- i18n: `chrome.selfTest.*`, `chrome.menu.self_test` in `en.json` + `zh-HK.json`; zh-HK rows in `docs/translations/zh-HK-review.md`.

## Capabilities

### New Capabilities

- `self-test` — ungraded 10-question self-check with an end-of-test score.

### Modified Capabilities

- `game-menu` — optional self-test entry below the door grid.

## Impact

- No progress, tracker, points or analytics writes. Door catalogue, door progress and the ladder are untouched (the self-test is not a Door).
- Packs without an enabled Thailand door: no menu entry, route shows an empty state.
