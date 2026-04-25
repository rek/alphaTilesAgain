# Tasks

Implement lang-pack-driven font scaling and migrate hardcoded fontSize values.

## 0. Preflight

- [ ] Read `proposal.md` and `design.md`.
- [ ] `grep -rn "fontSize:" libs/` and confirm the prompt's ~30-site count; record any extras for §5.
- [ ] Read current `typography.ts` and `buildTheme.ts` to confirm signatures.

## 1. `buildTypography(fontScale)`

- [ ] Refactor `libs/shared/util-theme/src/lib/typography.ts` to export `buildTypography(fontScale: number)` returning the 6 slots scaled.
- [ ] Keep the slot shape (`{ fontSize, lineHeight }`) identical so consumer access paths don't change.
- [ ] Unit test: `buildTypography(1.0)` matches today's frozen values.
- [ ] Unit test: `buildTypography(1.3)` returns each slot multiplied by 1.3.
- [ ] Unit test: `buildTypography(2.0)` returns each slot doubled.

## 2. `buildTheme` Signature Update

- [ ] Add optional `fontScale: number = 1.0` parameter to `buildTheme`.
- [ ] Pass it to `buildTypography`.
- [ ] Type-check: existing call sites with two args still compile.

## 3. `LangAssetsProvider` Integration

- [ ] In `LangAssetsProvider`, parse `settings.find('Font Scale')` per design D1 (default 1.0; clamp `[0.5, 2.5]`; NaN → 1.0).
- [ ] Pass `fontScale` to `buildTheme`.
- [ ] Unit test: provider with `Font Scale=1.3` builds a theme whose `typography.md.fontSize === 16 * 1.3`.
- [ ] Unit test: provider with no `Font Scale` key builds a theme with default sizes.
- [ ] Unit test: `Font Scale=banana` falls back to 1.0.
- [ ] Unit test: `Font Scale=10` clamps to 2.5.

## 4. Component Migration

For each file below, replace every hardcoded `fontSize` (and matching `lineHeight` if present) with the mapped `theme.typography.<slot>` access via `useTheme()`. Do not change layout, color, or any unrelated style.

- [ ] `libs/shared/ui-tile/src/lib/Tile.tsx` — 28 → `xl`.
- [ ] `libs/shared/ui-keyboard/src/lib/UiCustomKeyboard.tsx` — 18 → `md`; 20 → `lg`.
- [ ] `libs/shared/ui-doors/src/lib/UiDoorGrid.tsx` — 24 → `xl`; 16 → `md`.
- [ ] `libs/shared/ui-scorebar/src/lib/ScoreBar.tsx` — 16 → `md`; 10 → `xs`.
- [ ] `libs/alphaTiles/feature-choose-player/.../UiPlayerCard.tsx` — 14 → `sm`; 13 → `sm`.
- [ ] `libs/alphaTiles/feature-game-china/.../ChinaScreen.tsx` — 11 → `xs`; 22 → `lg`.
- [ ] `libs/alphaTiles/feature-game-chile/.../ChileScreen.tsx` — 18 → `md`; 22 → `lg`; 14 → `sm`.
- [ ] `libs/alphaTiles/feature-about/.../AboutScreen.tsx` — 24 → `xl`; 22 → `lg`; 16 → `md`; 14 → `sm`.
- [ ] `libs/.../Celebration.tsx` — 18 → `md`.
- [ ] `grep -rn "fontSize:" libs/` again; migrate any remaining sites except `DoorSvg.tsx`.

## 5. DoorSvg Exemption

- [ ] Confirm `DoorSvg.tsx` retains `fontSize = width * 0.35`.
- [ ] Add a one-line comment marking the geometry exemption (e.g. `// geometry: scales with SVG width, not theme typography`).

## 6. Verification

- [ ] Type-check: `npx tsc --noEmit -p libs/shared/util-theme/tsconfig.lib.json` and every migrated lib.
- [ ] Lint: `nx run-many -t lint` for affected libs.
- [ ] Unit tests pass.
- [ ] Visual smoke (Web): `APP_LANG=eng nx serve alphaTiles` — sizes look identical to pre-change.
- [ ] Visual smoke: set `Font Scale=1.3` in a yue-style pack (or the yue pack itself) and verify all text scales up proportionally with no clipping in core screens (menu, china, chile, about, scorebar).
- [ ] `grep -rn "fontSize: [0-9]" libs/` returns only the documented `DoorSvg` exemption.
