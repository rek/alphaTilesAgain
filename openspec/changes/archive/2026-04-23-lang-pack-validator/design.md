## Context

The Java validator (`../AlphaTiles/validator/src/main/java/org/alphatilesapps/validator/Validator.java`, 3489 LOC + 3 supporting files totaling ~350 LOC more) is the canonical check set for pack correctness. It catches hundreds of defect classes from missing audio files to stages that advance past the tile set. It's the load-bearing reason the Android product ships with a low pack-defect rate despite content authors being non-engineers.

The Java validator has three modes the TS port doesn't need:

1. **Google Sheets live-read** (`validateGoogleSheet` + helper classes) — pulls pack data from the content team's in-progress Sheets. TS port reads from `languages/<code>/` (already rsync'd from the finalized content repo). If the content team wants live-sheet validation, the Java tool remains.
2. **Writeback** (`writeValidatedFiles`, `copySyllablesDraft`, `writeNewBuildGradle`, `writeImageAndAudioFiles`) — copies validated data into the Android project layout. Expo port has a different build system; `rsync-lang-packs.ts` handles the equivalent.
3. **Swing GUI** (`addCheck(JPanel, …)`) — interactive mode. TS port is headless-only; reports go to stdout / JSON.

What we **must** port faithfully is the **check logic**: every condition the Java validator tests for, the TS port also tests for, with the same error/warning/recommendation severity. That's ADR-008's commitment. It's a large port but mechanical — each check block in Java maps to a TS function returning `Issue[]`.

### Required reading for implementers

- `AGENTS.md` — entry doc; read first.
- `openspec/AGENT_PROTOCOL.md` — pickup protocol.
- `docs/ARCHITECTURE.md` §3 (library taxonomy — this lib is `type:util, scope:shared`), §5 (pack shape), §10 (testing — golden-file fixture tests).
- `docs/decisions/ADR-008-full-validator-port.md` — the commitment to port every check from the Kotlin/Java validator.
- **Upstream OpenSpec changes (must be merged before starting):**
  - `port-foundations` — provides `languages/<code>/` layout and rsync.
  - `lang-pack-parser` — validator consumes the typed parsed output; `LangPackParseError` is re-wrapped as an issue.
  - Read `openspec/changes/port-foundations/design.md` and `openspec/changes/lang-pack-parser/design.md` in full.
- **Source Java/Kotlin files being ported** (absolute paths):
  - `../AlphaTiles/validator/src/main/java/org/alphatilesapps/validator/Validator.java` (~3489 LOC) — the canonical check set.
  - `../AlphaTiles/validator/src/main/java/org/alphatilesapps/validator/` — supporting files (~350 LOC).
  - `../AlphaTiles/app/src/main/java/org/alphatilesapps/alphatiles/Start.java` — cross-reference for loader assumptions that drive check thresholds.
- **Fixture paths** (absolute, under `../PublicLanguageAssets/`):
  - `../PublicLanguageAssets/engEnglish4/res/raw/aa_*.txt` + `res/font/`, `res/drawable*/`, `res/raw/*.mp3` — should produce zero errors.
  - `../PublicLanguageAssets/tpxTeocuitlapa/res/raw/aa_*.txt` + supporting assets — parity fixture.
  - `../PublicLanguageAssets/templateTemplate/res/raw/aa_*.txt` — empty template; golden file lists the expected "incomplete template" issues.

## Goals / Non-Goals

**Goals:**

