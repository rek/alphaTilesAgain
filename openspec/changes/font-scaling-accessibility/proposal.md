## Why

Some scripts (Cantonese yue, complex CJK, Burmese) need larger glyphs than the default 6-slot typography ladder provides for legibility on small screens. Two problems block that:

1. There is no global font-scale knob — sizes are baked into `typography.ts`.
2. ~30 components hardcode `fontSize` values inline instead of consuming `theme.typography`, so any global scale would only partially apply.

This change adds a per-lang-pack scale factor and migrates every non-geometry hardcoded `fontSize` to a theme slot.

## What Changes

- `aa_settings.txt` gains an optional `"Font Scale"` key (default `"1.0"` when absent).
- `libs/shared/util-theme/src/lib/typography.ts` becomes a function `buildTypography(fontScale: number)` returning the same 6-slot shape; each slot's `fontSize` and `lineHeight` are multiplied by `fontScale`.
- `buildTheme(palette, fontMap)` becomes `buildTheme(palette, fontMap, fontScale = 1.0)`.
- `LangAssetsProvider` reads `settings.find("Font Scale")`, parses to number (default `1.0` on absent or NaN), passes to `buildTheme`.
- Migrate ~30 components from hardcoded `fontSize` to `theme.typography.<slot>.fontSize` and `lineHeight` per the slot mapping below. `useTheme()` is the access path (already exists).
- Mapping:
  - `≤12` → `xs`
  - `13–15` → `sm`
  - `16–18` → `md`
  - `19–22` → `lg`
  - `23–32` → `xl`
  - `≥33` → `2xl`
- Exempt: `DoorSvg.tsx`'s `width * 0.35` — geometry-based, not typography. Document the exemption in code with a one-line comment.

## Capabilities

### New Capabilities

- `font-scaling-accessibility` — config-driven proportional font scale applied to the typography ladder.

### Modified Capabilities

- `util-theme` — `buildTheme` gains optional `fontScale` parameter; `typography.ts` becomes `buildTypography(fontScale)`.
- ~30 UI components — replace hardcoded `fontSize` with `theme.typography.*` lookups.
- `LangAssetsProvider` — reads `Font Scale` setting and passes to `buildTheme`.

## Impact

- Single optional setting key; default behavior unchanged for packs that omit it.
- No persistence, no UI, no user-facing toggle.
- Migration touches roughly 30 files, all leaf components — no architectural change.
- Existing snapshot/visual tests in Storybook may shift if a pack is configured with a non-1.0 scale; default builds remain pixel-stable.
- No breaking API for `buildTheme` callers (third arg is optional with default 1.0).

## Out of Scope

- A user-facing slider or accessibility settings screen.
- Per-component scale overrides.
- Reactive runtime scale changes (scale is fixed at theme build time per language pack).
- Reflowing `DoorSvg` text beyond its current `width * 0.35` geometry rule.
- Adding new typography slots or changing the slot ladder semantics.

## Unresolved Questions

- A few hardcoded values lie on slot boundaries (e.g. 12 → xs; 22 → lg). The mapping is inclusive at lower edge per the spec; double-check the few near-boundary uses produce no perceivable jump.
- Should `fontScale` clamp to a sane range (e.g. 0.5–2.0) to prevent broken layouts from a typo in a lang pack? Default: clamp to `[0.5, 2.5]`, but call out as a follow-up if not desired.
