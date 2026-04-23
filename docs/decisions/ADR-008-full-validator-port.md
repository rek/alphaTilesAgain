# ADR-008: Full Validator Port

**Date**: 2026-04-23
**Status**: Accepted

## Context

The Java/Android original ships a ~3800-line validator (`Validator.java` + `FilePresence.java` + `StagesChecks.java` + `Message.java`) that runs over a language pack to catch every conceivable defect: missing files, mismatched references, malformed tab-delimited rows, audio keys that don't match tile keys, stages that advance past the wordlist, tile types inconsistent with script direction, and so on. Hundreds of check types.

Language-pack authorship is done by linguists and community partners, not engineers. Bad packs are the **number one failure mode** observed in the Android product — a missing image, a misspelled column, a stages file that references a deleted word. These failures are invisible until the app crashes mid-gameplay on the user's device.

The port has two options: carry the validator forward, or lean on runtime defensive checks. This ADR resolves that.

## Decision

Port the **full** Java validator to TypeScript as `libs/shared/util-lang-pack-validator`. Not a subset, not a rewrite — the full check set, faithful to the original.

- Library type: `util`, scope: `shared`. Pure functions, no side effects, no React deps.
- Consumers: prebuild (gates the build — see ADR-001), CI (runs against all pack fixtures on every engine-repo PR), future content-repo CI (linguists validate locally before PR).
- Output: structured `{ errors: Issue[]; warnings: Issue[]; info: Issue[] }`. Errors fail the build; warnings print.
- Same pack fixtures (`languages/eng/`, `languages/tpx/`, `languages/template/`) drive both the validator's own unit tests and the integration gate.

## Rationale

The validator is the load-bearing trust boundary. Every downstream assumption — "the manifest keys match the data files," "every audio key has a file," "every word has an image or is explicitly opt-out" — rests on the validator. If we trust the validator, we can trust the engine to treat assets as structurally correct. That lets engine code be straightforward: read the field, use it, no defensive branches for every possible misalignment.

Porting faithfully (as opposed to reinterpreting) preserves the body of hard-earned knowledge encoded over years of real-world language-pack failures. Every check in there exists because some pack, somewhere, shipped broken in that specific way.

### Pros

- Engine code becomes simpler — no per-field defensive checks.
- Linguists catch errors locally, before PR, same as Android today.
- Confidence to iterate the engine — a content regression can't reach users through the validator gate.
- Cross-platform (the validator runs in Node) — no JVM dependency for content authors who are using the new tooling.
- TypeScript port opens the door to better IDE integration (VS Code extension, in-editor squiggles on `aa_*.txt` files — future work, not v1).

### Cons

- Large up-front investment — porting ~3800 lines with fidelity, plus tests.
- Two validators during the transition window (Java original for legacy Android, TS port for this repo) unless/until the Java one is retired.
- Validator divergence is a maintenance risk — if Android landspace adds a new check, the TS port must track it (and vice versa).

## Alternatives Considered

### Alternative 1: Skip validation

Trust pack authors; fail at runtime when things go wrong.

- **Why not**: Directly contradicts the Android experience. Bad packs are the dominant failure mode and runtime failures reach end users.

### Alternative 2: Runtime-only validation (partial)

Add defensive checks in the engine at each asset-use site.

- **Why not**: Scatters validation across dozens of feature libs. No single place to update when a new pack format is added. No pre-flight gate — errors still reach users. Worse ergonomics for content authors (wait for a device crash to learn what's wrong).

### Alternative 3: Minimal structural checks only

Port a small subset — required files present, tab counts match headers — and skip the deep semantic ones (stages coherence, tile/audio cross-refs).

- **Why not**: The deep checks are exactly the ones that catch subtle breakages. A minimal validator would miss most of the real-world failures the full one catches. Small porting savings for a large confidence loss.

### Alternative 4: Keep using the Java validator externally

Linguists run the old JAR; engine repo assumes it's been run.

- **Why not**: External tool friction for contributors. No integration into this repo's CI. No way to fail a build that skipped the step. The trust boundary is weakened to "we hope it was validated."

## Consequences

### Positive

- Prebuild pipeline (ADR-001, ADR-003) can assume validated pack shape.
- Manifest generator (ADR-003) does not need to defend against missing / malformed assets.
- Every engine PR's CI runs the validator against all fixture packs — a regression in, say, audio handling is caught before merge.
- Content-repo CI (future) can import the published validator package for local checks.

### Negative

- Significant work. Scoped as its own OpenSpec change.
- Port fidelity is a per-check exercise; review burden is high.
- Java↔TS translation traps (integer overflow behavior, default encodings, string comparison locale) must be checked case by case.

### Neutral

- `libs/shared/util-lang-pack-validator` is `type:util`, `scope:shared` — importable by any scope.
- Unit tests live next to the source, driven by the pack fixtures.
- Publishable as an npm package later if the content repo wants it.

## Implementation Notes

- Port unit by unit, mirroring the Java file structure:
  - `validator.ts` (entry, orchestration)
  - `filePresence.ts` (file-existence checks)
  - `stagesChecks.ts` (stages-coherence checks)
  - `message.ts` (issue structure, severity, formatting)
- Preserve Java method names as TS function names where it aids cross-referencing the original.
- Issue structure:
  ```ts
  type Issue = {
    severity: 'error' | 'warning' | 'info';
    code: string;      // e.g. 'MISSING_AUDIO_FILE'
    message: string;
    file?: string;
    line?: number;
    column?: string;
  };
  ```
- Test strategy:
  - Golden-file tests per fixture pack: expected issue list is committed; validator runs, output is diffed.
  - Per-check unit tests with minimal synthetic inputs.
- CLI wrapper: `bun validate languages/eng` prints a human-readable report, exits non-zero on errors.
- Prebuild integrates: rsync → validator → manifest. Validator errors abort before manifest generation.
- Java source of truth: `../AlphaTiles/app/src/main/java/org/alphatilesapps/alphatiles/Validator*.java`. Keep that path referenced in the library README for future drift audits.

## References

- `docs/ARCHITECTURE.md` §4 (prebuild sequence), §15 (testing)
- Java source: `../AlphaTiles/app/src/main/java/org/alphatilesapps/alphatiles/`
- ADR-001 (per-language build mechanism) — prebuild gates
- ADR-002 (language pack sourcing) — what the validator reads
- ADR-003 (asset bundling via generated manifest) — downstream consumer that trusts validator output
- ADR-010 (testing) — unit tests + fixture-driven golden tests