- Programmatic API `validateLangPack({ rawFiles, fileInventory }) => ValidationReport`. Pure function. No IO. Consumer provides both the parsed-pack inputs and a listing of what files exist under `languages/<code>/`.
- CLI `bun tools/validate-lang-pack.ts` reads `languages/<APP_LANG>/`, walks the tree for the file inventory, reads each `aa_*.txt`, calls the lib, prints a human-readable report (or JSON with `--json <path>`), exits non-zero on any error.
- Match the Java validator's check set. Where Java has a check, TS has an equivalent check with the same severity and a traceable `code`.
- Produce stable, machine-parseable issue codes (e.g. `MISSING_AUDIO_FILE`, `TILE_WITHOUT_REFERENCE`, `INVALID_GAME_COUNTRY`) so that golden-file tests diff on structure, not message wording.
- Fixture-driven tests: `languages/eng/` should produce a known issue list (ideally empty); `languages/tpx/` likewise; `languages/template/` should produce a specific list of "template is incomplete" messages that are committed as the golden file.
- Zero runtime impact on `apps/alphaTiles/`. Validator runs at build time only.
- CI integration: every engine PR runs the validator against all fixture packs.
- `check`-level organization: one check category per file in `src/checks/*.ts`, one function per file. The top-level `validateLangPack.ts` composes them.

**Non-Goals:**

