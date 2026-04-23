## Context

Two responsibilities are bundled into this change because they're entangled: the theme system (colors, typography, spacing) is useless until fonts load, and font loading is an app-shell concern that a lib can't own alone. Splitting into two changes would mean either library A ships unusable without library B, or there's a circular reference between the theme lib and `apps/alphaTiles/src/_layout.tsx`.

The parse of `aa_colors.txt` into a `ColorPalette` lives in `lang-pack-parser` (separate change). This change consumes the parser's output and exposes it via `useTheme()`. The font manifest (`langManifest.fonts.primary`, `langManifest.fonts.primaryBold`) is emitted by `generate-lang-manifest.ts` (port-foundations). This change consumes that manifest via `expo-font.useFonts`.

ARCHITECTURE.md §16 mandates logical props for RTL safety. This change is where we codify that — both with the `marginStart` / `marginEnd` helpers (positive) and with the lint rule that blocks regressions (negative).

### Required reading for implementers

- `AGENTS.md` — entry doc; read first.
- `openspec/AGENT_PROTOCOL.md` — pickup protocol.
- `docs/ARCHITECTURE.md` §3 (library taxonomy — `ui-theme` is `type:ui, scope:shared`), §9 (theme + fonts), §16 (RTL + logical props).
- `docs/decisions/ADR-003-asset-bundling-via-generated-manifest.md` (for the manifest font handles).
- **Upstream OpenSpec changes (must be merged before starting):**
  - `lang-assets-runtime` — supplies `useLangAssets()` from which colors + fonts are read.
  - Transitively: `port-foundations` (font manifest entries), `lang-pack-parser` (`parseColors`).
  - Read `openspec/changes/lang-assets-runtime/design.md` and `openspec/changes/port-foundations/design.md` (font-manifest section).
- **Source Java files being ported** (absolute paths):
  - `../AlphaTiles/app/src/main/java/org/alphatilesapps/alphatiles/Start.java` — color index lookups, font bindings.
  - `../AlphaTiles/app/src/main/java/org/alphatilesapps/alphatiles/ColorList.java` — the Java color list whose integer keying we preserve.
  - `../AlphaTiles/app/src/main/res/values/styles.xml`, `res/values/colors.xml` — Android-side color usage; reference only.
- **Fixture paths** (absolute, under `../PublicLanguageAssets/`):
  - `../PublicLanguageAssets/engEnglish4/res/raw/aa_colors.txt` — 13-row palette reference.
  - `../PublicLanguageAssets/engEnglish4/res/font/andikanewbasic_r.ttf`, `andikanewbasic_b.ttf` — primary font files.
  - `../PublicLanguageAssets/tpxTeocuitlapa/res/font/*.ttf`, `res/raw/aa_colors.txt` — parity fixture.

## Goals / Non-Goals

**Goals:**

- One `useTheme()` call is the entry point to every style-level decision in every `type:ui` lib.
- Colors referenced by integer index (as the Android source does) — call site: `colors[tile.colorIndex]`.
- Typography scale is semantic (`md`, `lg`, `2xl`), not raw pixel-size — screens don't hand-tune sizes per-component.
- Fonts block rendering until loaded — no flash of unstyled text.
- Logical props are the default; raw `marginLeft` / `marginRight` are lint errors outside this lib.
- No dark mode, no user theme selection — source spec has neither.
- Theme shape is stable for v1 — adding a color palette entry is a pack change, not an app change.

**Non-Goals:**

- Dark mode. If demanded later, `useTheme()` grows a mode parameter; v1 doesn't speculate.
- User-selectable themes — not in the Android source.
- Animation / motion tokens — no animations in v1.
- RTL logic inside `useTheme` — the theme is direction-agnostic. RTL is an `I18nManager.forceRTL` concern (ARCHITECTURE.md §16) driven by `app.config.ts` (port-foundations).
- A Design Tokens (`.tokens.json`) build step — the scale is small enough to live as a TS constant.

## Decisions

### D1. Colors as an integer-indexed array

`aa_colors.txt` ships rows like `0\tthemePurple\t#9C27B0`. The integer `0` is the call-site key — `aa_gametiles.txt` column `colorIndex` stores `0`, `aa_games.txt` column `color` stores `0`. We mirror that:

```ts
type ColorPalette = readonly string[];  // ['#9C27B0', '#2196F3', ...]
```

Named access is a trap for packs that reorder or extend — `themePurple` might be index `0` in English but index `4` in a new pack. Integer access matches Android's runtime lookup and is schema-stable.

