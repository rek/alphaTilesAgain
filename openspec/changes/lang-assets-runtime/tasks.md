## 0. Preflight

- [x] 0.1 Read `AGENTS.md` and `openspec/AGENT_PROTOCOL.md`
- [x] 0.2 Read this change's `proposal.md` and `design.md` in full
- [x] 0.3 Read required upstream change design docs (see `design.md → ## Context`)
- [x] 0.4 Read required `docs/ARCHITECTURE.md` sections and referenced ADRs
- [x] 0.5 Open the source Java files named in `design.md → ## Context`; keep them in view during implementation
- [x] 0.6 Open the fixture files named in `design.md → ## Context`; verify pack content matches the assumptions the design makes
- [x] 0.7 Confirm upstream changes are merged (`openspec status --all`); do not start if an upstream is only in-progress
- [x] 0.8 Confirm `APP_LANG` and `PUBLIC_LANG_ASSETS` env vars are set for local runs
- [x] 0.9 Confirm `nx graph` shows the libs this change will touch don't already exist with conflicting tags

## 1. Library scaffolds

- [x] 1.1 Generate `libs/alphaTiles/data-language-pack` via `nx g @nx/js:lib data-language-pack --directory=libs/alphaTiles/data-language-pack --tags='type:data-access,scope:alphaTiles' --importPath=@alphaTiles/data-language-pack`
- [x] 1.2 Generate `libs/alphaTiles/data-language-assets` via `nx g @nx/react:lib data-language-assets --directory=libs/alphaTiles/data-language-assets --tags='type:data-access,scope:alphaTiles' --importPath=@alphaTiles/data-language-assets`
- [x] 1.3 Add production deps:
  - `data-language-pack` depends on `@alphaTiles/util-lang-pack-parser`, `@alphaTiles/util-precompute` (runtime), and `@generated/langManifest` (type-only)
  - `data-language-assets` depends on `@alphaTiles/data-language-pack`, `@alphaTiles/util-precompute`, `react`
- [x] 1.4 Confirm NX tags via `nx graph`; no `type:ui` or `type:feature` import in either lib

## 2. Path alias for `@generated/langManifest`

- [x] 2.1 Add `"@generated/langManifest": ["apps/alphaTiles/src/generated/langManifest.ts"]` to `tsconfig.base.json` `paths`
- [x] 2.2 Update Metro config (`apps/alphaTiles/metro.config.js`) to resolve the alias at runtime if needed (Metro reads tsconfig paths by default; confirm)
- [x] 2.3 Document in `docs/ARCHITECTURE.md` §5 that `@generated/*` is a build-artifact alias exempt from the usual "libs don't import from app" rule
- [x] 2.4 If ESLint `@nx/enforce-module-boundaries` objects, add an override or a `// eslint-disable-next-line` with a comment pointing to this design doc

## 3. `data-language-pack` — types

- [x] 3.1 `src/LangAssets.ts`:
  - [x] 3.1.1 Interface per `design.md §D1`: `code`, `langInfo`, `settings`, `tiles`, `words`, `syllables`, `keys`, `games`, `names`, `resources`, `colors`, `share`, `fonts`, `images`, `audio`, `precomputes`
  - [x] 3.1.2 Type fields inferred via `ReturnType<typeof parseX>` from parser imports
  - [x] 3.1.3 Export as named interface (not default export)
- [x] 3.2 `src/LangAssetsBindError.ts`:
  - [x] 3.2.1 `class LangAssetsBindError extends Error` with readonly `category: 'tile-audio' | 'word-audio' | 'syllable-audio' | 'instruction-audio' | 'tile-image' | 'word-image' | 'font' | 'avatar'`, `key`, `reason` fields
  - [x] 3.2.2 Constructor composes a human-readable `message` that includes the category, key, and a hint pointing at the validator

## 4. `data-language-pack` — internal resolvers

- [x] 4.1 `src/internal/resolveAudio.ts`:
  - [x] 4.1.1 Accept `(manifest: LangManifest, parsed: ParsedPack) => LangAssets['audio']`
  - [x] 4.1.2 Tiles: iterate `parsed.tiles.rows`; for each, look up `manifest.audio.tiles[tile.audioName]`; skip when `audioName === 'zz_no_audio_needed'`; throw `LangAssetsBindError` on other missing
  - [x] 4.1.3 Words: iterate `parsed.words.rows`; look up `manifest.audio.words[word.wordInLWC]`; throw on missing
  - [x] 4.1.4 Syllables: iterate `parsed.syllables.rows`; look up by syllable's `audioName`
  - [x] 4.1.5 Instructions: iterate `parsed.games.rows`; look up by game's `InstructionAudio`; skip the reserved `naWhileMPOnly` token
  - [x] 4.1.6 Return `Record<string, number>` maps keyed by domain identifier (tile.base, word.wordInLWC, syllable.syllable, game.InstructionAudio)
