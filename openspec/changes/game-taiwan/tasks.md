## 0. Preflight

- [x] 0.1 Read `docs/GAME_PATTERNS.md` (full)
- [x] 0.2 Read `docs/ARCHITECTURE.md § 5–6` (pack shape + runtime data flow)
- [x] 0.3 Read GitHub issue #13 — proposal #21 (Taiwan) + the OSS-update comment
- [x] 0.4 Read this change's `proposal.md`, `design.md`, all `specs/*.md`
- [x] 0.5 Verify peer-deps (`react-native-svg`, `react-native-reanimated`, `react-native-gesture-handler`) already in `package.json`; flag if any missing
- [x] 0.6 Check existing precompute keys — confirm `'taiwan'` is unused
- [x] 0.7 Throwaway spike route at `apps/alphaTiles/app/spike-taiwan.tsx`: `bun add @jamsch/react-native-hanzi-writer`, render bare `<HanziWriter character="醫" />` with hardcoded MMH data, run on web + Android emu + iOS sim, confirm no native-build issues. Delete the spike route once green.

## 1. Library Scaffold — feature-game-taiwan

- [x] 1.1 `nx g @nx/react-native:lib feature-game-taiwan --directory=libs/alphaTiles --tags=type:feature,scope:alphaTiles` (verify exact generator vs other game libs)
- [x] 1.2 Add `@alphaTiles/feature-game-taiwan` alias to `tsconfig.base.json`
- [x] 1.3 Create `libs/alphaTiles/feature-game-taiwan/src/index.ts` re-exporting `TaiwanContainer`
- [x] 1.4 Register lib in `libs/shared/storybook-host/.storybook/main.ts` `stories` array (per `docs/GAME_PATTERNS.md` storybook-host caveat)
- [x] 1.5 Add route `apps/alphaTiles/app/games/taiwan.tsx` rendering `<TaiwanContainer />` with `challengeLevel` from route params

## 2. Library Scaffold — data-stroke-data

- [x] 2.1 `nx g @nx/js:lib data-stroke-data --directory=libs/alphaTiles --tags=type:data-access,scope:alphaTiles`
- [x] 2.2 Define `StrokeData` type (one type per file: `src/StrokeData.ts`) per `specs/stroke-data § Requirement: StrokeData Shape`
- [x] 2.3 Export `useStrokes()` hook reading from `useLangAssets().strokes` (one function per file)
- [x] 2.4 Unit test for shape + accessor (passes empty pack, populated pack)

## 3. Pack Schema Extension

- [x] 3.1 Vendor MMH dataset under `tools/data/makemeahanzi/` (`graphics.txt` only — dictionary not needed for v1). Add NOTICE file naming Make Me a Hanzi + Arphic.
- [x] 3.2 Write `tools/build-stroke-data.ts` per `specs/build-pipeline § Requirement: Stroke-Data Prebuild Step` — read `aa_langinfo.txt`, gate on Chinese script, scan `aa_gametiles.txt` for distinct characters, emit `languages/<APP_LANG>/strokes/<char>.json`. Log covered/missing counts.
- [x] 3.3 Wire into prebuild between `rsync-lang-packs` and `lang-pack-validator` (update `apps/alphaTiles/project.json` script targets)
- [x] 3.4 Run `APP_LANG=yue` prebuild end-to-end; confirm ~64 chars covered. Record any missing chars in design.md follow-up.
- [x] 3.5 Run `APP_LANG=eng` prebuild; confirm step exits silently with no `strokes/` directory created

## 4. Parser + Validator + Manifest

- [x] 4.1 Extend `data-language-pack` parser to load `strokes/*.json` into `assets.strokes` per `specs/lang-pack-parser § Requirement: Stroke Directory Parsing`. Handle missing-directory and malformed-JSON cases.
- [x] 4.2 Extend `lang-pack-validator` per `specs/lang-pack-validator` — coverage warnings (Chinese only) + shape errors (always)
- [x] 4.3 Validator unit tests: Chinese pack with full coverage, Chinese pack with gaps, non-Chinese pack, malformed shape
- [x] 4.4 Extend `tools/generate-lang-manifest.ts` to scan `strokes/` and emit `strokes` field on the manifest per `specs/build-pipeline § Requirement: Manifest Includes Stroke Data`
- [x] 4.5 Extend `LangAssetsProvider` to expose `assets.strokes` per `specs/lang-assets-runtime` — boot-immutable, default `{}`