Named tokens (`primary`, `background`, `text`) are a separate, smaller concern — the first 5 palette entries are semantically theme colors (themePurple, themeBlue, themeOrange, themeGreen, themeRed) and the remaining are pack-specified game colors. We expose both:

```ts
type Theme = {
  palette: ColorPalette;              // full 13-entry array from pack
  colors: {
    primary: string;                  // palette[0]
    background: string;               // palette[0] (same — theme color)
    text: string;                     // '#000000' — hardcoded, not per-pack
    // ... other semantic slots derived from fixed palette indices
  };
  // ...
};
```

Semantic slots derive from fixed indices — `primary = palette[0]` is the convention. If a pack reorders, the theme still has a well-defined `primary`. Not all slots map to the palette (e.g. `text` is black across every pack; no point pretending it's per-pack).

Alternative: named color tokens as first-class, palette indices as a legacy concern. Rejected — Android source uses indices as the primary key, parity matters for porting correctness.

### D2. Typography scale

```ts
const typography = {
  xs:  { fontSize: 12, lineHeight: 16 },
  sm:  { fontSize: 14, lineHeight: 20 },
  md:  { fontSize: 16, lineHeight: 24 },
  lg:  { fontSize: 20, lineHeight: 28 },
  xl:  { fontSize: 28, lineHeight: 36 },
  '2xl': { fontSize: 40, lineHeight: 48 },
} as const;
```

Six sizes is enough for a game (title, body, button, caption, tile glyph, tile-glyph-huge). Values are pixel-density units (Expo handles PX→dp). Not a Tailwind clone — matching names for familiarity only.

Font families come from the pack:

```ts
fontFamily: {
  primary: langManifest.fonts.primary,       // the andikanewbasic_r equivalent
  primaryBold: langManifest.fonts.primaryBold, // or falls back to primary if pack omits bold
};
```

Call sites compose: `{ ...theme.typography.lg, fontFamily: theme.fontFamily.primaryBold }`. No helper sugar in v1 — the compose is one line.

### D3. Spacing scale in 4pt units

```ts
const spacing = { 0: 0, 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 8: 32, 10: 40, 12: 48, 16: 64 } as const;
```

Keys match the integer so `spacing[4]` = 16. Gaps (skipping `7`, `9`, `11`, `13–15`) are intentional — forces call sites into a small allowed set.

### D4. `useTheme()` as the exclusive consumer API

```ts
export function useTheme(): Theme { ... }
```

Reads from a `ThemeProvider` mounted inside `_layout.tsx` after the language pack is parsed. Every `type:ui` lib imports `useTheme`; no direct imports of `palette` / `typography` constants except inside `util-theme` itself.

Why force the hook? Because `palette` is per-pack and resolved at boot — a static import would be either stale or trigger a recompute. The hook guarantees consistency with the loaded pack.

Storybook stories bypass the hook (no pack) by wrapping in a `<MockThemeProvider>` that passes a static English-default theme. That mock lives in `util-theme`'s testing entry point.

### D5. Font loading in `_layout.tsx`, not in a lib

`expo-font.useFonts` is a React hook that MUST run inside the React tree, and it needs the `langManifest.fonts` object — which is a generated file in `apps/alphaTiles/src/generated/`. Two reasons the loader stays in the app shell, not in `util-theme`:

- `util-theme` is `scope:shared` — it must not import from `apps/`.
- The hook is effectively a boot gate; the app's root layout is the natural place for that gate.

We expose `useFontsReady(fontMap)` from `util-theme` as a trivial wrapper over `expo-font.useFonts` — just to keep the `expo-font` import discipline (only `util-theme` imports `expo-font`):

```ts
export function useFontsReady(fontMap: Record<string, FontSource>): boolean {
  const [loaded] = useFonts(fontMap);
  return loaded;
}
```

`_layout.tsx` owns the actual call with the generated manifest as input:

```tsx
const fontsReady = useFontsReady(langManifest.fonts);
if (!fontsReady) return null;  // or a thin boot splash
```

Alternative: put the loader in `data-language-assets`. Rejected — `data-language-assets` is `type:data-access`; hooks in `type:data-access` libraries that must run at the very top of the tree mean that lib is effectively the app shell, which violates the tag boundary.

### D6. Logical props enforced via lint rule + style helpers

ARCHITECTURE.md §16 mandates logical props. Enforcement is two-layer:

1. **Positive** — `util-theme` exports style helpers that use logical keys:
   ```ts
   export const style = {
     marginStart: (n: SpacingKey) => ({ marginStart: spacing[n] }),
     marginEnd: (n: SpacingKey) => ({ marginEnd: spacing[n] }),
     // same for padding
   };
   ```
   Call sites write `...style.marginStart(4)` instead of `marginLeft: 16`.

2. **Negative** — `eslint.config.js` gains a custom rule `no-raw-margin-left-right` that matches style-object literal keys. Allowlist: `util-theme` itself (the helpers must produce logical props, nothing to do with raw ones here, but we exempt the lib for flexibility).

The rule is a few lines of AST-walk — no package dependency. It looks for ObjectExpression properties with keys `marginLeft`, `marginRight`, `paddingLeft`, `paddingRight`, `left`, `right`, `borderLeftWidth`, `borderRightWidth`, etc. Full list documented in the rule file.

Composes poorly with third-party style constants, but v1 doesn't use any.

### D7. `useTheme` does not know about RTL

`useTheme` returns direction-agnostic tokens. RTL flipping is `I18nManager.forceRTL` (port-foundations), which makes logical props render right-to-left automatically. The theme library has no `isRTL` flag, no `flipForRTL` helper. Call sites don't think about direction — the runtime does.

If a ui component needs a directional asset (a chevron icon), it picks `ChevronStart` / `ChevronEnd` semantically — naming is the fix, not a theme switch.

### D8. No dark mode in v1

`useTheme` returns one theme. No mode parameter. If dark mode is ever demanded, the return shape grows a branch and `ThemeProvider` gains a prop. Speculating now means carrying unused branches for the life of v1.

### D9. ESLint rule surface

`eslint.config.js` gains three rules under a `theme-hygiene` configuration group:

1. `react-native/no-unused-styles` — flags unreachable StyleSheet entries (standard plugin).
2. `no-raw-margin-left-right` (custom) — bans physical-direction keys.
3. `theme-hygiene/hex-colors-in-theme-only` (custom, future-nice-to-have) — flags `#[0-9A-Fa-f]{3,8}` string literals outside `util-theme`. **Deferred to post-v1** — too noisy with SVG path fills and third-party style constants; revisit once we've seen real usage.

Only (1) and (2) are in scope for this change.

## Risks / Trade-offs

- **[Risk]** Custom ESLint rule has bugs; legitimate uses get flagged. **Mitigation**: unit-test the rule against a fixture of correct + incorrect cases; allow in-line disable with a clear justification comment. Escape hatch stays rare.
- **[Risk]** Pack omits `primaryBold` font → bold text renders in `primary`. **Mitigation**: `primaryBold` falls back to `primary` in the font map; bold styling then does nothing visible. Not a bug, a pack-authorial choice. Document the fallback.
- **[Risk]** `expo-font` loader flakes on web (asset not found at runtime). **Mitigation**: `expo-font` has a well-tested error path; `useFontsReady` surfaces the error via a second return. `_layout.tsx` can render a fallback. **Accepted**: rare, manually diagnosed if it happens.
- **[Trade-off]** Typography scale is fixed — a designer who wants a new size needs to add it here (fast) rather than one-offing in a component (blocked by lint). **Accepted**: the constraint is the point.
- **[Trade-off]** Semantic slots (`primary`, `background`) hardcode palette indices. If a pack's palette order diverges, those semantic mappings become meaningless. **Mitigation**: the palette's first 5 entries are "theme colors" by `aa_colors.txt` convention across every pack inspected. If that breaks, the `Theme.colors.*` slots are redefined — the `palette` array is still correct.
- **[Trade-off]** Logical-prop style helpers (`style.marginStart(4)`) add a tiny boilerplate compared to raw `marginLeft`. **Accepted**: the lint rule and the RTL correctness outweigh it.

## Open Questions

- Do we need a `useResponsiveTheme()` for tablet/phone size breakpoints? **Defer** — no source spec, Expo apps render the same on phone and tablet by default. Revisit if a feature lib needs it.
- Should `useTheme()` return a memoized reference that's stable across re-renders? **Yes** — implemented via `useMemo` inside `ThemeProvider`.
- A future `tools/validate-lang-pack.ts` (full validator) could assert `aa_colors.txt` has at least 5 theme-color entries. **Out of scope** for this change — track in `lang-pack-validator`.
- **`eslint-plugin-react-native` not installed.** Task 7.1 requires `react-native/no-unused-styles`. The plugin is not in `node_modules`. Decision needed: install it (adds a dep) or drop this rule from scope. It's a convenience rule only — the custom `no-raw-margin-left-right` rule is the critical RTL enforcement. **Recommendation**: install `eslint-plugin-react-native` and add the rule in a follow-up; not blocking for this change.
- **`apps/alphaTiles/app/index.tsx` has a pre-existing `import/namespace` parse error** for `react-native` (eslint-config-expo parser issue). Not introduced by this change. Needs investigation in the expo eslint config.