- [x] 4.2 `src/internal/resolveImages.ts`:
  - [x] 4.2.1 `icon`, `splash` — direct manifest pass-through
  - [x] 4.2.2 `avatars` — `manifest.images.avatars` verbatim (number[] of length 12)
  - [x] 4.2.3 `avataricons` — same
  - [x] 4.2.4 `tiles` — iterate `parsed.tiles.rows`; look up `manifest.images.tiles[tile.base]`; missing is silent (tile glyph images are optional per ARCHITECTURE.md §5)
  - [x] 4.2.5 `words` — iterate `parsed.words.rows`; look up `manifest.images.words[word.wordInLWC]`; throw on missing
  - [x] 4.2.6 `wordsAlt` — for each word, look up `manifest.images.words[word.wordInLWC + '2']`; missing is silent
- [x] 4.3 `src/internal/resolveFonts.ts`:
  - [x] 4.3.1 Pass through `manifest.fonts.primary` (required); throw on missing
  - [x] 4.3.2 `primaryBold` optional
- [x] 4.4 Unit tests per resolver using synthetic mock manifests

## 5. `data-language-pack` — entry point

- [x] 5.1 `src/loadLangPack.ts`:
  - [x] 5.1.1 Signature `loadLangPack(manifest: LangManifest): LangAssets`
  - [x] 5.1.2 Call `parsePack(manifest.rawFiles)` (throws on parse failure; not caught here)
  - [x] 5.1.3 Call `resolveAudio`, `resolveImages`, `resolveFonts`
  - [x] 5.1.4 Assemble `LangAssets` object (except `precomputes`)
  - [x] 5.1.5 Call `runPrecomputes(assets)` from `util-precompute`
  - [x] 5.1.6 Return final `{ ...assets, precomputes }`
