---
name: full-review
description: "Comprehensive AlphaTiles code audit across 10 dimensions: NX deps, container/presenter split, hook rules, game patterns, TypeScript, i18n, a11y, styles, file org, plus game QA checklist. Use when: full audit, arch review, pre-PR review, game implementation review."
argument-hint: "[feature-name | path] (optional — defaults to changes vs main)"
---

## Instructions

Structured audit of AlphaTiles code. Follow every step in order. Do not skip mechanical checks.

Bash tool calls in Claude Code do not share shell state — assume each `Bash` invocation is a fresh shell. Don't rely on variables set in earlier blocks. When a step needs a previously-computed file list, pipe it in via `xargs` or paste the resolved paths inline.

---

### Step 0 — Load Docs

Read in order before reviewing any code:

1. `docs/ARCHITECTURE.md`
2. `docs/CODE_STYLE.md`
3. `docs/PROJECT_ORGANIZATION.md`
4. `docs/GAME_PATTERNS.md`

If `$ARGUMENTS` matches `feature-game-*` or names a game, also locate and read its design doc:
```bash
[ -n "$ARGUMENTS" ] && find openspec/changes -name "design.md" -path "*${ARGUMENTS}*" 2>/dev/null
```

---

### Step 1 — Resolve Scope

Run **one** of the following based on `$ARGUMENTS`.

**With argument** (path or feature name):
```bash
find libs apps -path "*${ARGUMENTS}*" \( -name "*.ts" -o -name "*.tsx" \) \
  -not -path "*/node_modules/*" -not -name "*.test.*" -not -name "*.stories.*" \
  | sort
```

**No argument** (compare against main, fall back to working tree):
```bash
{ git diff main...HEAD --name-only 2>/dev/null; git diff HEAD --name-only; git diff --cached --name-only; } \
  | sort -u | grep -E "\.(ts|tsx)$" | grep -v node_modules
```

Print the file list. Save it as the **review scope** for later steps. If empty, ask user which path to review. If > 40 files, ask user to narrow.

For greps in later steps: when scope is path-bound, run greps against that path; when scope is a diff list, pass paths via `xargs` (`<previous command> | xargs grep -n PATTERN`).

---

### Step 2 — Mechanical Checks

Run all three. Report PASS / FAIL per check; quote first 30 lines of any failure.

```bash
# TypeScript across the workspace
npx tsc --noEmit -p tsconfig.base.json 2>&1 | head -40
```

```bash
# Lint — runs @nx/enforce-module-boundaries plus eslint rules.
# This is also our NX boundary check (no separate `nx graph` step needed).
nx affected --target=lint 2>&1 | tail -40
```

```bash
# Tests on affected projects
nx affected --target=test 2>&1 | tail -20
```

If `$ARGUMENTS` is a project name, replace `affected` with `run <project>:lint` / `run <project>:test`.

---

### Step 3 — Dimension Review

For each file in scope, audit every dimension. Report:

`[BLOCKER|WARN|NOTE] path/to/file.tsx:LINE — description`

- **BLOCKER** — must fix before merge
- **WARN** — should fix
- **NOTE** — nice to have

---

#### D1 — NX Dependency Rules

Rules:
- `apps/alphaTiles/` → `type:feature` only
- `type:feature` → `type:ui`, `type:data-access`, `type:util`
- `type:ui` → `type:util` only
- `type:data-access` → `type:util` only
- `type:util` → nothing local
- `type:tooling` → never imported by other libs

```bash
# react-i18next inside any ui lib (BLOCKER)
grep -rn --include="*.ts" --include="*.tsx" "react-i18next" libs/*/ui-* libs/shared/ui-* 2>/dev/null

# feature/data-access imports inside ui libs (BLOCKER)
grep -rn --include="*.ts" --include="*.tsx" -E "from ['\"][^'\"]*(feature-|data-)" libs/*/ui-* libs/shared/ui-* 2>/dev/null

# expo-router in ui libs (BLOCKER — navigation belongs in feature/container)
grep -rn --include="*.ts" --include="*.tsx" "expo-router" libs/*/ui-* libs/shared/ui-* 2>/dev/null
```

Spot-check `project.json` `tags` arrays match each lib's directory pattern (`libs/{scope}/{type}-{name}`).

---

#### D2 — Container / Presenter Split

