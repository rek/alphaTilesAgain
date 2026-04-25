# AI Development Workflow

Uses **OpenSpec** ([github.com/Fission-AI/OpenSpec](https://github.com/Fission-AI/OpenSpec)) for spec-driven development — specs agreed before code is written.

## Setup

```sh
npm install -g @fission-ai/openspec@latest
openspec init   # run once in project root
```

## Core Workflow

### 1. Propose

```
/opsx:propose [feature-name]
```

Creates `openspec/changes/[feature-name]/` with:
- `proposal.md` — rationale and scope
- `specs/` — requirements and scenarios
- `design.md` — technical approach (NX libraries to create, component structure, data flow)
- `tasks.md` — implementation checklist

Review all four artifacts before proceeding. Update `design.md` if you see issues — it's the source of truth.

### 2. Apply

```
/opsx:apply
```

AI works through `tasks.md` systematically. Redirect if it drifts: "Follow `openspec/changes/[feature-name]/design.md`."

One task at a time. Test and commit after each.

### 3. Archive

```
/opsx:archive
```

Moves completed feature to `openspec/changes/archive/[date-feature-name]/`.

---

## Other Commands

| Command | Purpose |
| ------- | ------- |
| `/opsx:new` | Start fresh spec |
| `/opsx:continue` | Resume in-progress work |
| `/opsx:verify` | Validate implementation against spec |
| `/opsx:sync` | Sync spec with code changes |

---

## Finding Active Work

```sh
ls openspec/changes/          # active feature specs
ls openspec/changes/archive/  # completed features
```

---

## Common Prompts

### New game feature library

Before proposing, read `docs/GAME_PATTERNS.md` and the most recent archived game's `design.md` under `openspec/changes/archive/`. The patterns file is the baseline — a new spec should be at least as detailed as the exemplar.

```
Generate a feature library for the [name] literacy game in alphaTiles scope.

Read docs/GAME_PATTERNS.md first — use it as the structural baseline for design.md and tasks.md.

1. Create: libs/alphaTiles/feature-[name]
   Tags: "type:feature,scope:alphaTiles"
2. Can import from: ui (ui-tile, ui-game-board), data-access (data-word-list), util
3. Create [Name]Container as container, [Name]Screen as presenter
4. Container owns useTranslation + game state — presenter accepts pre-translated strings + tile data
5. design.md must include: Java→TS mapping table, challenge-level decoding, precompute plan (if needed), Container/Presenter split detail
6. tasks.md must follow the standard group structure in GAME_PATTERNS.md
```

### New UI component library

```
Create a UI component library for [name] in shared scope.

1. Create: libs/shared/ui-[name]
   Tags: "type:ui,scope:shared"
2. Can ONLY import from: util
3. Pure presentational — no business logic, no data fetching, no react-i18next
4. Accept pre-translated strings as props
5. Must support custom fonts (minority language characters)
```

### New data-access library

```
Set up a data-access library for [domain] in alphaTiles scope.

1. Create: libs/alphaTiles/data-[name]
   Tags: "type:data-access,scope:alphaTiles"
2. Can ONLY import from: util
3. Functions: load/parse community asset files, manage [domain] state
```

### Architecture decision

```
We need to decide [topic]. Create an ADR in /docs/decisions/ using docs/decisions/_TEMPLATE.md.
Cover: context, options considered, recommendation with pros/cons.
```

### Debugging

```
[Describe issue + repro steps]

Debug systematically:
1. Identify likely cause
2. Check [file path]
3. Propose fix and explain why it works
```

### Refactoring

```
Refactor [component/module].

1. Document current behavior
2. Identify what to improve
3. Plan steps
4. Ensure tests exist before changing code
```

---

## Quality Checklist

Before archiving, verify:

- [ ] Implementation matches `openspec/changes/[feature-name]/design.md`
- [ ] All `tasks.md` items checked
- [ ] NX dependency rules not violated (`nx graph`)
- [ ] TypeScript compiles: `npx tsc --noEmit`
- [ ] Lint passes: `nx affected:lint`
- [ ] Tests pass: `nx affected:test`
- [ ] Tested on iOS, Android, and web
- [ ] Edge cases and error/loading states handled
- [ ] Commits follow conventional commits format
- [ ] i18n: no hardcoded English strings in JSX (use t())
- [ ] i18n: no hardcoded English a11y labels
- [ ] Language assets: tile/word data comes from community asset loader, not hardcoded
- [ ] Custom fonts: minority language characters render correctly

---

## Example: Complete Feature (NX Monorepo)

Building "Tile Match" game (show letter tiles, player taps matching pairs, score tracks correct matches):

**Phase 1 — Propose:**
```
/opsx:propose tile-match-game
```

Review generated `openspec/changes/tile-match-game/design.md`. Should specify:
- `libs/alphaTiles/feature-tile-match` — game screen, match logic container
- `libs/alphaTiles/data-word-list` — word/tile data from community assets
- `libs/shared/ui-tile` — letter/syllable tile component (if not exists)
- `libs/shared/ui-game-board` — board layout (if not exists)
- `libs/alphaTiles/util-phoneme` — phoneme comparison logic (pure)

**Phase 2 — Apply:**
```
/opsx:apply
```

Tasks ordered by dependency: util first, then ui, then data-access, then feature.

**Phase 4 — Verify:**
```
/opsx:verify
```

Then: `./nx affected:test && ./nx graph` to confirm deps are clean.