- [x] 5.2 Unit tests:
  - [x] 5.2.1 Happy path: synthetic engEnglish4-like manifest → assets with spot-checked keys (`audio.tiles['a']`, `images.words['act']`, `settings.findBoolean('Has tile audio', false)` === true)
  - [x] 5.2.2 Missing audio handle → `LangAssetsBindError` with category `'tile-audio'` and key
  - [x] 5.2.3 Sentinel handling: tile with `audioName === 'zz_no_audio_needed'` → not in `assets.audio.tiles`, no throw
  - [x] 5.2.4 Parser failure propagates (doesn't catch)
  - [x] 5.2.5 Precompute registered → result present in `assets.precomputes`
- [x] 5.3 `src/index.ts` re-exports `loadLangPack`, `LangAssets` (type), `LangAssetsBindError`

## 6. `util-precompute` updates

- [x] 6.1 Replace `LangAssets = unknown` with `import type { LangAssets } from '@alphaTiles/data-language-pack'` in every file that references it
- [x] 6.2 `registerPrecompute<T>(key, fn: (assets: LangAssets) => T)`: now typed
- [x] 6.3 `runPrecomputes(assets: LangAssets): Map<string, unknown>`: signature unchanged except for parameter type
- [x] 6.4 Remove internal `PrecomputeProvider` (per `design.md §D7`). `usePrecompute<T>(key): T` now reads from `useLangAssets().precomputes.get(key)`
- [x] 6.5 Update `usePrecompute` to depend on `@alphaTiles/data-language-assets` for `useLangAssets`; update `util-precompute`'s deps in `project.json` accordingly
  - Note: this makes `util-precompute` depend on a `data-access` lib. If NX rules disallow this, either (a) move `usePrecompute` into `data-language-assets` and re-export from `util-precompute`, or (b) relax the rule for this hook. Default: move the hook.
- [x] 6.6 Update existing `util-precompute` tests to remove `PrecomputeProvider` references; add tests for typed `registerPrecompute` (compile-time: a test file uses `registerPrecompute<SomeShape>('x', assets => { ... })` and the callback's `assets` parameter has the narrow `LangAssets` type)
- [x] 6.7 Add note in `util-precompute/README.md` that the `LangAssets` forward reference is now real (cross-reference this change)

## 7. `data-language-assets` — provider and hook

- [x] 7.1 `src/ErrorScreen.tsx`:
  - [x] 7.1.1 Minimal React Native component: `<View>` + `<Text>`; accepts `error: Error` prop
  - [x] 7.1.2 Displays error name + message; format `LangPackParseError` / `LangAssetsBindError` specially (show category, key, line)
  - [x] 7.1.3 `accessibilityLiveRegion="assertive"` on root for screen-reader announcement
  - [x] 7.1.4 No styling beyond a plain white background and readable text; polish deferred
- [x] 7.2 `src/LangAssetsProvider.tsx`:
  - [x] 7.2.1 Creates `LangAssetsContext = createContext<LangAssets | null>(null)`
  - [x] 7.2.2 Calls `loadLangPack(langManifest)` inside `useMemo([])` wrapped in try/catch
  - [x] 7.2.3 On throw → render `<ErrorScreen error={err} />` and do not provide context
  - [x] 7.2.4 On success → `<LangAssetsContext.Provider value={assets}>{children}</>`
  - [x] 7.2.5 No `useEffect`, no `useState` with async setters (follows project rule)
- [x] 7.3 `src/useLangAssets.ts`:
  - [x] 7.3.1 `useContext(LangAssetsContext)` with null-check; throws `"useLangAssets must be used inside <LangAssetsProvider>"` on null
  - [x] 7.3.2 Returns typed `LangAssets`
- [x] 7.4 `src/index.ts` re-exports `LangAssetsProvider`, `useLangAssets`. Does not re-export `ErrorScreen` (internal).
- [ ] 7.5 Unit tests:
  - [ ] 7.5.1 Happy path: render provider with mocked manifest → `useLangAssets()` in a child returns assets
  - [ ] 7.5.2 Error path: mock `loadLangPack` to throw → `<ErrorScreen>` rendered
  - [ ] 7.5.3 `useLangAssets` called outside provider → throws

## 8. App integration

- [x] 8.1 Update `apps/alphaTiles/src/_layout.tsx`:
  - [x] 8.1.1 Import `LangAssetsProvider` from `@alphaTiles/data-language-assets`
  - [x] 8.1.2 Wrap existing `<Stack />` (or equivalent) in `<LangAssetsProvider>`
  - [x] 8.1.3 Preserve RTL setup above the provider (per `design.md §D6`)
- [ ] 8.2 Verify `APP_LANG=eng nx start alphaTiles` boots without errors
- [ ] 8.3 Verify iOS simulator + Android emulator startup (the empty-route render should show no crash, pack data loaded in the Context)
- [ ] 8.4 Dev test: `console.log(JSON.stringify(Object.keys(useLangAssets())))` in a temporary route to eyeball shape
- [ ] 8.5 Break-pack test: rename `languages/eng/aa_wordlist.txt` to `aa_wordlist_bad.txt` and re-run — expect `<ErrorScreen>` with a clear `MISSING_REQUIRED_FILE`-adjacent message

## 9. Documentation

- [ ] 9.1 `libs/alphaTiles/data-language-pack/README.md`: describe `loadLangPack`, link to this design doc, note that the function is synchronous-by-design
- [ ] 9.2 `libs/alphaTiles/data-language-assets/README.md`: describe the provider's mount position, `useLangAssets` usage, error-screen behavior
- [x] 9.3 Update `docs/ARCHITECTURE.md` §6 (runtime data flow) to reflect the real `LangAssetsProvider` (was a placeholder description)
- [x] 9.4 Cross-reference `util-precompute`'s README update — `LangAssets` is now real

## 10. Verification

- [x] 10.1 `openspec validate lang-assets-runtime` passes
- [x] 10.2 `nx test data-language-pack` passes
- [ ] 10.3 `nx test data-language-assets` passes
- [x] 10.4 `nx test util-precompute` passes (after the forward-ref upgrade)
- [ ] 10.5 `nx build alphaTiles` succeeds end-to-end for `APP_LANG=eng` and `APP_LANG=tpx`
- [x] 10.6 `nx lint` across both new libs passes; dependency rules respected
- [ ] 10.7 Break-pack test: validator-bypass path throws `LangAssetsBindError` (confirmed by deliberately deleting a manifest audio entry post-validation and observing the error screen)
- [ ] 10.8 Cold-boot timing (informational only): `console.time('loadLangPack')` around the `useMemo` — log <150ms on a mid-tier device
