# Tasks — door-names-settings

## 1. Door names (#37)
- [x] 1.1 parseGames: optional `GameName` column → `gameName`; tests
- [x] 1.2 validator: long-name warning, partial-names info, `Show game names` boolean; tests
- [x] 1.3 Door.name in doorsOf; tests
- [x] 1.4 menu renders name (fallback unlabelled), a11y label
- [x] 1.5 yue `GameName` header column (empty); `docs/translations/yue-game-names.md`

## 2. Next-door fix
- [x] 2.1 findNextUncompletedGame skips disabled doors; test

## 3. Settings (#44)
- [x] 3.1 usePlayerPreferencesStore (data-players); clear on deletePlayer; tests
- [x] 3.2 data-settings: effectiveSettingsOf + useEffectiveSettings + useSetPreference; tests
- [x] 3.3 menu + shell read effective settings
- [x] 3.4 feature-settings container/presenter + `/settings` route + menu tab
- [x] 3.5 i18n keys en + zh-HK + review sheet

## 4. Verify
- [x] 4.1 nx typecheck/lint/test, tools jest, yue web export
