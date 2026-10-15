# Architecture

Stable overview of the AlphaTiles codebase. Survives individual change cycles — update only when high-level structure shifts.

Per-change implementation detail lives in `openspec/changes/<change>/design.md`. Single-decision rationale lives in `docs/decisions/ADR-*.md`.

## 1. What AlphaTiles is

Literacy-game generator for minority-language communities. A language community supplies a folder of assets (tab-delimited wordlists, phoneme/tile data, audio, images, fonts) and the app renders that as a set of tile-based literacy games in that language.

- **Originates from** a Java/Android app (see `../AlphaTiles/`) with 17 game-class mechanics and ~90 game-instance configurations per language pack.
- **Language packs** live in a separate `PublicLanguageAssets` repository — one folder per language (`engEnglish4`, `tpxTeocuitlapa`, `templateTemplate`, …).
- **Ships as per-language builds** — one APK / IPA / web bundle per language pack, selected at build time. No backend, no runtime language switching, no cross-language content.

## 2. Monorepo layout

```
apps/
  alphaTiles/                      # Expo app shell — routing + per-lang config only
    app/                           # expo-router file-based routes
    src/                           # bootstrap: providers, i18n init, generated/
    src/generated/                 # langManifest.ts (written by prebuild)
    assets/                        # shared assets (base sounds, default icon/splash)
    app.config.ts                  # dynamic — reads APP_LANG env
    metro.config.js
    project.json

libs/
  alphaTiles/                      # App-specific libraries
    feature-*/                     # Screens (container + presenter)
    data-*/                        # State, storage, loaders
    util-*/                        # Pure logic
  shared/                          # Cross-app libraries
    ui-*/                          # Presentational components
    util-*/                        # Shared pure helpers

languages/                         # gitignored — rsync'd from PublicLanguageAssets
  eng/                             # primary dev fixture (English)
  tpx/                             # faithfulness fixture (Mè'phàà)
  template/                        # validator fixture (empty)
  yue/                             # first production target (Cantonese — stub)

docs/
  ARCHITECTURE.md                  # this file
  decisions/                       # ADRs
  designs/                         # standalone designs (rare; per-change designs live in openspec/)

openspec/
  changes/                         # in-flight feature specs
  specs/                           # archived capability specs
  config.yaml

tools/
  rsync-lang-packs.ts              # copies language pack into languages/<APP_LANG>
  generate-lang-manifest.ts        # emits libs/alphaTiles/data-language-assets/src/generated/langManifest.ts
```

## 3. NX library taxonomy

Every library has a `type` tag and a `scope` tag. ESLint enforces dependency rules via `@nx/enforce-module-boundaries`.

| type | tag | can import |
| ---- | --- | ---------- |
| `app` | `type:app` | `type:feature` only |
| `feature` | `type:feature` | `type:ui`, `type:data-access`, `type:util` |
| `data-access` | `type:data-access` | `type:data-access`, `type:util` |
| `ui` | `type:ui` | `type:ui`, `type:util` |
| `util` | `type:util` | nothing |

| scope | tag |
| ----- | --- |
| `alphaTiles` | `scope:alphaTiles` |
| `shared` | `scope:shared` |

### Naming

`libs/{scope}/{type}-{name}` → e.g. `libs/alphaTiles/feature-game-menu`, `libs/shared/ui-tile`.

### One-function-per-file

File name = export name. No multi-export modules. No barrel files except the library root `src/index.ts`.

### Container / presenter

Every feature screen splits:

- **Container** (`<Feature>Container.tsx`) — owns hooks, `useTranslation`, navigation, data subscriptions. Passes data + translated strings + callbacks down.
- **Presenter** (`<Feature>Screen.tsx`) — pure props → JSX. No `useTranslation`, no navigation, no data hooks. Testable w/o providers.

### `ui` libs are i18n-blind

