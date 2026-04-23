In all interactions and commit messages, be extremely concise and sacrifice grammar for the sake of concision.

AlphaTiles — literacy game generator for minority language communities. Expo + React Native + TypeScript NX monorepo. Spec-driven dev with OpenSpec.

A language community provides a folder of assets (word lists, phoneme data, images, audio). The app loads those assets and generates tile-based literacy games in that language.

## References

Read these before writing code:

- **[Architecture](./docs/ARCHITECTURE.md)** — stable overview; read before touching any code
- **[Decisions](./docs/decisions/)** — ADR-001–010; skim titles, read relevant in full
- **[Code Style](./docs/CODE_STYLE.md)** — always follow
- **[Project Organization](./docs/PROJECT_ORGANIZATION.md)** — NX library types, dependency rules, tagging
- **[AI Workflow](./docs/AI_WORKFLOW.md)** — OpenSpec workflow, prompt templates, quality checklist
- **[Commit Conventions](./docs/COMMIT_CONVENTIONS.md)** — `<type>(<scope>): <subject>`
- **[Getting Started](./docs/GETTING_STARTED.md)** — setup, commands, builds
- **Templates:** [Design docs](./docs/designs/_TEMPLATE.md) | [ADRs](./docs/decisions/_TEMPLATE.md)

## Rules

- Design before coding — use `/opsx:propose` for non-trivial features; `design.md` is source of truth
- At end of each plan, give a concise list of unresolved questions
- Apps are shells — all features in `libs/`
- Library pattern: `libs/{scope}/{type}-{name}` (scope: `alphaTiles` | `shared`)
- Dependency rules: app→feature, feature→ui/data-access/util, ui→util, data-access→util, util→nothing
- One function per file, no barrel files (except library root `index.ts`)
- No separate type files — infer with `ReturnType`, `Parameters`, `typeof`
- No direct `useEffect` — use derived state, handlers, `useMountEffect`, or `key`
- `type:ui` components must not import `react-i18next` — accept pre-translated strings as props
- Container/presenter split: container owns hooks + i18n, presenter is pure props→JSX
- i18n covers both UI strings AND game content (minority language characters, fonts, direction)
