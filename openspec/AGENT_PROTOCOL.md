# OpenSpec Agent Protocol

How to pick up, implement, validate, and archive an OpenSpec change in this repo. Read `AGENTS.md` first.

## Tooling

All commands assume working dir = repo root.

- `openspec status --all` — list every in-flight change and its progress
- `openspec status --change <name> --json` — structured status + `applyRequires` + artifact status
- `openspec validate <name>` — structural validation (proposal/design/specs/tasks exist + parse)
- `openspec validate <name> --strict` — strict mode (enforces requirement/scenario format)
- `openspec new change <name>` — scaffold a new change
- `openspec list changes` — same as `openspec status --all` summary
- `openspec archive <name>` — move to `openspec/changes/archive/<date-name>/`

Slash-commands (from `.claude/commands/opsx/`):

- `/opsx:propose <name>` — propose a new change (auto-generates artifacts)
- `/opsx:explore` — think-through mode for a nascent idea
- `/opsx:apply` — work through the ready change's `tasks.md`
- `/opsx:archive` — archive a completed change

## Dependency chart (snapshot, maintain in `AGENTS.md`)

16 foundational changes + 17 concrete games (full Java roster) **merged + implemented** as of 2026-04-26.

```
✓ port-foundations        — build pipeline, docs, util-precompute skeleton
✓ lang-pack-parser        — pure TS aa_*.txt parsers
✓ analytics-abstraction   — no-op interface + event catalog
✓ lang-pack-validator     — depends on parser
✓ lang-assets-runtime     — depends on parser + port-foundations (util-precompute)
✓ audio-system            — expo-audio wrapper
✓ theme-fonts             — palette + typography + fonts loader
✓ i18n-foundation         — i18next w/ chrome + content namespaces
✓ storybook-setup         — composite storybook host
✓ player-profiles         — choose/set player, zustand+persist
✓ about-share-resources-screens — info screens
✓ ota-updates             — EAS Update plumbing
✓ game-engine-base        — GameActivity abstraction
✓ loading-screen          — boot orchestration
✓ game-menu               — Earth.java door grid
✓ game-china              — sliding-tile puzzle (4×4 + image strip)
✓ game-peru               — 4-choice word recognition
✓ game-brazil             — find-the-missing-tile (vowels/consonants/tones/syllables)
✓ game-italy              — Lotería 4×4 bingo
✓ game-myanmar            — 7×7 word search
✓ game-colombia           — build-the-word with live yellow/orange/gray/green feedback
✓ game-ecuador            — 8-tile scatter word matching
✓ game-georgia            — first-sound identification (12 tile + 6 syllable CLs)
✓ game-iraq               — non-scored 5×7 tile explorer
✓ game-malaysia           — non-scored 11/page word browser
✓ game-sudan              — non-scored tile/syllable audio browser
✓ game-chile              — Phonemic Wordle (CL→guess rows)
✓ game-japan              — syllable-segmentation with link buttons (landscape-only)
✓ game-mexico             — Memory matching pairs
✓ game-romania            — scanning / focus-tile word sequence (NO_TRACKER)
✓ game-thailand           — 4-choice identification (3-digit XYZ CL, 8 TYPES)
✓ game-united-states      — pairing + spelling
```

**Active changes**: none. All 17 games + foundational + deploy + landing-page are archived.

**Non-game backlog** (in `openspec/changes/`, awaiting prioritization): analytics-firebase, app-store-metadata, ci-per-language-builds, crash-reporting, e2e-tests-maestro, font-scaling-accessibility, haptics-feedback, lang-pack-downloader, onboarding-tutorial, performance-bundle-analysis, player-stats-screen, scorebar-hud-fidelity, storybook-visual-regression, tablet-layout, web-platform-parity.

New changes go through `/opsx:propose` → `/opsx:apply` → `/opsx:archive`.

## Pickup protocol

When assigned or picking up a change `<name>`:

1. **Confirm readiness.** `openspec status --change <name> --json` — every `applyRequires` artifact must be `done`. Upstream changes listed in `design.md` Context section must be **merged** (not just in-progress).
2. **Read the change** in order: `proposal.md` → `design.md` → `specs/*/spec.md` → `tasks.md`.
3. **Read required repo docs** (from `AGENTS.md`): `CLAUDE.md`, `docs/ARCHITECTURE.md`, relevant `docs/decisions/ADR-*`.
4. **Read source** — every design.md Context section names the Java source files being ported; open them.
5. **Read fixtures** — engEnglish4 / tpxTeocuitlapa / templateTemplate under `../PublicLanguageAssets/` for ground truth about pack shape.
6. **Plan** — internally map tasks to patches. Group `0. Preflight` is the reading checklist; don't skip.

## Implementation loop

For each task group in `tasks.md`:

1. Read any additional source files named in the group's tasks.
2. Implement the tasks in order (tasks within a group may depend on earlier ones).
3. Run the relevant unit tests (`nx test <lib>`) — pure-logic libs only per ADR-010.
4. Type-check (`npx tsc --noEmit --project <lib>`).
5. Flip each `- [ ]` to `- [x]` in `tasks.md` **only after the task is verified**, not speculatively.
6. Commit with conventional-commit subject: `<type>(<change-name>): <subject>`. Granularity: one commit per task group is a reasonable default; per-task commits for large groups.
7. Move to next group.

## Validation gates

A change is "implementable-done" when:

- Every `- [ ]` in `tasks.md` is `- [x]`.
- `openspec validate <name>` exits 0.
- `npx tsc --noEmit` across workspace is clean.
- `nx affected:lint` clean.
- `nx affected:test` passes (only the libs with tests run per ADR-010).
- For UI changes: manual smoke tested on iOS + Android + web (or explicitly noted).
- PR description references the change's proposal.

## Archiving

After the PR merges:

1. `openspec archive <name>` (or `/opsx:archive`). Moves `openspec/changes/<name>/` → `openspec/changes/archive/<date>-<name>/`.
2. If the change introduced new capabilities, OpenSpec moves their specs to `openspec/specs/<capability>/spec.md` automatically. Modified capabilities get their deltas applied.
3. Update the Dependency chart in `AGENTS.md` and this file if order / readiness shifted.
4. **If this is a `game-*` change:** update `docs/GAME_PATTERNS.md` with anything the implementation revealed — shell API gaps found, challenge-level decoding added, patterns that diverged from the standard, edge cases hit. Add the game to the "Latest entry" line at the top.
5. **If pending game specs exist and are now more informed by this implementation:** open each pending `game-*/design.md` and enrich it using the new patterns. Thin specs (< 3 KB design.md) should be treated as drafts, not final.
6. Push archive commit to main.

## When you hit ambiguity

Architecture ambiguity is NOT an implementation detail — escalate. Path:

1. Check `docs/decisions/ADR-*.md` — a past decision may answer it.
2. Grep `../AlphaTiles/` source — the Java behavior often answers it.
3. If still unresolved, add the question to the change's `design.md` under `## Open Questions` and surface to the user. Do not guess.

## Cross-change contract changes mid-implementation

Sometimes implementing change A reveals that upstream change B's spec needs a tweak. Options:

- **Small tweak** — add a note in B's archive (if archived) or B's design.md Open Questions (if in-flight). Note the delta in A's PR description.
- **Breaking tweak** — stop implementing A, propose a new `<B-adjust>` change that modifies B's capability, land that first, resume A.

Never silently drift. Cross-change contracts must be re-spec'd, not implemented-around.