`type:ui` libraries MUST NOT import `react-i18next`. They accept pre-translated strings as props. Containers own translation; UI owns rendering.

## 4. Per-language build pipeline

One Expo project, one codebase, N builds (one per language pack).

### Selection

`APP_LANG` environment variable (e.g. `APP_LANG=eng`) drives every per-build decision. EAS build profile per language sets `APP_LANG` in its env block.

### Prebuild sequence

1. **`rsync-lang-packs`** — copies `$PUBLIC_LANG_ASSETS/<pack>/res/` → `languages/<APP_LANG>/` (flat normalized shape — see §5). Fails if the pack is absent or fails schema validation.
2. **`lang-pack-validator`** — runs full validator against `languages/<APP_LANG>/`. Fails the build on errors; emits warnings to console.
3. **`generate-lang-manifest`** — scans `languages/<APP_LANG>/` and emits `libs/alphaTiles/data-language-assets/src/generated/langManifest.ts` (committed; regenerated by every build — see below). That file is the only place `require('../../languages/…')` calls live. Everything at runtime consumes the typed manifest via the `@generated/langManifest` path alias (see §6).
4. **`app.config.ts`** — reads `languages/<APP_LANG>/aa_langinfo.txt`, derives display name, slug, app ID (see Per-build identity), RTL flag, icon path (override if present, else shared default). Exports the final Expo config object.

### EAS build profiles

`apps/alphaTiles/eas.json` (the only `eas.json`; EAS runs from `apps/alphaTiles`) contains one profile per supported language pack. Each profile sets `APP_LANG` and its OTA `channel`. `eas build --profile yue` → Cantonese build. New language pack = new profile + rsync source = new build target.

Every build regenerates per-language content for its `APP_LANG` (`npm run prebuild-lang` = validate + generate manifest; steps 2–3 above, rsync is manual):

- EAS (cloud or `--local`): `eas-build-post-install` hook in `apps/alphaTiles/package.json`.
- nx: `prebuild-lang` target, a dependency of `start`, `run-android`, `run-ios`, `web-export`.

Release signing comes only from EAS-managed credentials (`credentialsSource: remote`); no keystore in the repo. `nx buildApk` = `eas build --local --profile $APP_LANG-apk`.

### Per-build identity

- Android `package` / iOS `bundleIdentifier` = `com.makektm.alphatiles` for the primary pack (`yue`), `com.makektm.alphatiles.<pack>` for every other pack (`resolveAppId` in `app.config.ts`). Permanent once published. `languages/<pack>/aa_share.txt` must point at the same ID.
- `slug` / `name` = from `aa_langinfo.txt`
- Icon / splash = `languages/<APP_LANG>/images/icon.png` if present, else `apps/alphaTiles/assets/images/icon-default.png`
- RTL = `I18nManager.forceRTL(true)` in app entry if `aa_langinfo.txt` script direction is `RTL`

## 5. Language pack shape

Every pack under `languages/<code>/` normalizes to:

```
aa_colors.txt
aa_games.txt
aa_gametiles.txt
aa_keyboard.txt
aa_langinfo.txt
aa_names.txt
aa_notes.txt            # optional — validator-only, not bundled
aa_resources.txt
aa_settings.txt
aa_share.txt
aa_syllables.txt
aa_wordlist.txt

fonts/                  # optional — omit to use the system font (e.g. yue/CJK)
  <primary>.ttf         # must be redistributable (e.g. OFL)
  <primary>_bold.ttf    # optional

images/
  icon.png              # optional per-pack override
  splash.png            # optional per-pack override
  avatars/zz_avatar01…12.png
  avataricons/zz_avataricon01…12.png
  tiles/*.png           # optional — tile glyph images
  words/<word>.png      # per-word image (primary)
  words/<word>2.png     # per-word image (distractor variant)

audio/
  tiles/<tile>.mp3
  words/<word>.mp3
  syllables/<syll>.mp3
  instructions/<name>.mp3

manifest.json           # generated at rsync — file listing w/ checksums + detected options
```

