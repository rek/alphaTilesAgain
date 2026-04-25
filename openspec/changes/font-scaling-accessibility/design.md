## Context

No Java analog. Legacy Android sized text via XML and runtime scaling; this change defines a TS-native equivalent driven from the language pack settings file.

The 6-slot ladder (xs, sm, md, lg, xl, 2xl) is preserved — scale shifts the whole ladder proportionally. This avoids per-component scale overrides and keeps `theme.typography` the single source of truth.

### Required reading for implementers

- `AGENTS.md`
- `openspec/AGENT_PROTOCOL.md`
- `docs/ARCHITECTURE.md` §7 (theming), §11 (container/presenter)
- `docs/CODE_STYLE.md`
- `libs/shared/util-theme/src/lib/typography.ts` — current 6-slot definition
- `libs/shared/util-theme/src/lib/buildTheme.ts` — current signature
- `libs/shared/util-langassets/src/lib/LangAssetsProvider.tsx` — settings read site
- `libs/shared/ui-doors/src/lib/DoorSvg.tsx` — geometry exemption

## Goals / Non-Goals

**Goals:**
- One scale factor per lang pack, applied to all 6 slots.
- All non-geometry components consume `theme.typography`.
- Default behavior unchanged for packs omitting `"Font Scale"`.
- Migration is mechanical — no design reinterpretation per call site.

**Non-Goals:**
- Per-slot or per-component overrides.
- Runtime mutation of scale.
- Restructuring the typography ladder.
- Touching `DoorSvg` geometry.

## Decisions

### D1. State / data flow

- `LangAssetsProvider` parses `settings.find("Font Scale")`:
  ```ts
  const raw = settings.find('Font Scale');
  const parsed = raw ? Number(raw) : 1.0;
  const fontScale = Number.isFinite(parsed) ? Math.max(0.5, Math.min(2.5, parsed)) : 1.0;
  ```
- Passes `fontScale` to `buildTheme(palette, fontMap, fontScale)`.
- `buildTheme` calls `buildTypography(fontScale)` and stores result on `theme.typography`.
- All consumers read via `useTheme().typography.<slot>`.

### D2. `buildTypography(fontScale)`

```ts
const BASE = {
  xs: { fontSize: 12, lineHeight: 16 },
  sm: { fontSize: 14, lineHeight: 20 },
  md: { fontSize: 16, lineHeight: 24 },
  lg: { fontSize: 20, lineHeight: 28 },
  xl: { fontSize: 28, lineHeight: 36 },
  '2xl': { fontSize: 40, lineHeight: 48 },
} as const;

export function buildTypography(fontScale: number) {
  return {
    xs: { fontSize: BASE.xs.fontSize * fontScale, lineHeight: BASE.xs.lineHeight * fontScale },
    sm: { fontSize: BASE.sm.fontSize * fontScale, lineHeight: BASE.sm.lineHeight * fontScale },
    md: { fontSize: BASE.md.fontSize * fontScale, lineHeight: BASE.md.lineHeight * fontScale },
    lg: { fontSize: BASE.lg.fontSize * fontScale, lineHeight: BASE.lg.lineHeight * fontScale },
    xl: { fontSize: BASE.xl.fontSize * fontScale, lineHeight: BASE.xl.lineHeight * fontScale },
    '2xl': { fontSize: BASE['2xl'].fontSize * fontScale, lineHeight: BASE['2xl'].lineHeight * fontScale },
  };
}
```

The shape (`Theme['typography']`) is identical — just numerically scaled. No call sites need to change keys, only their access path.

### D3. `buildTheme` signature

```ts
export function buildTheme(
  palette: readonly string[],
  fontMap: { primary: string; primaryBold?: string },
  fontScale: number = 1.0,
): Theme {
  return {
    palette,
    colors: deriveColors(palette),
    typography: buildTypography(fontScale),
    spacing: SPACING,
    fontFamily: { primary: fontMap.primary, primaryBold: fontMap.primaryBold ?? fontMap.primary },
  };
}
```

Default `1.0` means existing call sites that pass two args still compile and produce today's sizes.

### D4. Component migration mapping

| Source range | Slot |
|---|---|
| `fontSize ≤ 12` | `theme.typography.xs.fontSize` |
| `fontSize 13–15` | `theme.typography.sm.fontSize` |
| `fontSize 16–18` | `theme.typography.md.fontSize` |
| `fontSize 19–22` | `theme.typography.lg.fontSize` |
| `fontSize 23–32` | `theme.typography.xl.fontSize` |
| `fontSize ≥ 33` | `theme.typography['2xl'].fontSize` |

`lineHeight` follows the same slot.

### D5. Files in migration scope (from prompt)

```
Tile.tsx                  — fontSize 28
UiCustomKeyboard.tsx      — fontSize 18, 20
UiDoorGrid.tsx            — fontSize 24, 16
ScoreBar.tsx              — fontSize 16, 10
UiPlayerCard.tsx          — fontSize 14, 13
ChinaScreen.tsx           — fontSize 11, 22
ChileScreen.tsx           — fontSize 18, 22, 14
AboutScreen.tsx           — fontSize 24, 22, 16, 14
Celebration.tsx           — fontSize 18
```

Implementers SHALL grep for any remaining `fontSize:` in `libs/` after the listed files are migrated and migrate any additional matches except `DoorSvg.tsx`. Total expected: ~30 sites.

### D6. DoorSvg exemption

`DoorSvg.tsx` computes `fontSize = width * 0.35` to scale text inside a fixed-aspect SVG door. This is geometry, not typography — leave as-is. Add a one-line comment marking the exemption so future grep-based audits don't flag it.

### D7. Component access pattern

Each migrated component imports `useTheme` once near the top and reads slots inline:

```ts
const theme = useTheme();
// ...
<Text style={{ fontSize: theme.typography.lg.fontSize, lineHeight: theme.typography.lg.lineHeight }}>
```

For `StyleSheet.create` consumers, lift the style construction into the component body or use inline `style={[{...}, sheet.x]}`. Do not add a `useThemeStyles` abstraction in this change.

### D8. No backwards-compat shim

`typography.ts` previously exported a frozen `typography` constant. After this change it exports `buildTypography(fontScale)`. Any direct importers (likely zero outside `buildTheme`) must update. No re-export shim.

## Unresolved Questions

- Clamp range `[0.5, 2.5]` — confirm with design before merge.
- Per-pack visual QA: should the verification step include a screenshot diff for at least one pack with `fontScale=1.3` (yue)? Default: manual smoke; automate later if regressions appear.
