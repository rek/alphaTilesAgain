# Project Overview

**AlphaTiles** — literacy game generator for minority language communities.

A language community provides a folder of asset files (word lists, phoneme/syllable data, images, audio recordings). AlphaTiles loads those assets and generates a mobile app full of tile-based literacy games in that language. Rebuilds the [original Android AlphaTiles app](http://alphatilesapps.org/) in Expo + React Native, adding iOS and web support.

## Setup

See **[Getting Started](./GETTING_STARTED.md)** — install deps, run dev server, configure tools.

## How We Work

Spec-driven development with **OpenSpec** — specs agreed before code is written.

```sh
npm install -g @fission-ai/openspec@latest
# openspec init already done
```

### Feature Workflow

1. **Propose** — `/opsx:propose [feature-name]` → generates proposal, specs, design, tasks in `openspec/changes/[feature-name]/`
2. **Apply** — `/opsx:apply` → implements tasks from the checklist
3. **Archive** — `/opsx:archive` → moves completed feature to `openspec/changes/archive/`

Full workflow: **[AI Workflow Guide](./AI_WORKFLOW.md)**

## Apps

- **alphaTiles** (`apps/alphaTiles`) — the literacy game app

## Architecture

NX monorepo with strict dependency rules between library types.

| Library Type | Can Import | Purpose |
| ------------ | ---------- | ------- |
| `feature` | ui, data-access, util | Game screens, business logic |
| `ui` | util only | Presentational components (tiles, boards) |
| `data-access` | util only | Language asset loading, state |
| `util` | nothing | Pure functions (phoneme logic, scoring) |

Libraries: `libs/{scope}/{type}-{name}` — scope is `alphaTiles` or `shared`. App is a thin shell.

### Domain Library Examples

```
libs/
  alphaTiles/
    feature-tile-match/        # tile matching game
    feature-word-build/        # word building game
    feature-listen-tap/        # listen and tap game
    data-language-assets/      # load + parse community asset folder
    data-word-list/            # word list management and state
    util-phoneme/              # phoneme/syllable logic
    util-scoring/              # score calculation

  shared/
    ui-tile/                   # letter/syllable tile component
    ui-game-board/             # game board layout
    util-i18n/                 # i18n infrastructure (UI strings + language support)
    util-theme/                # theme system
```

Full details: **[Project Organization](./PROJECT_ORGANIZATION.md)**

## Key Commands

| Command | Description |
| ------- | ----------- |
| `./nx start alphaTiles` | Metro bundler |
| `./nx serve alphaTiles` | Web dev server |
| `./nx run-android alphaTiles` | Android |
| `./nx run-ios alphaTiles` | iOS |
| `./nx affected:test` | Test changed code only |
| `./nx graph` | Dependency graph |
| `./nx show projects` | List all projects |

### Creating New Libraries

```sh
# Game feature
./nx g @nx/react-native:lib feature-tile-match \
  --directory=libs/alphaTiles/feature-tile-match \
  --tags='type:feature,scope:alphaTiles'

# Shared UI component
./nx g @nx/js:lib ui-tile \
  --directory=libs/shared/ui-tile \
  --tags='type:ui,scope:shared'

# Language data
./nx g @nx/react-native:lib data-language-assets \
  --directory=libs/alphaTiles/data-language-assets \
  --tags='type:data-access,scope:alphaTiles'
```

## i18n

i18n serves two purposes here:
1. **UI strings** — menus, instructions, labels (in the minority language and/or a major language like English or Spanish)
2. **Game content** — letters, syllables, words, audio from community asset files

Both go through the i18n/asset loading layer. Special considerations: custom fonts for minority language characters, potential RTL support, non-Latin scripts.

## Reference Docs

- **[Code Style](./CODE_STYLE.md)** — TypeScript and React Native standards
- **[Commit Conventions](./COMMIT_CONVENTIONS.md)** — Git message format
- **[Project Organization](./PROJECT_ORGANIZATION.md)** — NX library types, dependency rules
- **[Getting Started](./GETTING_STARTED.md)** — setup and commands
- **[Troubleshooting](./TROUBLESHOOTING.md)**
