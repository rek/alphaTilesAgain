## Context

Java/Android source (`Start.java` lines 250–900) reads each `aa_*.txt` file with a `Scanner`, splits each line on `\t`, indexes columns positionally, and populates typed list classes (`TileList`, `WordList`, `SyllableList`, `KeyList`, `GameList`, `LangInfoList`, `SettingsList`, `ColorList`). The column layout of each file is stable across all shipped packs (engEnglish4, tpxTeocuitlapa, templateTemplate) — the first row is a header, subsequent rows are records, and every pack respects the same column order.

Real packs (`/home/adam/dev/alphaTilesAgain/PublicLanguageAssets/engEnglish4/res/raw/aa_*.txt`) confirm this: `aa_gametiles.txt` has 17 columns headed `tiles / Or1 / Or2 / Or3 / Type / AudioName / Upper / Type2 / AudioName2 / Type3 / AudioName3 / Placeholder / Placeholder / Placeholder / FirstAppearsInStage / FirstAppearsInStage(Type2) / FirstAppearsInStage(Type3)`. `aa_langinfo.txt` is a two-column `Item \t Answer` table with canonical Item labels. `aa_settings.txt` is the same shape. `aa_wordlist.txt` has 6 columns. `aa_games.txt` has 8. `aa_colors.txt` has 3. `aa_keyboard.txt` has 2. `aa_syllables.txt` has 7. `aa_names.txt`, `aa_resources.txt`, `aa_share.txt` are tiny.

`port-foundations` already bundles the raw `.txt` contents as string literals under `langManifest.rawFiles['aa_gametiles']` etc. Downstream consumers need typed domain models, not raw strings.

### Required reading for implementers

- `AGENTS.md` — entry doc; read first.
- `openspec/AGENT_PROTOCOL.md` — pickup protocol.
- `docs/ARCHITECTURE.md` §3 (library taxonomy — this lib is `type:util, scope:shared`), §5 (pack shape), §10 (testing — pure-logic lib, unit tests required per ADR-010).
- `docs/decisions/ADR-008-full-validator-port.md` (context for the parser/validator split).
- **Upstream OpenSpec changes:** none runtime — batch 1 peer of `port-foundations`. Parser does NOT import from `port-foundations`; it only relies on the raw-string convention that manifest establishes.
- **Source Java files being ported** (absolute paths):
  - `../AlphaTiles/app/src/main/java/org/alphatilesapps/alphatiles/Start.java` (lines ~250–900) — the `Scanner`-based readers for every `aa_*.txt`; column indices must match exactly.
  - `../AlphaTiles/app/src/main/java/org/alphatilesapps/alphatiles/TileList.java`, `WordList.java`, `SyllableList.java`, `KeyList.java`, `GameList.java`, `LangInfoList.java`, `SettingsList.java`, `ColorList.java` — the typed list classes whose fields the TS types mirror.
- **Fixture paths** (absolute, under `../PublicLanguageAssets/`):
  - `../PublicLanguageAssets/engEnglish4/res/raw/aa_gametiles.txt` (17-col reference).
  - `../PublicLanguageAssets/engEnglish4/res/raw/aa_wordlist.txt` (6-col reference).
  - `../PublicLanguageAssets/engEnglish4/res/raw/aa_syllables.txt` (7-col).
  - `../PublicLanguageAssets/engEnglish4/res/raw/aa_games.txt` (8-col).
  - `../PublicLanguageAssets/engEnglish4/res/raw/aa_colors.txt`, `aa_keyboard.txt`, `aa_langinfo.txt`, `aa_settings.txt`, `aa_names.txt`, `aa_resources.txt`, `aa_share.txt`.
  - `../PublicLanguageAssets/tpxTeocuitlapa/res/raw/aa_*.txt` — diacritics-heavy parity fixture.
  - `../PublicLanguageAssets/templateTemplate/res/raw/aa_*.txt` — minimal shape fixture.

## Goals / Non-Goals

**Goals:**