Shared (non-pack) audio lives at `apps/alphaTiles/assets/audio/{correct,incorrect,correctFinal}.mp3`.

## 6. Runtime data flow

```
                          prebuild                   runtime
                   ┌──────────────────────┐   ┌────────────────────┐
languages/<APP_LANG>/  →   langManifest.ts  →   lang-pack-parser  →  LangAssetsProvider
                      (@generated/langManifest)  (parsePack)          (loadLangPack)
                                                                        │
                                                                        ▼
                                              ┌─────────────────────────────────────────┐
                                              │ Context (boot-immutable, read-only):    │
                                              │  tiles, words, syllables, keys, games,  │
                                              │  langInfo, settings, colors, fonts,     │
                                              │  audio handles, image requires,         │
                                              │  precomputes (Map<string,unknown>)      │
                                              └─────────────────────────────────────────┘
                                                                        │
                          ┌─────────────────────────────────────────────┤
                          ▼                                             ▼
              ┌──────────────────────┐                  ┌──────────────────────────────┐
              │ i18next (unified)    │                  │ Zustand stores (mutable):    │
              │  ns: chrome          │                  │  player, progress, activeGame│
              │  ns: tile, word,     │                  │  (persist → AsyncStorage)    │
              │      syllable, game  │                  └──────────────────────────────┘
              │  device locale →     │
              │   chrome lookups     │
              │  build lang →        │
              │   content lookups    │
              └──────────────────────┘
```

### `@generated/langManifest` path alias

`apps/alphaTiles/src/generated/langManifest.ts` is regenerated at every prebuild.
Libs import it via the `@generated/langManifest` alias (declared in `tsconfig.base.json`),
never via relative paths into the app. This alias is exempt from the standard
"libs don't import from app" rule — the generated manifest is a build artifact,
not app logic. The `data-language-assets` and `data-language-pack` libs use this alias.

### What goes where

- **Context** (boot-immutable): anything loaded once from the language pack and never mutated — tile / word / syllable lists, language metadata, settings, colors, pre-resolved audio/image handles, precompute-registry outputs.
- **Zustand**: anything that changes at runtime — active player, per-game progress, current-game in-flight state, tracker counts.
- **i18next**: anything that resolves to a display string.
  - `chrome` namespace — UI chrome (buttons, labels, a11y). Resolved against device locale. Defaults in `locales/en.json`. Missing locale → English fallback. Per-pack override (`chromeLocaleForBuildLang`, e.g. `yue` → `zh-HK`) beats device locale.
  - `tile`, `word`, `syllable`, `game`, `langMeta` namespaces — content strings from the language pack. Registered at boot via `i18n.addResources(BUILD_LANG, ns, data)`. Resolved against `BUILD_LANG` (e.g. `eng`).
- **Non-string pack data** (audio handles, image `require()`s, fonts, script direction, stages, settings) — NEVER goes through i18next. Lives in the `LangAssetsProvider`.

## 7. State management rules

- **Do not use `useEffect` directly.** Use derived state, event handlers, `useMountEffect`, or the `key` prop. See `docs/CODE_STYLE.md`.
- **Zustand store per domain**, not one god-store. Each store owns its slice, has its own persist config, and exposes typed selectors.
- **Context providers for immutable data only.** If something changes, it belongs in Zustand.
- **Effective settings** — cross-cutting settings (`showGameNames`, `changeArrowColors`, audio flags, avatars, "After 12 checked trackers" — acted on by door progress …) are read through `useEffectiveSettings()` (`@alphaTiles/data-settings`): pack `aa_settings.txt` typed + defaulted once, with the active player's preferences (`usePlayerPreferencesStore`, `data-players`) layered on top. Game-specific settings stay with their game. Settings screen (`feature-settings`, `/settings`) writes via `useSetPreference()`.

## 8. Audio

