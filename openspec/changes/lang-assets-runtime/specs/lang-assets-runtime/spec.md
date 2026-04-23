## ADDED Requirements

### Requirement: Synchronous language-pack boot

The runtime SHALL expose a single synchronous function `loadLangPack(manifest: LangManifest): LangAssets` that fully materializes the pack from the bundled manifest in one call. Materialization includes: calling `parsePack(manifest.rawFiles)`, binding manifest asset `require()` numbers to domain-keyed maps, and running every registered precompute. The function MUST NOT use `async`, Promises, or `useEffect`.

#### Scenario: Happy-path synchronous boot

- **WHEN** `loadLangPack(manifest)` is called with a complete, valid engEnglish4-shaped manifest
- **THEN** the returned `LangAssets` has `code === 'eng'`, `tiles.rows.length === 39`, `audio.tiles['a']` is a number (the bundled `require()` handle), and `images.words['act']` is a number

#### Scenario: Parser failure propagates

- **WHEN** a manifest's `rawFiles['aa_gametiles']` is structurally malformed
- **THEN** `loadLangPack` throws `LangPackParseError` from the parser (not caught by the loader)

#### Scenario: Missing manifest asset throws `LangAssetsBindError`

- **WHEN** a tile in `aa_gametiles.txt` declares `audioName === 'zz_a'` but `manifest.audio.tiles['zz_a']` is undefined
- **THEN** `loadLangPack` throws `LangAssetsBindError` with `category === 'tile-audio'`, `key === 'zz_a'`

#### Scenario: `zz_no_audio_needed` sentinel does not throw

- **WHEN** a tile's `audioName === 'zz_no_audio_needed'` (Java sentinel indicating intentional silence)
- **THEN** `loadLangPack` skips binding for that tile and does not include the tile in `assets.audio.tiles`

### Requirement: Domain-keyed asset maps

`LangAssets.audio.*` and `LangAssets.images.*` SHALL be keyed by the domain identifier used by the engine (tile `base`, word `wordInLWC`, syllable `syllable`, game `InstructionAudio`), not by the manifest's internal keys (which are the raw `audioName` / filename stems from the `aa_*.txt` files).

#### Scenario: Tile audio keyed by `base`