- Live Google-Sheets validation. (Java keeps this role.)
- Writing validated packs back to disk.
- Interactive / Swing UI.
- Auto-fix suggestions (Java has "Did you mean ...?" suggestions via Levenshtein; we keep the suggestion in the message string but don't offer to apply it).
- Validating `apps/alphaTiles/assets/audio/{correct,incorrect,correctFinal}.mp3` (those ship in the app bundle, not the pack).
- Validating the generated `langManifest.ts` (that's a derived artifact; validating the source `languages/` tree is sufficient).

## Decisions

### D1. Consume `lang-pack-parser`; accumulate, never throw

The validator depends on `lang-pack-parser` for structured reads. Semantically, a parser `LangPackParseError` is itself a validation error of category `column-structure`. The validator catches parser throws and converts them to `Issue` entries.

```ts
// simplified
function validateLangPack(input: ValidateInput): ValidationReport {
  const issues: Issue[] = [];
  let parsed: ParsedPack | undefined;
  try {
    parsed = parsePack(input.rawFiles);
  } catch (e) {
    if (e instanceof LangPackParseError) {
      issues.push({ severity: 'error', code: 'PARSE_FAILURE', file: e.file, line: e.line, column: e.column, message: e.message });
      return { issues, counts: count(issues) }; // can't continue without parsed data
    }
    throw e;
  }
  issues.push(...checkFilePresence(parsed, input.fileInventory));
  issues.push(...checkWordlistCharacters(parsed));
  issues.push(...checkKeyboardCoherence(parsed));
  issues.push(...checkTileWordCrossRef(parsed));
  issues.push(...checkTileStructure(parsed));
  issues.push(...checkStageCoherence(parsed));
  issues.push(...checkAudioReferences(parsed, input.fileInventory));
  issues.push(...checkImageReferences(parsed, input.fileInventory));
  issues.push(...checkColorReferences(parsed));
  issues.push(...checkGameStructure(parsed));
  issues.push(...checkDuplicates(parsed));
  issues.push(...checkLangInfoRequired(parsed));
  issues.push(...checkSettingsTypes(parsed));
  if (shouldCheckSyllables(parsed)) issues.push(...checkSyllablesCoherence(parsed, input.fileInventory));
  return { issues, counts: count(issues) };
}
```

Decision: **checks never throw.** A check fn that hits an unexpected shape (e.g. `aa_wordlist.txt` has 0 rows) adds an info-or-warning Issue and returns. Only catastrophic IO errors (e.g. the CLI can't read a file) throw — and those happen in the CLI wrapper, not in the lib.

Decision: **parse errors are fatal to the rest of the validation run.** Without a parsed tree, cross-ref checks have nothing to compare. We return with just the parse error; the CLI reports it and exits non-zero.

Decision: **one check per file**, matching project convention. `src/checks/checkFilePresence.ts`, `src/checks/checkStageCoherence.ts`, etc. Each exports one function.

### D2. Report structure

```ts
export type IssueSeverity = 'error' | 'warning' | 'info';

export interface Issue {
  severity: IssueSeverity;
  code: string;                    // e.g. 'MISSING_AUDIO_FILE'
  category: string;                // e.g. 'audio-reference' (matches check-category name)
  message: string;                 // human-readable, includes the specific bad value
  file?: string;                   // e.g. 'aa_gametiles.txt'
  line?: number;                   // 1-based
  column?: string;                 // column name, e.g. 'AudioName'
  context?: Record<string, unknown>; // optional structured payload for machine consumers
}

export interface ValidationReport {
  issues: Issue[];
  counts: { error: number; warning: number; info: number; total: number };
  ok: boolean;                     // counts.error === 0
}
```

Decision: **`code` field is a stable string ID.** Golden-file tests assert on `code` + count, not on message wording (which may evolve). Golden files can ignore messages; they must match codes. A full list of codes lives at `libs/shared/util-lang-pack-validator/src/issueCodes.ts` for discoverability + ad-hoc reference.

Decision: **`category` is the check-function name segment** (e.g. `file-presence`). Callers can group by category for reporting.

Decision: **`context` is optional structured payload** for downstream tooling (future IDE integration). CLI human-readable report ignores it.

### D3. `fileInventory` is a plain listing

```ts
export interface FileInventory {
  fonts: string[];             // basenames of ttf files under languages/<code>/fonts/
  avatars: string[];           // basenames under images/avatars/
  avataricons: string[];
  wordImages: string[];        // basenames under images/words/
  tileImages: string[];        // basenames under images/tiles/
  tileAudio: string[];         // basenames under audio/tiles/
  wordAudio: string[];         // basenames under audio/words/
  syllableAudio: string[];     // basenames under audio/syllables/
  instructionAudio: string[];  // basenames under audio/instructions/
  // Optional:
  icon?: string;               // if images/icon.png exists
  splash?: string;             // if images/splash.png exists
}
```

Decision: **basenames without extension, to match the `audioName` / image-key convention in `aa_*.txt`.** The CLI collects the listing by walking `languages/<code>/` and stripping extensions. Tests mock the inventory directly.

Decision: **the lib does not walk the filesystem.** Inventory is an input. Keeps the lib pure, Node-free, testable. The CLI wrapper does the walking.

### D4. Check inventory (full list)

Each check lives in `src/checks/<name>.ts` as one exported function returning `Issue[]`. Check set derived from `Validator.java`:

| File | Corresponds to (Java) | Summary |
|------|------------------------|---------|
| `checkFilePresence.ts` | `FilePresence.java` + parts of `validateResourceSubfolders` | required `aa_*.txt`, TTFs, 12+12 avatars, icon/splash optional |
| `checkWordlistCharacters.ts` | `validateGoogleSheet` wordlist block | LWC col matches `[a-z0-9_]+`; LOP-col chars in keyboard; flag words with spaces |
| `checkKeyboardCoherence.ts` | Same block | keyboard colors in colorList; every LOP-char is a keyboard key (or substring of one) |
| `checkTileWordCrossRef.ts` | `validateGoogleSheet` gametiles+wordlist cross-ref | every word's LOP parses into known tiles via Java-faithful `parseWordIntoTiles` (including complex-script handling); word tile count 3..15; tile usage counts (each tile used ≥ `NUM_TIMES_TILES_WANTED_IN_WORDS`) as recommendations |
| `checkTileStructure.ts` | gametiles structure block | type ∈ `{C, PC, V, X, D, AD, AV, BV, FV, LV, T, SAD}`; alternates (cols 1–3) are known tiles; upper-case column consistency (proper-case-only vs full-upper-case-only); no tile has the same value in more than one of (base, alt1, alt2, alt3) |
| `checkStageCoherence.ts` | `StagesChecks.java` | compute cumulative tile set per stage 1..7; per-word correspondence ratio ≥ `stageCorrespondenceRatio`; respect `First letter stage correspondence` + `Stage 1-2 max word length`; flag stages with 0 words; per-stage word+tile counts as info issues |
| `checkAudioReferences.ts` | `checkAudioPresence` loop + orphan scan | every tile/word/syllable `audioName` has a file in the matching `fileInventory` subcategory; orphan mp3s (files not referenced) as warnings |
| `checkImageReferences.ts` | `checkImagePresence` loop + orphan scan | every wordlist LWC entry has `<word>.png`; `<word>2.png` optional; orphan pngs as warnings; tile images optional |
| `checkColorReferences.ts` | color reference block | keyboard color indices within `colorList.length`; tile col-12 color index valid; game col-3 color index valid |
| `checkGameStructure.ts` | games tab block | `Country` ∈ known game-class names; `ChallengeLevel` integer; `SyllOrTile` ∈ {`T`, `S`} (parser already enforces, validator re-checks for completeness); `Door` unique and sequential; `InstructionAudio` is a real file or reserved token; `AudioDuration` is integer |
| `checkDuplicates.ts` | `checkColForDuplicates` invocations | duplicate tile keys (col 0 of gametiles); duplicate word keys; duplicate syllable keys; duplicate game doors; duplicate color indices |
| `checkLangInfoRequired.ts` | langinfo validation | required labels present; `Script direction` ∈ {`LTR`, `RTL`}; `Script type` ∈ {`Roman`, `Arabic`, `Devanagari`, `Khmer`, `Lao`, `Thai`}; game name length ≤ 30 (Play Store limit) — warning not error; Ethnologue code matches `[a-z]{3}` |
| `checkSettingsTypes.ts` | settings-cast block | boolean settings have `TRUE`/`FALSE`-ish value; int settings parse as int; `Stage correspondence ratio` in [0, 1]; `Has tile audio` is boolean |
| `checkSyllablesCoherence.ts` | `validateSyllablesTab` (conditional) | triggered when `shouldCheckSyllables(parsed)` returns true (6+ words contain `.`, matches Java `decideIfSyllablesAttempted`); otherwise skipped |

Decision: **each check file is independently testable.** A test feeds in a synthesized `ParsedPack` fragment (minimal) + `FileInventory` and asserts the `Issue[]` return. Full-fixture tests run the whole pipeline end-to-end.

Decision: **check order is fixed but independent.** Reordering check-function calls in `validateLangPack.ts` must not change the report (except for issue-list ordering, which is not semantically meaningful — tests normalize by sorting on `code, file, line`).

### D5. Java-faithful tile parsing (`parseWordIntoTiles`)

The Java `TileList.parseWordIntoTiles(word)` has non-trivial logic: it tries to match the longest tile prefix, recurses, handles complex-script splicing for Thai/Lao/Arabic/Devanagari/Khmer, respects `placeholderCharacter`, and may return `null` if no valid parse exists.

Decision: **port `parseWordIntoTiles` into `libs/shared/util-phoneme` as a separate utility**, not inside the validator. The runtime engine also needs it (for scoring, stages, game mechanics). Duplicating it inside the validator would guarantee drift.

Decision: **`util-phoneme` is scaffolded as part of this change** (not a separate one) because the validator needs it and no other consumer does yet. When the engine lands, it imports the same function. The lib is `type:util`, `scope:shared`, depends only on the parsed `TileList` + `ScriptType` + `placeholderCharacter`.

Alternative considered: **put it in the validator and factor out later.** Rejected — duplication risk is high and the phoneme logic is stable enough to land once and reuse.

### D6. CLI wrapper

`tools/validate-lang-pack.ts` (replaces the placeholder introduced by `port-foundations`):

```ts
#!/usr/bin/env bun
import { validateLangPack } from '@alphaTiles/util-lang-pack-validator';
import { readRawFiles } from './_readRawFiles';
import { buildFileInventory } from './_buildFileInventory';
import { formatReportHuman, formatReportJson } from '@alphaTiles/util-lang-pack-validator';

const args = parseArgs(process.argv);
const codes = args.fixture ?? [process.env.APP_LANG];
let totalErrors = 0;
for (const code of codes) {
  const rawFiles = readRawFiles(`languages/${code}`);
  const fileInventory = buildFileInventory(`languages/${code}`);
  const report = validateLangPack({ rawFiles, fileInventory });
  if (args.json) writeJson(args.json, code, report);
  else console.log(formatReportHuman(code, report));
  totalErrors += report.counts.error;
}
process.exit(totalErrors > 0 ? 1 : 0);
```

Decision: **CLI uses `bun`** (same tooling choice as `port-foundations`); `node --loader tsx` fallback documented.

Decision: **`--fixture` accepts comma-separated codes** so CI can run `bun tools/validate-lang-pack.ts --fixture eng,tpx,template` in one process. Reduces per-pack startup overhead.

Decision: **human-readable format groups by severity then category**, with totals at the bottom. JSON format is the structured `ValidationReport` plus the pack code.

### D7. Golden-file tests

```
libs/shared/util-lang-pack-validator/src/__tests__/
  fixtures-eng.test.ts
  fixtures-tpx.test.ts
  fixtures-template.test.ts
  golden/
    eng.codes.json      // e.g. { "error": [], "warning": ["ORPHAN_AUDIO:laugh"], "info": [...] }
    tpx.codes.json
    template.codes.json
```

Decision: **golden files assert on `code` lists, not full messages.** Tests pass when the set of codes (by severity) matches. Message-text evolution doesn't break the test; new defects do.

Decision: **committed golden files represent the expected state of the fixture packs.** If a fixture legitimately evolves, the golden file updates in the same PR. If a fixture is broken, the validator report reveals the break; fix the fixture, not the test.

Decision: **no snapshot-diffing** (Jest's `toMatchSnapshot`). Explicit JSON files are diffable in PRs; snapshots are opaque.

### D8. Per-check unit tests

Each check gets synthetic-input tests independent of fixture packs:

```ts
// src/checks/__tests__/checkDuplicates.test.ts
it('flags duplicate tile keys', () => {
  const parsed = mkParsed({ tiles: mkTileRows([{ base: 'a' }, { base: 'a' }]) });
  const issues = checkDuplicates(parsed);
  expect(issues).toContainEqual(expect.objectContaining({
    code: 'DUPLICATE_TILE_KEY',
    severity: 'error',
    context: expect.objectContaining({ key: 'a' }),
  }));
});
```

Decision: **`mkParsed()` / `mkTileRows()` helpers in `src/__tests__/testHelpers.ts`** provide minimally-valid parsed-pack fragments. Each helper fills in sensible defaults for unspecified fields so tests don't drown in boilerplate.

Decision: **per-check tests cover the positive-case (issue emitted) and the negative-case (no issue when input is clean).** Branch coverage is not a release gate, but every enumerated `code` has at least one positive test.

### D9. Phoneme library as sibling change? → Included here

Decision already stated in D5. One more note: the phoneme lib ships with its own tests driven by the same fixtures. Check-function `checkTileWordCrossRef` uses it; the runtime engine (future) will too. Putting it in this change keeps the validator PR fully self-sufficient (no dangling "please add X before merging").

### D10. Pipeline integration

`apps/alphaTiles/project.json`:

```json
"validate-lang-pack": {
  "executor": "nx:run-commands",
  "options": { "command": "bun tools/validate-lang-pack.ts" },
  "dependsOn": ["rsync-lang-pack"]
}
```

No change from `port-foundations` except the command now invokes the real validator. The `dependsOn` chain is unchanged.

Decision: **exit code on warning-only reports is 0.** CI treats warnings as non-blocking; engineers review them in the log. Errors fail the build.

Decision: **in CI, an additional step runs `--fixture eng,tpx,template`** in isolation from the active-pack build, ensuring non-active packs stay green too. This catches "I fixed my pack but broke the other fixtures" regressions early.

## Risks / Trade-offs

- **[Risk]** A fixture pack we ship (`languages/eng/`) has latent defects that the Java validator also flags. Porting the full validator exposes them. **Mitigation**: run the validator against all three fixture packs during dev; fix or document every error or warning before landing the change. Accept the possibility that this change includes content-pack fixes upstream in `PublicLanguageAssets`.
- **[Risk]** Java↔TS semantic drift in edge cases (integer overflow, `Boolean.parseBoolean` case sensitivity, `String.split` regex vs `split('\t')` behavior). **Mitigation**: per-check tests include pathological inputs (`split('\t')` on `"a\t\tb"` behaves as `['a', '', 'b']` — assert this explicitly). Any divergence is a documented deviation.
- **[Risk]** Phoneme library extracted-as-utility needs to faithfully reproduce Java's `parseWordIntoTiles`, which has multi-hundred-line recursive logic. **Mitigation**: the phoneme port has its own golden-file tests per script type (Roman, Arabic, Thai, Lao, Devanagari, Khmer). Fixtures include one word per script that exercises each branch.
- **[Risk]** Full-pack validation on every PR adds CI time. **Mitigation**: validator is pure; no network, no heavy compute. Expected <5s for 3 packs. If it grows, parallelize per-fixture.
- **[Risk]** "Did you mean ...?" Levenshtein suggestions are non-trivial to port faithfully (Java's `wordDistance` uses char-level DP; trivial in TS). **Mitigation**: port the algorithm verbatim; include a unit test with known input/output pairs. Low risk.
- **[Trade-off]** Error / warning severity is a judgment call where Java differs from TS port; a few packs may be more/less strict. **Accepted**: severity choice is documented in each check's header comment. If a real pack-shipping regression surfaces, we adjust severity in a follow-up PR.
- **[Trade-off]** Golden-file tests require per-fixture maintenance. **Accepted**: fixture packs change rarely; golden updates are small.
- **[Trade-off]** CLI vs lib duplication — the CLI has file-walking logic the lib never sees. **Accepted**: clean separation keeps the lib pure. The CLI is ~100 lines including arg parsing; negligible.
- **[Trade-off]** Phoneme library scaffolded in this change rather than a separate one. **Accepted**: the validator and the (future) engine both need it; no consumer gets blocked by the extraction timing.

## Migration Plan

1. Scaffold `libs/shared/util-lang-pack-validator` and `libs/shared/util-phoneme`.
2. Port `util-phoneme`'s `parseWordIntoTiles` (plus supporting `parseWordIntoTilesPreliminary` for the China 3–4-tile check). Unit tests against real words from each script type.
3. Implement `Issue`, `ValidationReport`, `validateLangPack` skeleton, `issueCodes.ts` with the full enum.
4. Port each check category in this order (simplest first, to build up reuse):
   1. `checkFilePresence` (direct translation of `FilePresence.java`)
   2. `checkDuplicates`
   3. `checkColorReferences`
   4. `checkLangInfoRequired`
   5. `checkSettingsTypes`
   6. `checkKeyboardCoherence`
   7. `checkWordlistCharacters`
   8. `checkTileStructure`
   9. `checkGameStructure`
   10. `checkAudioReferences`
   11. `checkImageReferences`
   12. `checkTileWordCrossRef` (needs phoneme lib)
   13. `checkStageCoherence` (needs `checkTileWordCrossRef` output + StagesChecks port)
   14. `checkSyllablesCoherence` (conditional — skipped on packs without syllables)
5. Write per-check unit tests alongside each check.
6. Replace `tools/validate-lang-pack.ts` placeholder with the real CLI.
7. Run validator against each of `eng`, `tpx`, `template` fixtures; fix or document all errors + warnings.
8. Commit golden-file snapshots; wire `nx test util-lang-pack-validator` to assert against them.
9. Update `apps/alphaTiles/project.json` — no command change, but update the target description.
10. Update `docs/ARCHITECTURE.md` §4 to note that validation is now the full port (one-line edit).

Rollback: revert the commit. Placeholder returns. The library is isolated enough that removing it has no cross-cutting blast radius.

## Open Questions

- **Run validator on native-code changes too, or gate it on content-relevant file changes?** Tentative: always run in CI. It's fast.
- **Publish `util-lang-pack-validator` as an npm package so the content repo can consume it?** Not v1. Revisit when the content team has a local-validation workflow request.
- **Should the report include a "gold standard" severity-threshold config (e.g. `.validator.json` in each pack)?** Defer. Every fixture pack passes with zero errors right now; no one has asked for per-pack severity overrides.
- **How to handle Java validator's interactive "Click to fix" UI?** Not ported. Issues include suggestion strings but do not self-apply.