`expo-audio`, wrapped by `libs/alphaTiles/data-audio`.

- **Preload at loading screen** — all `tiles/*.mp3`, `words/*.mp3`, `syllables/*.mp3` loaded into a keyed map. Same flow as Android `SoundPool`.
- **Web caveat** — browsers block audio until a user gesture. One module owns it: `AudioGate` (data-audio), wrapping every route in the root layout (`renderLocked` = feature-loading `TapToBegin`). Locked on web until a tap *after* preload; the tap primes every clip in chunks (Safari needs per-element priming; priming all at once killed Chromium tabs). Cold start, reload and deep link all hit the same gate; boot sequence knows nothing of it.
- **Boot** — feature-loading `AppRoot` is the whole root layout (`<AppRoot><Stack /></AppRoot>`): i18n → language pack → AudioProvider → fonts/theme → AudioGate → `BootGate`. BootGate wraps every route, so cold start at `/`, web reload and native deep link all hide the splash, register content namespaces, await audio + players hydration and start the OTA check before any screen mounts. `/` is `EntryRedirect` (→ `/choose-player` or `/menu`). Native passes through. Overlapping playback on web is best-effort (one `<audio>` per key). See `openspec/changes/web-platform-parity/design.md` I1–I6.
- **Base sounds** (`correct.mp3`, `incorrect.mp3`, `correctFinal.mp3`) ship in the app bundle, not the pack.
- **Pack speech** — the only way to play pack content. `speak(item)` / `durationOf(item)` / `stop()` where `item` is `{ tile } | { word } | { syllable } | { instruction }` (a pack row, never an audio key). Lives in `data-audio` (`createPackSpeech` + `planSpeech`, adapter `usePackSpeech`) on top of the player pool and web priming; games reach it via `useGameShell().speak`, which lends the shell's interaction lock to syllable chains. Owns key resolution, word → syllable-chain fallback (decomposable rule = `syllableChainFor` in `util-phoneme`, shared with `resolveAudio` + the validator), opt-in syllable → containing-word fallback, gap timing, durations, warn-once. `useAudio()` keeps only chimes + load/unlock. See `docs/GAME_PATTERNS.md` "Pack speech".

## 9. Per-class precompute registry

Some game classes precompute data at boot (Android: `Chile.chilePreProcess()`). Port uses `libs/shared/util-precompute`:

```ts
// apps/alphaTiles/src/gameClasses.ts — on the class's registry entry:
chile: { Container: ChileContainer, precompute: chilePreProcess },
// src/registerPrecomputes.ts (imported first by app/_layout) loops the registry:
registerGameClassPrecomputes(gameClasses); // feature-game-shell → registerPrecompute(classKey, …)

// during lang boot:
runPrecomputes(assets); // iterates the registry, fills a per-key cache

// at game entry:
const chileData = usePrecompute('chile');
```

`util-precompute` is `type:util` scope `shared` and knows no game. The key is the classKey; the only list is the game-class registry (§17).

## 10. i18n key conventions

### Chrome keys — committed English defaults in `locales/en.json`

```json
{
  "chrome": {
    "back": "Back",
    "score": "Score: {{points}}",
    "choose_player": "Choose Player",
    "a11y": {
      "tile": "Tile {{letter}}",
      "word": "Word {{word}}"
    }
  }
}
```

Access: `t('chrome:score', { points: 42 })`.

### Content keys — registered at boot from the language pack

- `tile:<id>` — tile display text (from `aa_gametiles.txt` column `tiles`)
- `tile:<id>.upper` — upper-case variant
- `tile:<id>.alt1`, `.alt2`, `.alt3` — alt forms
- `word:<id>` — word display text (Language-of-Play column)
- `word:<id>.lwc` — Language-of-Wider-Communication column
- `syllable:<id>` — syllable display text
- `game:<doorIndex>.instruction` — game instruction text if any
- `langMeta:name_local`, `langMeta:name_english`, `langMeta:player_word`, etc.