- **WHEN** `aa_gametiles.txt` has `base === 'a'` and `audioName === 'zz_a'`
- **AND** `manifest.audio.tiles['zz_a']` is `123` (Metro's require number)
- **THEN** `assets.audio.tiles['a'] === 123`

#### Scenario: Word image keyed by `wordInLWC`

- **WHEN** a word has `wordInLWC === 'act'` and `manifest.images.words['act']` is `456`
- **THEN** `assets.images.words['act'] === 456`

#### Scenario: Distractor image variant in separate map

- **WHEN** a word `act` has both `manifest.images.words['act']` and `manifest.images.words['act2']`
- **THEN** `assets.images.words['act']` is the primary handle and `assets.images.wordsAlt['act']` is the distractor handle

### Requirement: `<LangAssetsProvider>` is the runtime entry point

The library SHALL export `LangAssetsProvider` — a React Context provider that calls `loadLangPack(langManifest)` once (via `useMemo([])`) and makes the resulting `LangAssets` available to all descendants via `useLangAssets()`. The provider MUST render its `children` only after `loadLangPack` returns successfully. On throw, the provider SHALL render `<ErrorScreen>` in place of `children`.

#### Scenario: Provider mounted, children render with assets

- **WHEN** `<LangAssetsProvider><ChildComponent /></LangAssetsProvider>` is rendered against a valid manifest
- **AND** `ChildComponent` calls `useLangAssets()`
- **THEN** the hook returns the fully-populated `LangAssets`
- **AND** `children` (including `ChildComponent`) renders

#### Scenario: Provider mounted, pack broken

- **WHEN** `<LangAssetsProvider>` is rendered against a manifest that causes `loadLangPack` to throw
- **THEN** `<ErrorScreen>` renders in place of `children`
- **AND** no descendant of the provider is rendered

#### Scenario: `useLangAssets` called outside the provider

- **WHEN** a component calls `useLangAssets()` without being wrapped in `<LangAssetsProvider>`
- **THEN** the hook throws `Error('useLangAssets must be used inside <LangAssetsProvider>')`

### Requirement: Error screen for boot failures

The library SHALL render `<ErrorScreen>` as the fallback when `loadLangPack` throws. The screen MUST display the error class name and message, format `LangPackParseError` / `LangAssetsBindError` with their structured fields (file, line, category, key), and set `accessibilityLiveRegion="assertive"` on its root for screen-reader announcement. No retry button; no i18n (the pack is broken).

#### Scenario: Parse error message

- **WHEN** `<ErrorScreen>` receives a `LangPackParseError` with `file === 'aa_gametiles.txt'`, `line === 5`, `reason === 'column count mismatch'`
- **THEN** the rendered text includes `"aa_gametiles.txt"`, `"line 5"`, and `"column count mismatch"`

#### Scenario: Bind error message

- **WHEN** `<ErrorScreen>` receives a `LangAssetsBindError` with `category === 'word-audio'`, `key === 'act'`
- **THEN** the rendered text includes `"word-audio"` and `"act"` and a hint mentioning the validator

#### Scenario: A11y announcement

- **WHEN** `<ErrorScreen>` is rendered
- **THEN** its root element has `accessibilityLiveRegion="assertive"` so assistive tech announces the failure

### Requirement: Precomputes run during boot

`loadLangPack` SHALL invoke `runPrecomputes(assets)` from `@alphaTiles/util-precompute` after asset assembly and SHALL store the resulting `Map<string, unknown>` in `assets.precomputes`. Consumers SHALL access precomputed data via `useLangAssets().precomputes.get(key)` or the typed convenience `usePrecompute<T>(key)`.

#### Scenario: Registered precompute populates

- **WHEN** a module imported before the provider renders has called `registerPrecompute('demo', (a) => ({ total: a.tiles.rows.length }))`
- **AND** the provider mounts
- **THEN** `useLangAssets().precomputes.get('demo')` returns `{ total: 39 }` for engEnglish4

#### Scenario: Precompute throws during boot

- **WHEN** a registered precompute function throws
- **THEN** `runPrecomputes` re-throws with the precompute key attached
- **AND** `<LangAssetsProvider>` catches and renders `<ErrorScreen>` with the precompute key visible in the message

### Requirement: Provider mount position

The `<LangAssetsProvider>` SHALL be mounted in `apps/alphaTiles/src/_layout.tsx` below the existing RTL-setup code and above the router's `<Stack />`. No other provider (i18n, Zustand, navigation) SHALL appear above `<LangAssetsProvider>` in the mount tree.

#### Scenario: Correct mount order

- **WHEN** the app root layout is rendered
- **THEN** `<LangAssetsProvider>` is the outermost custom provider
- **AND** the router (`<Stack />` or equivalent) is its direct child (with other providers optionally between)

#### Scenario: RTL setup precedes provider mount

- **WHEN** `Constants.expoConfig.extra.scriptDirection === 'RTL'`
- **THEN** `I18nManager.forceRTL(true)` has already been called before `<LangAssetsProvider>` first renders

### Requirement: `@generated/langManifest` path alias

The workspace `tsconfig.base.json` SHALL declare `"@generated/langManifest": ["apps/alphaTiles/src/generated/langManifest.ts"]` under `paths`. All consumers (`data-language-pack`, `data-language-assets`) SHALL import the manifest via this alias; relative imports into the app tree are forbidden.

#### Scenario: Alias resolves

- **WHEN** `import { langManifest } from '@generated/langManifest'` is written in `libs/alphaTiles/data-language-assets/src/LangAssetsProvider.tsx`
- **THEN** the TypeScript compiler resolves the import without path errors
- **AND** Metro bundles it correctly at build time

#### Scenario: Relative paths forbidden

- **WHEN** any file under `libs/` is searched for imports starting with `'../../../apps/'`
- **THEN** zero matches are found

### Requirement: Library dependency shape

The new libraries MUST respect the project's NX dependency rules:

- `data-language-pack` (type `data-access`) depends on `util-lang-pack-parser` (type `util`), `util-precompute` (type `util`), and the typed manifest (via alias). No `react` imports. No `ui` / `feature` imports.
- `data-language-assets` (type `data-access`) depends on `data-language-pack` (type `data-access`), `util-precompute`, `react`, `react-native`. No `ui` / `feature` imports. No `react-i18next` import.

#### Scenario: `data-language-pack` has no React

- **WHEN** `libs/alphaTiles/data-language-pack/src/**/*.ts` is searched
- **THEN** no file imports from `react` or `react-native`

#### Scenario: `data-language-assets` does not import i18next

- **WHEN** `libs/alphaTiles/data-language-assets/src/**/*.ts(x)` is searched
- **THEN** no file imports from `react-i18next` or `i18next`

### Requirement: No `useEffect` for pack init

The provider's pack-init logic SHALL use `useMemo([])` (or equivalent one-shot derivation pattern) rather than `useEffect`. This aligns with the project-wide rule (`CLAUDE.md`: "No direct `useEffect` — use derived state, handlers, `useMountEffect`, or `key`").

#### Scenario: Provider source check

- **WHEN** `libs/alphaTiles/data-language-assets/src/LangAssetsProvider.tsx` is inspected
- **THEN** it contains `useMemo(` and does not contain `useEffect(`

### Requirement: One-function-per-file, no barrel except root

Both libraries SHALL place one exported function / component per `.ts`(`x`) file under `src/`, matching the filename. Only `src/index.ts` may re-export.

#### Scenario: `loadLangPack.ts` contains only `loadLangPack`

- **WHEN** `libs/alphaTiles/data-language-pack/src/loadLangPack.ts` is inspected
- **THEN** the file has exactly one named export `loadLangPack`

#### Scenario: No intermediate barrels

- **WHEN** each library's `src/` tree is listed
- **THEN** the only `index.ts` per library is `src/index.ts`
