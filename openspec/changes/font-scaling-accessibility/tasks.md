# Tasks

Implement lang-pack-driven font scaling and migrate hardcoded fontSize values.

> Re-validated 2026-10-16 — see design.md "Re-validation against code" (R1–R5). Notes inline.

## 0. Preflight

- [x] Read `proposal.md` and `design.md`.
- [x] `grep -rn "fontSize:" libs/` and confirm the prompt's ~30-site count; record any extras for §5. — actual ~140 sites / ~45 files (R4).
- [x] Read current `typography.ts` and `buildTheme.ts` to confirm signatures.

## 1. `buildTypography(fontScale)`

- [x] Refactor `libs/shared/util-theme/src/lib/typography.ts` to export `buildTypography(fontScale: number)` returning the 6 slots scaled.
- [x] Keep the slot shape (`{ fontSize, lineHeight }`) identical so consumer access paths don't change.
- [x] Unit test: `buildTypography(1.0)` matches today's frozen values.
- [x] Unit test: `buildTypography(1.3)` returns each slot multiplied by 1.3.
- [x] Unit test: `buildTypography(2.0)` returns each slot doubled.

## 2. `buildTheme` Signature Update

- [x] Add optional `fontScale: number = 1.0` parameter to `buildTheme`. — also exposes `theme.fontScale`; `ThemeProvider` gains optional `fontScale` prop.
- [x] Pass it to `buildTypography`.
- [x] Type-check: existing call sites with two args still compile.

## 3. `LangAssetsProvider` Integration

Obsolete as worded: theme is built in `feature-loading/AppShell.tsx`, not `LangAssetsProvider` (R1). Done there instead:

- [x] Parse `Font Scale` per D1 (default 1.0; clamp `[0.5, 2.5]`; NaN → 1.0) — `data-settings/parseFontScale`, exposed as `effectiveSettingsOf(...).fontScale`.
- [x] Pass `fontScale` to `buildTheme` — `AppShell` → `<ThemeProvider fontScale>`.
- [x] Unit test: `Font Scale=1.3` → theme `typography.md.fontSize === 16 * 1.3` (`buildTheme.test.ts`; parse in `effectiveSettingsOf.test.ts`).
- [x] Unit test: no `Font Scale` key → default sizes.
- [x] Unit test: `Font Scale=banana` falls back to 1.0.
- [x] Unit test: `Font Scale=10` clamps to 2.5.
- [x] Validator: `Font Scale` added to known settings keys (no "unknown key" info).

## 4. Component Migration

Slot mapping replaced by `literal * fontScale` to keep default sizes pixel-identical (R2); access via `useScaledStyles(stylesFor)` (R3). Paths below corrected.

- [x] `libs/shared/ui-tile/src/lib/Tile.tsx` (+ `AudioButtonTile.tsx`).
- [x] `libs/shared/ui-custom-keyboard/src/lib/UiCustomKeyboard.tsx`.
- [x] `libs/shared/ui-door-grid/src/UiDoorGrid.tsx`.
- [x] `libs/shared/ui-score-bar/src/lib/ScoreBar.tsx`.
- [x] `libs/shared/ui-player-card/src/lib/UiPlayerCard.tsx`.
- [x] `libs/alphaTiles/feature-game-china/src/ChinaScreen.tsx`.
- [x] `libs/alphaTiles/feature-game-chile/src/ChileScreen.tsx`.
- [x] `libs/alphaTiles/feature-about/src/AboutScreen.tsx` (+ scale test in `AboutScreen.test.tsx`).
- [x] `libs/shared/ui-celebration/src/lib/Celebration.tsx`.
- [x] `grep -rn "fontSize:" libs/` again; migrate any remaining sites except `DoorSvg.tsx`. — all other game screens, settings, feedback, share, resources, loading, error, self-test, set-player-name, choose-player, game-shell, game-menu, web-audio-unlock-gate. Geometry exemptions commented (R4). `apps/alphaTiles/src/dev/Spike*` out of scope.

## 5. DoorSvg Exemption

- [x] Confirm `DoorSvg.tsx` retains `fontSize = width * 0.35`.
- [x] Add a one-line comment marking the geometry exemption.

## 6. Verification

- [x] Type-check — `nx run-many -t typecheck` (all projects).
- [x] Lint: `nx run-many -t lint`.
- [x] Unit tests pass.
- [ ] Visual smoke (Web): `APP_LANG=eng nx serve alphaTiles` — sizes look identical to pre-change. — pending: device QA (#57)
- [ ] Visual smoke: set `Font Scale=1.3` in the yue pack and verify all text scales with no clipping in core screens (menu, china, chile, about, scorebar). — pending: device QA (#57)
- [x] Unscaled-literal grep (R5) returns only `// geometry:` lines (Ecuador `TILE_FONT_SIZE`).

## Unresolved

- Clamp `[0.5, 2.5]` — confirm with design.
- yue pack doesn't set `Font Scale` yet; choose value after device QA.
- Fixed-size containers (tiles, keys, chips) may clip text at scale > 1; Tile uses `adjustsFontSizeToFit`, others don't.