Call sites: `t('tile:a')` (content — resolves against `BUILD_LANG`), `t('chrome:back')` (chrome — resolves against device locale).

### Invariants

- **Hardcoded English string in JSX = bug.** Always route through `t()`.
- **Hardcoded English a11y label = bug.** Always `accessibilityLabel={t('chrome:a11y.…')}`.
- `type:ui` libraries NEVER call `useTranslation` — they accept strings as props only.

## 11. Accessibility baseline

- Every interactive (`Pressable`, `Button`, tappable tile) has `accessibilityLabel` + `accessibilityRole`.
- Labels come from `t()` with either a `chrome:` key or a content key.
- Focus order is not hand-engineered in v1 — default document order suffices.
- Screen-reader pronunciation of minority scripts is best-effort (no TTS voice assumed); labels still help braille displays and users who know the script.

## 12. Analytics (v1: spec only, impl deferred)

`libs/shared/util-analytics` exports:

```ts
track(event: string, props?: Record<string, unknown>): void
identify(playerId: string, traits?: Record<string, unknown>): void
screen(name: string, props?: Record<string, unknown>): void
```

V1 ships a no-op adapter. V2 swaps in a real provider (PostHog, Firebase — tbd) with one-line change. Event schema is defined clean-slate per the `analytics-abstraction` change; feature libs call `track()` at the agreed events from day one.

`aa_settings.txt` setting `"Send analytics"` gates whether the adapter fires (even in v2).

## 13. OTA updates

Per EAS Update. Each language pack has its own update channel (`eng`, `tpx`, `yue`, …). On native launch BootGate fires `runOtaCheck({ reload: false })` (from `@shared/util-ota`) without blocking boot: it checks the channel, downloads any update in the background, and expo-updates launches it on the next cold start (no mid-session reload). After boot, `reportApplyIfNeeded()` records an applied update. Native-code changes still require a full rebuild.

- `runtimeVersion.policy = "fingerprint"` — binaries pool by the native-surface hash (`@expo/fingerprint`); a mismatched update is ignored. No manual bump; a native change gets a new runtime automatically.
- Roll back to embedded (`eas update:rollback`) is fetched like an update and applied on the next cold start.
- `updates.checkAutomatically = "NEVER"` — check is manual, triggered from the loading screen.
- One update channel per language pack, declared in `eas.json` per build profile.
- Version-skew policy: see `docs/decisions/ADR-009-ota-via-eas-update.md`.
- EAS init prerequisite + publish workflow: see `docs/GETTING_STARTED.md § EAS Updates`.

## 14. Persistence

- **Zustand `persist` middleware** with the AsyncStorage driver. Uniform native + web.
- **One persist config per store** — not one big blob.
- **No migration code in v1** — no existing users, no backward-compatibility surface.

## 15. Testing

| Library type | What to write |
| ------------ | ------------- |
| `type:util`, `type:data-access` (pure logic only: parser, validator, scoring, stages, phoneme) | Unit tests w/ Jest |
| `type:ui` | Storybook stories; no mandatory unit tests |
| `type:feature` | No mandatory automated tests in v1 — manual verification during development |

**Storybook**: composite host at `libs/shared/storybook-host/` — run `./nx storybook storybook-host`. All `type:ui` stories aggregate via glob; no per-lib Storybook. Framework: `@storybook/react-vite`. RN primitives render via `react-native-web`. Native-only visual bugs (Android ripple, iOS haptics) are NOT caught by Storybook; catch via manual device QA per change.

Fixtures for unit tests live under `languages/eng/` and `languages/template/`. The validator's own test suite runs against all three pack fixtures in CI.

No Detox / Playwright e2e in v1.