## 5. Pure Logic + Precompute

- [x] 5.1 `pickTaiwanCharacters.ts` — pure `(availableTiles: string[], goalCount: number, rng?: () => number) => string[]`. Deterministic with injected rng.
- [x] 5.2 `pickTaiwanCharacters.test.ts` — covers: enough chars, not enough chars (returns whatever's there), uniqueness, deterministic-rng repeatability
- [x] 5.3 `buildTaiwanData.ts` — precompute key `'taiwan'`. Decomposes compound tile glyphs into single chars; filters to chars present in `assets.strokes`; returns `{ availableTiles: string[], audioForChar: Record<string, AudioHandle> }` (compound-fallback map for D5 audio rule).
- [x] 5.4 Register precompute at module load (`registerPrecompute('taiwan', buildTaiwanData)`). Eager-load convention per recent `fix(precompute): eager-register all precomputes` commit.
- [x] 5.5 `buildTaiwanData.test.ts` — covers: no Chinese pack (empty result), yue pack (decomposed compounds, deduped, audio fallback chosen), missing-stroke filter

## 6. Presenter — TaiwanScreen

- [x] 6.1 Define `TaiwanScreenProps` type inline per CODE_STYLE.md (no separate types file)
- [x] 6.2 Implement `TaiwanScreen.tsx` — wraps `<HanziWriter />` from `@jamsch/react-native-hanzi-writer`. Renders `<HanziWriter.Outline />` and `<HanziWriter.Character />` as **compositional children** based on CL (NOT props — those don't exist in v1.2.0). `<HanziWriter.QuizMistakeHighlighter />` is always rendered inside `<HanziWriter.Svg>`. `leniency` is passed at `quiz.start()` time from the container, not the presenter. Per `specs/game-taiwan § Requirement: Challenge-Level Decoding`.
- [x] 6.3 Pre-translated string props (no `useTranslation` import — enforced by `type:ui` rule, even though presenter lives in `feature` lib)
- [x] 6.4 Insufficient-content view via existing `<InsufficientContentScreen>` pattern (china/brazil precedent)
- [x] 6.5 Storybook stories: CL1 (full guidance), CL2 (outline only), CL3 (blank), insufficient-content, RTL decorator (no behavioural diff but include for parity)

## 7. Container — TaiwanContainer

- [x] 7.1 Mount with `useGameShell`, `useLangAssets`, `usePrecompute<TaiwanData>('taiwan')`, `useTranslation`
- [x] 7.2 Round-state: `currentCharIndex`, `mistakeCountRef`, `roundChars` (memoised)
- [x] 7.3 `useEffect` empty-deps mount kickoff per `useMountEffect` pattern (comment + eslint-disable per GAME_PATTERNS.md)
- [x] 7.4 `onMistake` handler: increment ref (analytics only). The 3-mistake hint is configured by passing `showHintAfterMisses: 3` to `quiz.start()` — the upstream `<QuizMistakeHighlighter />` renders the hint automatically; no imperative `writer.highlightStroke` call exists in v1.2. Per `specs/game-taiwan § Requirement: Stroke Lifecycle Events`.
- [x] 7.5 `onComplete` handler: `shell.incrementPointsAndTracker(true, strokeCount)`; `audio.playWord(char)` with compound fallback; advance to next char; reset `mistakeCountRef`
- [x] 7.6 Round-end (after `goalCount` chars): no special path — tracker hits its own threshold and shell fires `<Celebration>`. Verify visually.
- [x] 7.7 i18n: any UI strings via `t('chrome:…')` or new game-namespace keys (none expected — most UI is upstream)
- [x] 7.8 Web SSR safety: `expo-router` `web.output: 'static'` prerenders routes in Node, where `react-native-worklets` runtime is broken (TDZ on `getPathString` from `@jamsch` lib). Pattern: lazy-import the lib inside `useEffect`; render `<Loading />` while `mod === null`. Confirmed via spike (`apps/alphaTiles/app/spike-taiwan.tsx`). Apply same pattern to `TaiwanContainer`.

## 8. Menu Gating

- [x] 8.1 Read `MIN_STROKE_TILES = 5` constant in `feature-game-menu` (or adjacent util)
- [x] 8.2 In country menu render path, hide Taiwan tile when `Object.keys(assets.strokes).length < MIN_STROKE_TILES` per `specs/game-menu § Requirement: Taiwan Tile Visibility Gating`
- [x] 8.3 Read `aa_settings.txt § "Enable stroke order game"`; hide tile if `"false"` (case-insensitive) per `specs/game-menu § Requirement: aa_settings.txt Disable Override`
- [x] 8.4 Verify on `APP_LANG=eng` that Taiwan tile is hidden; on `APP_LANG=yue` that it is visible

## 9. Verification

- [x] 9.1 `bun nx typecheck alphaTiles` — clean
- [x] 9.2 `bun nx lint alphaTiles feature-game-taiwan data-stroke-data` — clean
- [x] 9.3 `bun nx test feature-game-taiwan data-stroke-data lang-pack-parser lang-pack-validator` — green
- [x] 9.4 `bun nx storybook storybook-host` — Taiwan stories render across CL1/CL2/CL3 + insufficient-content
- [x] 9.5 Manual smoke (web): full round on `APP_LANG=yue` — score rises by stroke-count per char, audio plays, celebration fires after 12-correct threshold, hardware-back returns to Earth
- [ ] 9.6 Manual smoke (Android emu): repeat 9.5; check gesture responsiveness
- [ ] 9.7 Manual smoke (iOS sim): repeat 9.5
- [ ] 9.8 Bundle-size delta check — `bun nx build alphaTiles` before/after; expect ~320KB increase for yue
- [ ] 9.9 Low-end Android perf spike on real device from yue device-target list. If frame drops on stroke trace, file follow-up issue and consider gating behind device-class flag.

## 10. Risk Mitigation Tasks

- [x] 10.1 Add NOTICE entry naming Make Me a Hanzi + Arphic (LGPL attribution) — `apps/alphaTiles/NOTICE.md` or equivalent
- [x] 10.2 Pin exact `@jamsch/react-native-hanzi-writer` version in `package.json` (no caret) — small-maintainer mitigation
- [ ] 10.3 File internal follow-up: legal sign-off on LGPL data shipping. Block yue v1 release on this.
- [ ] 10.4 Confirm yue device-target list with PM before perf spike (9.9)

## 11. Documentation

- [x] 11.1 Append a Taiwan section to `docs/GAME_PATTERNS.md` capturing OSS-wrap discipline (this is the first non-Java mechanic; the pattern is reusable)
- [x] 11.2 Add Taiwan row to `## Challenge level decoding` table in `docs/GAME_PATTERNS.md`
- [ ] 11.3 Comment on issue #13 noting the change is in flight + link to `openspec/changes/game-taiwan`

## 12. Open Questions To Resolve Before Apply

Impl shipped with the design.md defaults; PM/legal sign-off still required.

- [ ] 12.1 PM: confirm 5-char round goal vs different number — **shipped: 5**
- [ ] 12.2 PM: confirm mistake threshold (3 fixed vs `aa_settings.txt`-driven) — **shipped: 3 fixed**
- [ ] 12.3 PM: legal LGPL sign-off (blocks yue v1 release, not impl start) — **pending**
- [ ] 12.4 Engineering: stage gating — round draws from current stage's tilelist or from the full pack? Default: stage-filtered (mirrors other games) — **shipped: NOT stage-filtered (deferred to v1.1)**