**Container** (`*Container.tsx`, `*Screen.tsx`): owns hooks, `useTranslation`, zustand stores, navigation, callbacks. Passes plain data + strings + callbacks down.

**Presenter** (`*View.tsx`, `*Presenter.tsx`): pure props → JSX. May use `useTheme` and `StyleSheet`. Zero data hooks. Zero `useTranslation`. Zero navigation.

```bash
# Find presenter files, then check forbidden imports/calls inside them
find libs apps \( -name "*View.tsx" -o -name "*Presenter.tsx" \) \
  -not -path "*/node_modules/*" -not -name "*.stories.*" \
  | xargs grep -nE "useTranslation|useRouter|useNavigation|useLocalSearchParams|useStore|^.*= create\(" 2>/dev/null
```

---

#### D3 — Hook Rules (no raw useEffect)

`useEffect` is **FORBIDDEN** outside `useMountEffect.ts` and `useShell*.ts` files.

```bash
# All useEffect hits, excluding the legitimate hosts and tests
grep -rn --include="*.ts" --include="*.tsx" "useEffect(" libs apps \
  | grep -v "useMountEffect\.ts\|useShell[A-Z][a-zA-Z]*\.ts\|\.test\.\|\.stories\."
```

Each remaining hit = **BLOCKER**.

```bash
# `shell` from useGameShell() in a dep array (BLOCKER per GAME_PATTERNS.md)
grep -rn --include="*.ts" --include="*.tsx" -E "\[[^]]*\bshell\b[^]]*\]" libs apps \
  | grep -v "useShell\|\.test\."
```

State-sync via effect (`useEffect(() => setX(deriveFrom(y)), [y])`) — manual scan; flag any hit as BLOCKER and recommend derived state.

---

#### D4 — Game Shell Hooks (game libs only)

Skip if scope is not under `libs/alphaTiles/feature-game-*`.

Game containers must use `useShellWord`, `useShellAdvance`, `useShellRepeat` — not raw shell subscriptions.

```bash
# Direct shell.* property access inside callbacks/effects (suspicious)
grep -rn --include="*.ts" --include="*.tsx" -E "\bshell\.(word|advance|repeat|tracker)" libs/alphaTiles/feature-game-*
```

Verify by reading the container:
- **Round init** uses `useMountEffect` or key-reset, not effect watching round count.
- **Completion** fires from a tap handler, NOT from `useEffect` watching progress.
- **Audio chains** guard each async step with `if (!isMountedRef.current) return`.

---

#### D5 — Precompute Pattern (game libs only)

```bash
grep -rn --include="*.ts" --include="*.tsx" "registerPrecompute\|usePrecompute" libs/alphaTiles
```

Verify:
- `registerPrecompute(...)` called at module scope (top of file, not inside a function).
- Precompute fn imports no React, has no side effects, accepts an optional `rng`.
- Per-round picking lives in container `useMemo`, not inside the precompute fn.

---

#### D6 — TypeScript Hygiene

```bash
# any usage (BLOCKER each, except eslint-disable + tests)
grep -rn --include="*.ts" --include="*.tsx" -E ":\s*any\b|\bas any\b" libs apps \
  | grep -v "eslint-disable\|\.test\.\|\.stories\."

# interface (WARN unless ErrorBoundary class component)
grep -rn --include="*.ts" --include="*.tsx" -E "^(export )?interface " libs apps

# Separate type files (WARN — derive instead)
find libs apps \( -name "*.types.ts" -o -name "types.ts" \) -not -path "*/node_modules/*"
```

Discriminated-union check: scan game data-access/util fns for error returns. Required shape `{ data: T } | { error: 'reason' }` — never throw, never bare `null`.

---

#### D7 — i18n & Hardcoded Strings

```bash
# Hardcoded English in JSX text — heuristic: ">Word lower" pattern, then manually verify
grep -rn --include="*.tsx" -E ">[A-Z][a-z]+\s[a-z]" libs apps \
  | grep -v "//\|import\|export\|t(\|\.stories\."

# Hardcoded English in accessibilityLabel
grep -rn --include="*.tsx" -E 'accessibilityLabel=("[A-Z][a-z]|\{["\x27][A-Z][a-z])' libs apps

# t() called inside ui libs (BLOCKER — ui libs must be i18n-blind)
grep -rn --include="*.ts" --include="*.tsx" -E "\bt\(['\"]" libs/*/ui-* libs/shared/ui-* \
  | grep -v "\.test\.\|\.stories\."
```