**Packs in the nx graph**: `languages/` is the `languages` nx project (`languages/project.json`, no targets). Every project whose tests or builds read the real packs (`tools`, `data-doors`, `data-door-progress`, `data-settings`, `feature-game-menu`, `feature-self-test`, `alphaTiles`) lists it in `implicitDependencies` — a new one must too. So a pack-only change marks them affected and busts their test cache (`^default`).

**CI** (`.github/workflows/ci.yaml`): `nx affected -t lint typecheck test` (incl. `alphaTiles:typecheck` and `tools:test`, the pack contract tests), `validate-lang-pack` for every pack, and a yue web export when the app is affected; Storybook build in parallel.

## 16. RTL and script direction

- Every style uses logical props (`marginStart` / `marginEnd`, `flexDirection: 'row'`) — never `marginLeft` / `marginRight`.
- `app.config.ts` reads `languages/<APP_LANG>/aa_langinfo.txt`; if script direction is `RTL`, the Expo entry calls `I18nManager.forceRTL(true)` before the root component mounts.
- Script-type-specific tile parsing (Thai / Lao / Khmer / Arabic — and any future pack that needs it, e.g. Devanagari, Chinese) lives in `libs/alphaTiles/util-phoneme`, keyed off the `aa_langinfo.txt` `Script type` field.

## 17. Game taxonomy

The 17 Java game classes (`Brazil`, `China`, `Chile`, `Colombia`, `Ecuador`, `Georgia`, `Iraq`, `Italy`, `Japan`, `Malaysia`, `Mexico`, `Myanmar`, `Peru`, `Romania`, `Sudan`, `Thailand`, `UnitedStates`) are **mechanics**, not lang-specific variants. `aa_games.txt` defines game instances, each of which is a `{class, challengeLevel}` pair. `challengeLevel` is class-specific — Thailand, for instance, decodes it as a 3-digit code for `{difficulty, refType, choiceType}`.

### Door catalogue

A **Door** (see `GLOSSARY.md`) is one `aa_games.txt` row resolved against the pack. `@alphaTiles/data-doors` (`type:data-access`) is the only module that derives anything from `games.rows` (the one other reader, feature-loading's boot, only copies each row's InstructionAudio id into the `game` i18n namespace):

- `doorsOf(pack) → Door[]` — pure; all rows, file order, `doors[i].index === i + 1`. Tested against the real `yue` + `eng` packs.
- `useDoors()` / `useDoor(routeParams)` — the same, memoized from `useLangAssets()`.