- One pure function per `aa_*.txt` file, signature `(src: string) => TypedResult`. Callable under Node, Metro, and Jest without extra setup.
- Faithful column layout: column indices match `Start.java` exactly, documented inline next to every extraction.
- Tolerant of cosmetic variance: trailing blank lines, trailing tab-separated empty columns, leftover CRLF (in case rsync didn't normalize), leading/trailing whitespace inside cells (stripped per Java behavior).
- Strict on structural breaks: missing required column → throw `LangPackParseError` with file name, line number, expected-vs-got column count.
- Zero runtime dependencies. Zero React imports. Zero Node-stdlib imports (`fs`, `path`, `crypto` banned). Just string operations.
- Types inferred from return shapes — no hand-maintained type file.
- Library root `index.ts` is the only barrel; individual source files export one function each.

**Non-Goals:**

- Semantic validation (cross-file references, duplicate detection, stage coherence). That's `lang-pack-validator`.
- Resolving string keys to bundled assets (`audio.tiles['a']` → `require()` number). That's `lang-assets-runtime`.
- Writing `aa_*.txt` files. This is read-only.
- Parsing the content of the `FirstAppearsInStage` columns beyond "parse as int, else 1" — the Java source clamps out-of-range values to 1, we preserve that.
- Handling pack dialect variance (future packs with extra columns) — if a future pack adds columns, extend the parser explicitly. No speculative "extra columns allowed" escape hatch.

## Decisions

### D1. One function per file, matching filename

Every `aa_X.txt` gets a corresponding `parseX.ts` exporting `parseX`:

```ts
// libs/shared/util-lang-pack-parser/src/parseGametiles.ts
import { LangPackParseError } from './LangPackParseError';
import { splitLines } from './internal/splitLines';
import { splitRow } from './internal/splitRow';

export function parseGametiles(src: string) {
  const lines = splitLines(src);
  if (lines.length === 0) throw new LangPackParseError({ file: 'aa_gametiles.txt', line: 0, expected: 17, got: 0 });
  const header = splitRow(lines[0], 17, 'aa_gametiles.txt', 1);
  const tiles = lines.slice(1).map((line, i) => {
    const row = splitRow(line, 17, 'aa_gametiles.txt', i + 2);
    return {
      base: row[0],            // col 0 — tiles
      alt1: row[1],            // col 1 — Or1 (distractor 1)
      alt2: row[2],            // col 2 — Or2
      alt3: row[3],            // col 3 — Or3
      type: row[4],            // col 4 — primary tile type (V/C/PC/…)
      audioName: row[5],       // col 5 — primary audio name
      upper: row[6],           // col 6 — upper-case form
      tileTypeB: row[7],       // col 7 — second type, 'none' if absent
      audioForTileB: row[8],   // col 8
      tileTypeC: row[9],       // col 9 — third type
      audioForTileC: row[10],  // col 10
      iconicWord: row[11],     // col 11
      // cols 12–13 are documented 'Placeholder' (unused in Start.java; kept for faithfulness)
      tileColor: row[12],
      stageOfFirstAppearance: parseStageIntOrOne(row[14]),   // col 14
      stageOfFirstAppearanceType2: parseStageIntOrOne(row[15]), // col 15
      stageOfFirstAppearanceType3: parseStageIntOrOne(row[16]), // col 16
    };
  });
  return { headers: header, tiles };
}
```

Decision: **column indices are documented inline as `// col N — <header name>`.** The `Start.java` reference is linked in the module-level JSDoc. Future column-count changes must update both the number and the comment in the same commit.

Decision: **no barrel files except `src/index.ts`.** Matches project-wide one-function-per-file rule. `parseGametiles` lives in `parseGametiles.ts`, not `parsers/index.ts`.

Alternatives considered:

- **One big `parsePack()` function** — rejected: a god function makes column-level changes diff-noisy and consumer tests awkward. Per-file functions compose into `parsePack()` trivially.
- **Generated parser from a schema file** — rejected: the Java reference is hand-written; auto-generation adds build-time surface area for an ~11-file port that's stable.

### D2. No `zod` / no schema library

Considered adding `zod` for per-row validation. Rejected because:

- It would be the first runtime dep in a pure-string-ops library. Breaks the "zero deps" invariant, which matters because this library ships into both the Metro bundle and the CLI validator.
- The structural validation we need is trivial: column count match, integer parse, enum membership. Hand-written validation is ~10 lines per parser and keeps bundle weight zero.
- Semantic validation (which would benefit from `zod`'s compositional API) lives in the separate validator library, where a richer API may be warranted — but that's a decision for that library's design.

**Decision: pure string ops + manual column-count + integer checks. No schema library.**

### D3. `LangPackParseError` — structured throw

Single error class:

```ts
export class LangPackParseError extends Error {
  readonly file: string;
  readonly line: number;    // 1-based, header = line 1
  readonly expected: number;  // expected column count
  readonly got: number;     // actual column count
  readonly column?: string; // column name when the error is about a specific field
  readonly reason?: string; // short human hint — 'integer expected', 'unknown tile type'
  constructor(fields: { file: string; line: number; expected?: number; got?: number; column?: string; reason?: string; }) { … }
}
```

Decision: **parser throws on structural defects; it does not accumulate errors.** This is opposite of the validator's design — the validator *must* accumulate because its output is a report. The parser is a pre-req for every other consumer; if it fails, nothing else can run, so fail-fast with a specific error is the cleaner contract.

Decision: **structured error fields, not string parsing.** Consumers (validator, CLI, runtime error boundary) format errors themselves; they don't reverse-engineer a message string.

### D4. Tolerance rules

- **Trailing blank lines**: ignored. Any line that's empty or whitespace-only after CRLF strip is skipped, regardless of position.
- **CRLF**: `splitLines` accepts `\r\n`, `\r`, `\n`. Per-cell trailing `\r` stripped.
- **Trailing empty columns**: if the header declares N columns and a data row has N-1 with no trailing tab, treat as parse error (data was truncated). If the row has trailing empty cells (`…\t\t`) such that `split('\t').length === N`, accept.
- **Whitespace inside cells**: preserved as-is except for leading/trailing (trimmed) per `Start.java` Java-`Scanner` behavior for tokens that pass through `ArrayList<String> distractors`.
- **Blank cells**: preserved as empty strings; it's the semantic validator's job to flag "missing required value."
- **Repeated header**: if a line matching the header appears inside the data region, treat as a data row. Don't attempt header-recovery heuristics.

### D5. `parsePack(rawFiles)` aggregator

Convenience function for runtime and validator consumers:

```ts
export function parsePack(rawFiles: Record<string, string>) {
  return {
    tiles: parseGametiles(rawFiles['aa_gametiles']),
    words: parseWordlist(rawFiles['aa_wordlist']),
    syllables: parseSyllables(rawFiles['aa_syllables']),
    keys: parseKeyboard(rawFiles['aa_keyboard']),
    games: parseGames(rawFiles['aa_games']),
    langInfo: parseLangInfo(rawFiles['aa_langinfo']),
    settings: parseSettings(rawFiles['aa_settings']),
    names: parseNames(rawFiles['aa_names']),
    resources: parseResources(rawFiles['aa_resources']),
    colors: parseColors(rawFiles['aa_colors']),
    share: parseShare(rawFiles['aa_share']),
  };
}
```

Decision: **`parsePack` is a flat wrapper — no extra behavior, no error accumulation.** Any parse error propagates. The shape is static — file codes are hard-coded, not discovered. This keeps the return type stable for type inference.

Decision: **rawFiles key convention matches `langManifest.rawFiles` keys verbatim** (no extension, no path). Keeps runtime wiring a one-liner: `parsePack(langManifest.rawFiles)`.

### D6. `aa_langinfo.txt` — label-keyed, not index-keyed

Inspection of `aa_langinfo.txt` shows 15 items labeled `1. Lang Name (In Local Lang)`, `2. Lang Name (In English)`, …, `14. Audio and image credits (lang 2)`, `15.` (often blank). Java reads by label via `langInfoList.find(label)`.

Decision: **`parseLangInfo` returns a map keyed by *normalized* label (the numeric prefix and trailing whitespace stripped).** Accessors use `info.find('Lang Name (In Local Lang)')` — consistent with Java behavior. The full 15-item mapping is preserved; order is preserved via a `Map`-like iteration, but lookup is by label. No positional access.

Rationale: packs occasionally renumber or skip a slot, and future packs may add fields. Label-keyed access is forward-compatible; index-keyed access would break on any renumber.

### D7. `aa_settings.txt` — strings, not casting

Settings values in the raw file are strings that *look like* booleans (`TRUE`, `FALSE`), integers (`12`, `99`), floats (`0.75`). Java casts at each call site (`Boolean.parseBoolean(settingsList.find(...))`, `Integer.parseInt(...)`).

Decision: **parser keeps all values as strings.** Cast at call site, matching Java. Rationale: the same setting key can be consumed as bool in one place and string in another (e.g. `"After 12 checked trackers"` is "3" but semantically it's a count — different consumers want different types). Pre-casting forces a loss.

Consumers (validator, runtime) get a typed `SettingsList` with `.find(label): string` and a convenience `.findBoolean(label, default)` / `.findInt(label, default)` / `.findFloat(label, default)` that does the Java-style parse. These live on the returned object as pure functions, implemented once.

### D8. `aa_colors.txt` — third column is the hex value

Header is `Game Color Number \t Color Name \t Hex Code`. Java's `buildColorList()` pushes `thisLineArray[2]` (the hex) into a flat `ArrayList<String>` and indexes by row order (the `Color Name` column is cosmetic). We preserve that: `parseColors` returns `{ rows: Array<{ id, name, hex }>, hexByIndex: string[] }`. The `hexByIndex` exposes the Java-flat-list behavior; `rows` exposes the full record for future consumers (the validator wants the name).

### D9. `aa_share.txt` — single-cell link

Two lines: a header `Link` and a single data row with one cell. `parseShare(src)` returns `string`. No wrapper object — the file contains exactly one value.

### D10. Fixture-driven tests, no mocking

Decision: **tests use real fixture strings from `languages/eng/`, `languages/tpx/`, `languages/template/`**. Fixtures are read at jest test-setup time from `languages/<code>/aa_*.txt`; if `languages/` isn't populated (fresh clone before first `rsync-lang-pack`), the parser tests are skipped with a warning, not failed. Rationale: this library is a port of a file-format reader — synthetic fixtures don't exercise the edge cases real packs do (trailing empty cells, quirky Item labels, CRLF remnants).

A small inline string constant exercises the error-case scenarios (wrong column count, non-integer stage, etc.) — those are synthetic and fast.

## Risks / Trade-offs

- **[Risk]** A future pack ships with extra trailing columns Java-style (permissive via `split("\t")`). Our strict column count would reject. **Mitigation**: if the row has *more* columns than expected and the extras are empty (`…\t\t\t`), accept. If the extras are non-empty, reject — that's new data the parser hasn't been updated to handle. Documented in D4.
- **[Risk]** A pack with a blank line in the *middle* of the data (not just trailing). **Mitigation**: blank lines always skipped. Documented in D4.
- **[Risk]** CRLF content sneaking past `rsync-lang-packs.ts` normalization. **Mitigation**: parser handles both line endings. Defence in depth.
- **[Risk]** `parseLangInfo` label collisions if a future pack has two items with the same label after normalization. **Mitigation**: `parseLangInfo` throws `LangPackParseError` on duplicate label (as if the file were structurally broken). Documented.
- **[Trade-off]** Inline column indices (`// col 14 — FirstAppearsInStage`) are brittle to header reordering. **Accepted**: the Java reference uses positional indices too; reordering would be a pack-format breaking change that triggers validator and parser updates together.
- **[Trade-off]** No lazy parsing — `parsePack` eagerly runs every parser. **Accepted**: the biggest `aa_wordlist.txt` is ~500 rows; total parse time is <10ms. Lazy evaluation would add API surface area for no measurable gain.
- **[Trade-off]** Parser throws synchronously; validator accumulates. Different contracts for structurally-similar work. **Accepted**: different consumers. Parser is boot-critical (can't proceed with a half-parsed pack); validator is a report generator.

## Migration Plan

1. Scaffold `libs/shared/util-lang-pack-parser` with NX generator.
2. Implement `internal/splitLines.ts` and `internal/splitRow.ts` helpers + `LangPackParseError.ts` + per-file parsers in this order (smallest first for confidence): `parseShare`, `parseColors`, `parseKeyboard`, `parseNames`, `parseResources`, `parseSyllables`, `parseGames`, `parseLangInfo`, `parseSettings`, `parseWordlist`, `parseGametiles`.
3. Write per-parser unit tests alongside each implementation, against real fixtures. Start with `parseColors` and `parseLangInfo` as smoke tests; they reveal the test-fixture plumbing before tackling complex parsers.
4. Implement `parsePack` as a one-liner aggregator after all per-file parsers pass.
5. Delete `tools/_lang-pack-mini-parser.ts` (from `port-foundations`). Update `tools/rsync-lang-packs.ts` and `apps/alphaTiles/app.config.ts` to use `parseLangInfo` from this library.
6. Add library root `src/index.ts` barrel re-exporting every parser + `LangPackParseError` + `parsePack`.
7. Verify `nx test util-lang-pack-parser` passes against `languages/eng/` and `languages/tpx/`.

Rollback: revert the commit. `port-foundations` mini-parser comes back (preserved in git).

## Open Questions

- `aa_names.txt` in engEnglish4 is empty (header only, no rows). Does an empty table parse to `[]` or should that be a parse error? **Tentative: empty is valid (`{ rows: [] }`); validator flags "avatar name list is empty" as a warning if the pack has avatars but no names.**
- Should `parseGames.ts` validate that the `Country` column is one of the known game class names (Brazil, China, Chile, …)? **Tentative: no — the parser only checks structural parseability; the validator enumerates the known class names. Keeps parser dep-free of the game-class registry.**
- Should `parseSettings` warn on unknown setting labels? **No — unknown labels are fine; Java-style `find(label)` returns empty string for absent labels; validator reports unused/unknown labels.**
