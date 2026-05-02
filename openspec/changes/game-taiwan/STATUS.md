# game-taiwan — in-progress status

Last touched: 2026-05-02. Resume from §0 spike runtime check.

## Done

- §0.5 peer deps verified (`react-native-svg 15.12.1`, `react-native-reanimated 4.1.1`, `react-native-gesture-handler 2.28.0`, `react-native-worklets 0.5.1`) — all peer-dep ranges of `@jamsch/react-native-hanzi-writer 1.2.0` satisfied
- §0.6 `'taiwan'` precompute key confirmed unused (registry: `apps/alphaTiles/app/registerPrecomputes.ts`)
- §0.7 spike scaffold:
  - `bun add @jamsch/react-native-hanzi-writer` → pinned `1.2.0` in `apps/alphaTiles/package.json` (no caret per §10.2)
  - spike route written at `apps/alphaTiles/app/spike-taiwan.tsx` — wraps `<GestureHandlerRootView>`, uses CDN loader (`hanzi-writer-data@2.0` jsdelivr), renders `醫`, exposes Start Quiz + Animate buttons
  - typechecks clean against `apps/alphaTiles/tsconfig.app.json`

## Not done

- §0.1–0.4 docs/specs reading (`docs/GAME_PATTERNS.md`, `docs/ARCHITECTURE.md §5–6`, GH issue #13, `specs/*.md`)
- §0.7 runtime verify — needs interactive run on web + Android emu + iOS sim. Smoke criteria:
  1. CDN fetch loads → `醫` outline + filled char render
  2. Animate button plays stroke-by-stroke
  3. Start Quiz → drag stroke → after 2 misses hint highlights
  4. Console logs `mistake` / `complete`
- §1+ everything

## Watch-outs surfaced during spike prep

- Lib keywords list `ios, android` only — no web claim. Gestures via `react-native-gesture-handler` on `react-native-web` may not register cleanly. If web spike fails, fall through to Android first.
- `<GestureHandlerRootView>` is required (per README). App's `_layout.tsx` does NOT wrap one. For real impl, add wrapper either at `_layout.tsx` (global) or inside `TaiwanContainer` (local — preferred, avoids touching shared layout).

## tasks.md corrections to apply before §6/§7 impl

- §6.2 — `showOutline` / `showCharacter` are NOT props. Compositional children: render or omit `<HanziWriter.Outline />` and `<HanziWriter.Character />`. CL→config mapping needs rework.
- §7.4 — no `writer.highlightStroke(strokeNum)` method. Hint logic is `quiz.start({ showHintAfterMisses: N })` + `<HanziWriter.QuizMistakeHighlighter />` rendered inside `<HanziWriter.Svg>`. The mistake threshold is configured at quiz-start, not invoked imperatively.

## Pre-existing repo state (unrelated to this change)

5 TS errors in unrelated files surfaced by `tsc --noEmit --project apps/alphaTiles/tsconfig.app.json`:

- `apps/alphaTiles/app/games/peru.tsx:14` — `GameShellIcons` not assignable to route params index signature (same pattern in colombia, others suspected)
- `apps/alphaTiles/app/registerPrecomputes.ts:27` — `(assets) => buildSudanData(assets, 7)` infers `assets: unknown`
- `libs/alphaTiles/feature-game-shell/src/lib/GameShellContainer.tsx:240` — pathname `"/game"` not assignable to `"/games/[classKey]"`
- `libs/alphaTiles/feature-game-menu/src/GameMenuContainer.tsx:39` — screen-name arg mismatch

Worth a separate cleanup pass; do NOT fold into game-taiwan.

## Resume checklist

1. `bun nx serve alphaTiles` (or `run-android`), navigate to `/spike-taiwan`, run smoke criteria above
2. If green → delete `apps/alphaTiles/app/spike-taiwan.tsx`, mark §0.7 done, proceed to §1
3. If web fails but mobile passes → note web limitation in design.md §Risks, mark §0.7 done
4. If mobile fails → diagnose; plan changes (could be peer-dep mismatch despite version range, native-build issue, or API regression in 1.2.0)
5. Patch tasks.md §6.2 + §7.4 per corrections above before starting §6/§7