`Door = { index, classKey, country, challengeLevel, displayLevel, tier, variant, stage, colorHex, name?, instructionAudio?, tracksProgress, enabled, progressKey(playerId) }` (`name` = optional `GameName` column 9 of `aa_games.txt`, the menu door label). The menu (enabled doors), `GameShellContainer` (routed door) and every game container (via the shell's `{(door) => …}` child) consume Doors. `index` is the raw row position and the route `doorIndex` — display sorts (difficulty ladder) must never renumber it. A new per-door fact (game name, tier) is one field in `doorsOf`.

**Difficulty ladder** (#52): `tier` (0–6) = `tierForGame(classKey)` from `@alphaTiles/util-curriculum-tiers` (engine-owned, #13's ladder, unmapped → 3). `ladderOrder(doors)` / `useLadderDoors()` sort by `(tier, index)` — the menu grid order and the play order. Menu shows a "Level N" badge per door and a "?" where-to-start sheet.

### Door progress

**Door progress** (see `GLOSSARY.md`) is the one place "mastered" is defined. `@alphaTiles/data-door-progress` (`type:data-access`, on top of `data-progress`, keyed by `Door.progressKey`):

- `doorProgressOf({ door, playerId, progress }) → { points, trackerCount, trackers[12], mastered, visual }` — pure. Mastered = tracks progress ∧ `trackerCount >= 12` (Java `Earth.updateDoors` / `hasChecked12Trackers`); the bar stays full past 12.
- `recordCorrectAnswer({ door, playerId, points, afterTwelveCheckedTrackers }) → MasteryAction | null` — writes points (+ one tracker if the door tracks progress); returns `keep-playing` / `return-to-menu` / `celebrate-then-next-door` on every 12th tracker.
- `nextUnmasteredDoor({ order, from, playerId, progress })` — first enabled, unmastered door after `from` in `order`, wrapping; null → menu.
- Hooks: `useDoorProgressOf(playerId) → (door) => DoorProgress` (menu; ladder placement) and `useDoorProgress(door, playerId) → DoorProgress & { recordCorrect, nextDoor }` (shell; reads "After 12 checked trackers" from effective settings).

Menu visuals, the shell's tracker bar / score / mastery action and the next-door search all consume it. Play order is the difficulty ladder: `useDoorProgress` passes `useLadderDoors()` to `nextUnmasteredDoor`. Tested against the real `yue` pack + the real store (in-memory AsyncStorage).

### Self-test (#42)

`@alphaTiles/feature-self-test`, route `/self-test`, entry button below the menu door grid. An ungraded run of 10 questions built by `buildSelfTest` from Thailand's question builder (`thailandQuestion`, exported by `feature-game-thailand` with its `ThailandScreen` + `thailandRoundView`), cycling the pack's enabled Thailand Doors in ladder order. Not a Door; score lives in component state only — the lib must never import `data-progress`, `data-door-progress` or `util-analytics` (guarded by a test). Design: `openspec/changes/self-test-mode/design.md`.

### Game-class registry and the one game route

`apps/alphaTiles/src/gameClasses.ts` maps classKey → `{ Container, precompute? }`, typed `Record<GameClassKey, …>` over the plain key list `gameClassKeys.ts` (plain so `tools/` can import it). It is the one place a game class is wired into the app — **add a game = one registry entry + one curriculum tier** (`TIER_BY_CLASS_KEY`, util-curriculum-tiers; `tools/curriculumTiers.test.ts` fails on a missing tier). App-level because only the app may import every `feature-game-*` lib and resolve app assets.

One route serves every Door: `app/games/[classKey].tsx` → feature-game-shell `GameRouteContainer` (given `gameClasses` + `gameIcons`) → `resolveGameRoute`: the routed Door (`useDoor(params)`) names the class; with no `doorIndex` (static page, bare deep link) the first Door of the URL's class, none → `/menu` → `gameClasses[classKey].Container` with route params + `gameIcons` (chrome icons injected once). URL: `/games/<classKey>?doorIndex=…&challengeLevel=…` (menu, next-door navigation and deep links). `generateStaticParams` prerenders one web page per registry key. A class missing from the registry renders a "game unavailable" screen at runtime and fails prebuild (`tools/assertGameClassesForGames.ts`; its test also checks every pack under `languages/`).

### V1 port scope

Of the 17 classes, V1 implements exactly one:

- **China** — syllable-based, Cantonese-compatible, small. Proves the engine architecture end-to-end.

Other classes are not spec'd until a language pack demands them. Each new class will be its own OpenSpec change proposed at that time.

### Engine base

`libs/alphaTiles/feature-game-shell` ports the shared `GameActivity.java` behavior: score counter, back button, tracker-count progression, audio-replay button, stage advancement, player-prefs read/write. Concrete game feature libs (`feature-game-china`, …) layer their mechanic on top.

## 18. References

- `docs/CODE_STYLE.md` — TypeScript / React Native conventions (always follow)
- `docs/PROJECT_ORGANIZATION.md` — NX tagging, dependency rules (always follow)
- `docs/AI_WORKFLOW.md` — OpenSpec workflow
- `docs/GAME_PATTERNS.md` — accumulated patterns from implemented game classes (read before any game-* change)
- `docs/COMMIT_CONVENTIONS.md` — conventional commits format
- `docs/decisions/ADR-*.md` — per-decision rationale
- `openspec/changes/<change>/design.md` — tactical per-change design
