# game-taiwan — implementation complete (web), pending native QA + PM sign-off

Last touched: 2026-05-03. Web smoke green. Native sim QA + perf spike + legal sign-off remain.

## Done

- §0 spike: `apps/alphaTiles/app/spike-taiwan.tsx` deleted after web smoke (puppeteer harness at `/tmp/pup/`).
- §1 lib scaffold (`feature-game-taiwan`): project.json, tsconfigs, jest config, mocks, src skeleton, route at `apps/alphaTiles/app/games/taiwan.tsx`, storybook-host registered, alias added.
- §2 lib scaffold (`data-stroke-data`): nx tags `type:data-access` `scope:alphaTiles`, `useStrokes()` hook re-reads `useLangAssets().strokes`, 3 unit tests pass.
- §3 prebuild (`tools/build-stroke-data.ts`): CDN-fetch + cache pattern (deviation from spec D3, documented). Yue covered=86 / total=87 (1 missing: `嫲`). Eng skips silently. NOTICE.md added at `apps/alphaTiles/NOTICE.md`.
- §4 parser/validator/manifest: `LangAssets` adds `strokes: Record<string, StrokeData>`. `loadLangPack` defaults to `{}`. `generate-lang-manifest.ts` inlines per-char JSON into the manifest. `validate-lang-pack` adds `checkStrokeData` (coverage warnings + shape errors) — 5 unit tests pass; full validator suite 58/58.
- §5 pure logic + precompute: `pickTaiwanCharacters` (Fisher-Yates, deterministic with injected rng) + `buildTaiwanData` (decompose compounds, filter to chars with strokes, first-compound-wins audio fallback). 9 unit tests pass. Eager-registered alongside other precomputes in `apps/alphaTiles/app/registerPrecomputes.ts`.
- §6 presenter (`TaiwanScreen.tsx`): pure props→JSX. Compositional `<HanziWriter.Outline>` / `<HanziWriter.Character>` gated by `outlineVisible` / `characterVisible` props (NOT lib props — they don't exist in 1.2.0). Storybook stories for CL1/CL2/CL3 via `StoryHost` wrapper that calls `useHanziWriter`.
- §7 container — split into `TaiwanContainer.tsx` (route boundary, lazy-imports `TaiwanInner` inside `useEffect`) and `TaiwanInner.tsx` (hooks + state). CL→`{ outlineVisible, characterVisible, leniency }` table inline. Round state (`currentCharIndex`, `mistakeCountRef`, `roundChars` memoised). `quiz.start` auto-fires when `writer.characterClass` flips non-null, with started-tracking ref guard. `onComplete` pays out by stroke count (`shell.incrementPointsAndTracker(true, strokeCount)`), plays compound-fallback audio, advances `currentCharIndex`. `onMistake` increments analytics ref; the 3-mistake hint is configured via `showHintAfterMisses: 3` and rendered automatically by upstream `<QuizMistakeHighlighter>` (no imperative hook).
- §8 menu gating: `useDoors` gains an `isGameEnabled(classKey)` predicate. `useDoors` hook computes `taiwanEnabled` from `Object.keys(assets.strokes).length >= 5` AND `aa_settings.txt § "Enable stroke order game"` not set to false/no/0. Yue `aa_games.txt` updated with 3 Taiwan rows (door 6/7/8, CL 1/2/3).
- §9 verification: typecheck clean (only pre-existing `GameShellIcons` index-signature errors). Tests green: `feature-game-taiwan` 9/9, `data-stroke-data` 3/3, `util-lang-pack-validator` 58/58. Web smoke (puppeteer at `/tmp/pup/taiwan-test.mjs`) — all 3 CL routes load with 0 page errors, 0 console errors, 2 SVGs + 17–21 paths rendered, "Character 1 of 5" progress label visible.
- §11.1–11.2 docs: GAME_PATTERNS.md gets new sections — "OSS-wrap discipline (from game-taiwan)", "Web SSR + worklet libs need a client-only mount boundary", "Auto-start the quiz/animation when the upstream signals readiness", and CL row added to the decoding table.

## Critical lesson — web SSR + worklets TDZ

`expo-router` `web.output: 'static'` prerenders every route in Node. Libraries that depend on `react-native-reanimated` v4 worklets (via `react-native-worklets`) cannot run under Node SSR — TDZ on `getPathString`. Fix: dynamic-import the lib inside `useEffect` at the route boundary. SSR pass renders `<ActivityIndicator />`; browser pass loads the lib post-mount.

`babel-preset-expo` 55+ already auto-adds `react-native-worklets/plugin`. Do NOT list it manually in `babel.config.js` (double-transform → same TDZ).

## Deviations from spec / design (worth flagging in review)

- **D3 fetch strategy**: prebuild uses CDN + cache rather than vendoring the full ~30MB MMH `graphics.txt`. Functionally equivalent. Cache lives at `tools/data/stroke-cache/*.json` (gitignored). Documented in design.md D3.
- **Open Q #6 stage gating**: NOT stage-filtered in v1. `availableTiles` is the full set of pack hanzi with stroke data, regardless of player progress. Deferred to v1.1.
- **Container/presenter split**: keeps the upstream lib `mod` resolution inside the container layer (`TaiwanContainer.tsx`). The presenter (`TaiwanScreen.tsx`) is statically imported by `TaiwanInner.tsx` (which is itself dynamically imported by `TaiwanContainer.tsx`), so the SSR pass never evaluates the worklet code path.
- **Audio fallback**: per-character audio doesn't exist in yue pack; `buildTaiwanData.audioForChar[char]` maps to the LWC key (string) of the FIRST compound containing that character. Container calls `useAudio.playWord(audioForChar[char])`.

## Pre-existing repo state (unrelated to this change)

Pre-existing TS errors not in scope of game-taiwan:
- `apps/alphaTiles/app/games/{china,colombia,georgia,malaysia,myanmar,peru,taiwan,...}.tsx` — `GameShellIcons` not assignable to `useLocalSearchParams` index signature. Same line, same pattern across all game routes. Cleanup pass should fix at the route-template level.
- `apps/alphaTiles/app/registerPrecomputes.ts:28` — `(assets) => buildSudanData(assets, 7)` infers `assets: unknown`.
- `libs/alphaTiles/feature-game-shell/src/lib/GameShellContainer.tsx:240` — pathname `"/game"` not assignable to `"/games/[classKey]"`.
- `libs/alphaTiles/feature-game-menu/src/GameMenuContainer.tsx:39` — screen-name arg mismatch.

## Remaining work for archive

- §9.6 Native Android emu QA
- §9.7 Native iOS sim QA
- §9.8 Bundle-size delta measurement
- §9.9 Low-end device perf spike
- §10.3 Legal LGPL sign-off
- §10.4 PM device-target list confirmation
- §11.3 GitHub issue #13 update comment
- §12 PM sign-off on shipped defaults (round goal=5, mistake threshold=3, no stage gating)

After native QA + sign-offs: `openspec archive game-taiwan`.
