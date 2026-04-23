## Why

`port-foundations` ships a placeholder `tools/validate-lang-pack.ts` that only checks file presence and avatar counts — a stub. `lang-pack-parser` adds typed reads of every `aa_*.txt` file but does no cross-file checks. Neither catches the failure modes that cause the overwhelming majority of real-world pack defects: a word that references a tile that doesn't exist, an audio file listed but absent, a stage progression that advances past the tile list, a duplicated tile key, an invalid game class name.

ADR-008 committed to **porting the full Java validator faithfully** (~3489 LOC `Validator.java` + `FilePresence.java` (247 LOC) + `StagesChecks.java` (90 LOC) + `Message.java` (36 LOC) ≈ 3800 LOC total). Partial validation scatters defence across runtime and weakens the trust boundary downstream consumers rely on. This change executes that ADR.

The validator is the **load-bearing trust boundary** between the content team's workflow and the engine. Once it passes, runtime code trusts asset shape, tile / word / audio / image references, stages, color indices, game class names, and settings values. Every engine branch that exists *today* in the Java original to defend against malformed data can be removed — or never written in the first place — because the validator catches it first.

## What Changes

- Add `libs/shared/util-lang-pack-validator/` library (type `util`, scope `shared`). Scaffolded via `nx g @nx/js:lib util-lang-pack-validator --directory=libs/shared/util-lang-pack-validator --tags='type:util,scope:shared'`.
- Consume `lang-pack-parser` for structured reads of every `aa_*.txt` file. Parser failures become the first category of validation errors.
- Port every check category from the Java validator. Categories (derived from `Validator.java`):
  - **file-presence** (mirrors `FilePresence.java`): required `aa_*.txt`, TTF fonts, 12 avatars + 12 avatar icons, referenced word images (`<word>.png`, optional `<word>2.png`), referenced tile images (optional), per-word audio, per-tile audio, per-syllable audio, instruction audio for every game
  - **column-structure**: per-file column counts, required-field non-empty checks (delegates mostly to parser; validator adds semantic "required value present" on top of parser's structural checks)
  - **wordlist-character-set**: first column characters match `[a-z0-9_]+`; warn on words containing spaces (>5%)
  - **keyboard-coherence**: every keyboard key color is a valid color-list index; every word's LOP-column characters decompose into keyboard keys (after removing `.` / `#`)
  - **tile-word-cross-ref**: every word's letters parse into known tiles (using `parseWordIntoTiles` — Java-faithful logic that respects `scriptType`, placeholder character for Thai/Lao, and `MULTITYPE_TILES`); every word's tile decomposition has at least 3 tiles (China requirement) or flags short/long words
  - **tile-structure**: tile types match the enum `{C, PC, V, X, D, AD, AV, BV, FV, LV, T, SAD}`; alternate tiles (cols 1–3) are members of the tile list; upper-case column detection (proper case vs full upper) consistency warning; no duplicate tile keys
  - **stage-coherence** (mirrors `StagesChecks.java`): for every stage 1–7, compute cumulative tile set, evaluate the stage-correspondence ratio for every word against cumulative tiles; flag stages with too few words (<10 warning); compute tile-stage / word-stage counts; respect `First letter stage correspondence` and `Stage 1-2 max word length` settings
  - **audio-reference**: every tile / word / syllable / game audio name has a corresponding mp3 file (via `FilePresence`-style check); warn on orphaned mp3 files in audio dirs
  - **image-reference**: every wordlist LWC entry has a matching `<word>.png`; distractor variant `<word>2.png` is optional; warn on orphaned pngs
  - **color-reference**: keyboard color indices within colorList range; tile color col (col 12) within range; game color (col 3) within range
  - **game-structure**: `Country` column value is one of the 17 known game-class names (Brazil, Chile, China, Colombia, Ecuador, Georgia, Iraq, Italy, Japan, Malaysia, Mexico, Myanmar, Peru, Romania, Sudan, Thailand, UnitedStates); `ChallengeLevel` is integer (class-specific interpretation deferred — just parseable); `SyllOrTile` ∈ {`T`, `S`}; `Door` is unique integer; `InstructionAudio` is either a real audio file name or the reserved `naWhileMPOnly`
  - **duplicate-detection**: duplicate tile keys; duplicate word keys; duplicate syllable keys; duplicate color indices; duplicate game doors
  - **langinfo-required-items**: presence of every canonical `aa_langinfo.txt` label (`Lang Name (In Local Lang)`, `Script direction (LTR or RTL)`, `Script type`, etc.); `Script direction` value ∈ {`LTR`, `RTL`}; `Script type` value ∈ {`Roman`, `Arabic`, `Devanagari`, `Khmer`, `Lao`, `Thai`}
  - **settings-types**: boolean settings parse as boolean (TRUE/FALSE); integer settings parse as int; `Stage correspondence ratio` parses as float in [0, 1]
  - **syllable-optional-coherence**: if the pack uses syllables (6+ words contain `.`), validate the `aa_syllables.txt` tab; else skip per `decideIfSyllablesAttempted` logic
- Programmatic API: `validateLangPack({ rawFiles, fileInventory }) => ValidationReport`. Pure function over parsed data + file listing.
- CLI: `bun tools/validate-lang-pack.ts` (replaces the placeholder). Flags: `--fixture <code>[,<code>…]` to run against specific pack dirs, `--json <path>` to emit a JSON report, `--only-errors` for CI log brevity.
- Report structure: list of `Issue` records, each with `severity: 'error' | 'warning' | 'info'`, `code: string` (stable identifier), `message: string`, and optional `file`, `line`, `column`. Plus aggregate counts.
- CI integration: exit 0 on no errors (warnings allowed); non-zero on error. Test suite runs against `languages/eng/`, `languages/tpx/`, `languages/template/` on every engine PR.
- `apps/alphaTiles/project.json` `validate-lang-pack` target rewired to call the real validator (replaces placeholder). `build-pipeline` capability gets a modified requirement reflecting this.

## Capabilities

### New Capabilities

- `lang-pack-validator`: the full validator surface — programmatic API + CLI + report structure + check category inventory.

### Modified Capabilities

- `build-pipeline` (from `port-foundations`): the `validate-lang-pack` prebuild stage is upgraded from placeholder-file-presence-only to the full validator. Delta spec under `specs/build-pipeline/spec.md` (MODIFIED).

## Impact

- **New files**: `libs/shared/util-lang-pack-validator/{project.json, src/index.ts, src/validateLangPack.ts, src/Issue.ts, src/ValidationReport.ts, src/checks/*.ts (~20 files, one per check category)}` plus per-check tests.
- **Updated files**: `tools/validate-lang-pack.ts` (now a thin CLI wrapper calling the lib), `apps/alphaTiles/project.json` (target description), `docs/ARCHITECTURE.md` §4 (one-line update noting validator is now real, not placeholder).
- **Dependency**: `@alphaTiles/util-lang-pack-parser` (already introduced). Dev-only: `jest`, `@types/jest`. No new runtime deps.
- **No runtime impact on `apps/alphaTiles/`** — the validator runs at build time only. No bundle size impact.
- **CI cost**: validator runs against 3 fixture packs on every PR; estimated total wall time <5s. Golden-file tests committed (`__tests__/golden/eng.expected.json` etc.); validator output compared structurally.
- **Break scenario**: a pack that previously passed the placeholder now fails the real validator. This is *expected* for any pack with latent defects. Mitigation: run the validator against every fixture pack before landing this change; fix or document any legitimate errors in the fixtures themselves (via a PR against `PublicLanguageAssets`).

## Out of Scope

- Google-sheet-driven validation (Java's `validateGoogleSheet`) — the Java original reads directly from Google Sheets for live validation of the content team's in-progress authoring. The TS port reads from materialized `languages/<code>/` only. Linguists can still run the Java validator against their sheets until a TS-native sheet-reader lands (not v1).
- Writing validated files back to disk (Java's `copySyllablesDraft`, `writeValidatedFiles`, `writeNewBuildGradle`) — those are Android-native build wiring. Not applicable to the Expo port.
- The Swing-UI helper (`addCheck(JPanel dialog, …)`) — the Java validator has an interactive mode; the TS port is headless-only.
- Drive-folder helper (`Validator.GoogleDriveFolder`) — filesystem-only; we walk the local `languages/<code>/` tree instead.
- Runtime validation. The validator is a build-time gate; runtime code assumes validated assets. A second validation pass at app start would be redundant (the manifest is generated from validated assets).
- Auto-fix / suggestion UI. The validator reports; it does not modify packs. Future work (likely a content-repo-side tool) can consume the report to prompt linguists.