The first regex is a heuristic — manually verify each hit before flagging.

---

#### D8 — Accessibility

```bash
# All Pressable/TouchableOpacity sites
grep -rn --include="*.tsx" "Pressable\|TouchableOpacity" libs apps
```

For each hit, open the file and confirm the JSX block has both:
- `accessibilityLabel={...}` (i18n'd, non-empty)
- `accessibilityRole="..."`

Missing on a primary game interaction (tile press, answer select, advance) = **BLOCKER**. Missing elsewhere = **WARN**.

---

#### D9 — Styles & Layout

```bash
# Inline style objects (BLOCKER outside Storybook decorators)
grep -rn --include="*.tsx" "style={{" libs apps \
  | grep -v "\.stories\.\|decorators\|Storybook"

# Physical margin/padding props (WARN — RTL needs marginStart/marginEnd)
grep -rn --include="*.ts" --include="*.tsx" -E "\b(margin|padding)(Left|Right)\b" libs apps \
  | grep -v "\.test\."

# Unicode glyph icons (WARN — use SVG)
grep -rn --include="*.tsx" -E "['\"\>](←|→|↑|↓|✓|✗|★)" libs apps
```

---

#### D10 — File Organization

The rule is **one function/component per file**, not "one export per file" — a component exporting its `type Props` alongside is fine.

```bash
# More than one top-level component/function export per file (BLOCKER)
while IFS= read -r f; do
  count=$(grep -cE "^export (function|const) [A-Z]" "$f")
  [ "$count" -gt 1 ] && echo "$f: $count component exports"
done < <(find libs apps \( -name "*.ts" -o -name "*.tsx" \) \
  -not -path "*/node_modules/*" -not -name "index.ts" \
  -not -name "*.test.*" -not -name "*.stories.*")
```

```bash
# Barrel files — only allowed at src/index.ts of a lib
find libs -name "index.ts" -not -path "*/node_modules/*" \
  | grep -v "/src/index\.ts$"
```

Naming check (manual): components PascalCase, hooks `use*` camelCase, utils camelCase, tests `*.test.{ts,tsx}`.

---

### Step 4 — Game QA Checklist (game libs only)

Skip if not `feature-game-*`. Mark each STATIC (verified from code) or DEVICE (needs runtime).

- [ ] **Round init** — first round builds without crash on mount (STATIC)
- [ ] **Completion** — `incrementPointsAndTracker(N)` fires from event handler not effect (STATIC)
- [ ] **Score N** — N matches design.md D2 challenge-level table (STATIC)
- [ ] **Celebration** — 12 correct completions reach `celebrationActive` (STATIC)
- [ ] **Audio replay** — repeat tap re-fires audio via `useShellRepeat` (STATIC)
- [ ] **Insufficient content** — `{ error: 'insufficient-content' }` path renders friendly message (STATIC)
- [ ] **All challengeLevel variants** — switch/if covers every documented level, no fallthrough throw (STATIC)
- [ ] **RTL safety** — no `marginLeft`/`paddingLeft` hardcodes (STATIC, see D9)
- [ ] **Hardware back** — returns to Earth, not crash (DEVICE)
- [ ] **12-round full run** — every variant completes (DEVICE)

---

### Step 5 — Summary Report

Output exactly this format:

```
## AlphaTiles Review — <scope> — <YYYY-MM-DD>

### Mechanical
- TypeScript: PASS / FAIL
- Lint:       PASS / FAIL
- Tests:      PASS / FAIL / N/A

### Issue Counts
| Dim | Topic                  | BLOCKER | WARN | NOTE |
|-----|------------------------|---------|------|------|
| D1  | NX deps                |         |      |      |
| D2  | Container/Presenter    |         |      |      |
| D3  | Hook rules             |         |      |      |
| D4  | Shell hooks (game)     |         |      |      |
| D5  | Precompute (game)      |         |      |      |
| D6  | TypeScript             |         |      |      |
| D7  | i18n                   |         |      |      |
| D8  | A11y                   |         |      |      |
| D9  | Styles                 |         |      |      |
| D10 | File org               |         |      |      |

### All BLOCKERs
- [file:line — description]

### All WARNs
- [file:line — description]

### Verdict
SHIP    — 0 blockers, 0 warns
CLEAN   — 0 blockers, warns only
BLOCKED — has blockers
```
