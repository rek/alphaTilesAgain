# Project Organization

NX monorepo with React Native / Expo + TypeScript. Follows [NX best practices](https://nx.dev/docs/concepts/decisions/project-dependency-rules).

## Core Principle

**Apps are shells.** All features live in libraries.

## Structure

```
apps/
  alphaTiles/                  # App shell — routing and config only
    app/                       # expo-router file-based routing
    src/                       # app-level bootstrap (providers, i18n init)
    assets/
    app.json
    metro.config.js
    project.json

libs/
  alphaTiles/                  # App-specific libraries
    feature-[name]/            # Smart components, business logic
    data-[name]/               # State, storage, data fetching
    util-[name]/               # Pure functions, helpers

  shared/                      # Cross-app libraries
    ui-[name]/                 # Presentational components
    util-[name]/               # Shared utilities, hooks
    util-i18n/                 # i18n infrastructure
    util-theme/                # Theme system

locales/                       # Translation files (at workspace root)
  en.json
  [lang].json
```

## Library Types

| Type | NX tag | Purpose | Can import |
| ---- | ------- | ------- | ---------- |
| `feature` | `type:feature` | Screens, business logic, containers | ui, data-access, util |
| `ui` | `type:ui` | Presentational components, design system | util only |
| `data-access` | `type:data-access` | API calls, storage, state hooks | util only |
| `util` | `type:util` | Pure functions, helpers, constants | nothing |

## Dependency Rules

NX enforces these with ESLint `@nx/enforce-module-boundaries`.

```
[app]
  ↓
[feature]  →  [ui]  →  [util]
           →  [data-access]  →  [util]
           →  [util]
```

| Layer | Allowed imports |
| ----- | --------------- |
| `type:app` | `type:feature` only |
| `type:feature` | `type:ui`, `type:data-access`, `type:util` |
| `type:ui` | `type:util` only |
| `type:data-access` | `type:util` only |
| `type:util` | nothing |

**`type:ui` cannot import `react-i18next`** — accept pre-translated strings as props. Callers in feature libs pass `t()` values.

## Scopes

- `scope:alphaTiles` — libraries specific to the alphaTiles app
- `scope:shared` — usable by any app

## Library Naming

```
libs/{scope}/{type}-{name}
```

Examples:
- `libs/alphaTiles/feature-game` — game screen + container
- `libs/alphaTiles/data-scores` — score persistence
- `libs/alphaTiles/util-tiles` — tile logic (pure)
- `libs/shared/ui-components` — design system components
- `libs/shared/util-i18n` — i18n infrastructure
- `libs/shared/util-hooks` — shared custom hooks

## Import Paths

Defined in `tsconfig.base.json`. Each library exports from its `src/index.ts`.

```typescript
import { GameScreen } from '@alphaTiles/feature-game';
import { Button } from '@shared/ui-components';
import { formatScore } from '@alphaTiles/util-tiles';
```

## Container / Presenter Pattern

Every feature screen uses this split.

**Container** (`[Feature]Container.tsx` or `[Feature]Screen.tsx`):
- Owns all hooks: `useRouter`, `useTranslation`, data hooks
- Handles loading / error early returns
- Passes data + translated strings + callbacks to presenter

**Presenter** (`[Feature].tsx`):
- Pure props → JSX only
- May use `useTheme` / `StyleSheet`
- Must NOT import `useTranslation`, `useRouter`, or data hooks
- Fully testable with mock props, no providers needed

```typescript
// libs/alphaTiles/feature-tile-match/src/lib/TileMatchContainer.tsx
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useWordList } from '@alphaTiles/data-word-list';
import { TileMatchScreen } from './TileMatchScreen';

export function TileMatchContainer() {
  const router = useRouter();
  const { t } = useTranslation();
  const { tiles, score, loading } = useWordList();
  if (loading) return <LoadingView />;
  return (
    <TileMatchScreen
      tiles={tiles}
      score={score}
      title={t('games.tileMatch.title')}
      onBack={() => router.back()}
    />
  );
}
```

```typescript
// libs/alphaTiles/feature-tile-match/src/lib/TileMatchScreen.tsx
import { Tile } from '@alphaTiles/data-word-list';
import { GameBoard } from '@shared/ui-game-board';
import { TileCell } from '@shared/ui-tile';

export function TileMatchScreen({ tiles, score, title, onBack }: {
  tiles: Tile[];
  score: number;
  title: string;
  onBack: () => void;
}) { ... }
```

## i18n Rules

- **Containers** own `useTranslation` — call `t()` and pass strings down as props
- **Presenters and `ui` libs** accept pre-translated strings — never import `react-i18next`
- **Hardcoded English strings in JSX = bug** — always use `t()` via container
- **Hardcoded English a11y labels = bug** — `accessibilityLabel={t('a11y.tile', { letter })}`
- Translation files live in `locales/[lang].json` at workspace root
- Supported locales config lives in `libs/shared/util-i18n`

## App Shell Rules

`apps/alphaTiles/app/` contains only:
- `_layout.tsx` files (root layout, tab bar, stack config)
- Screen files that import a feature container and export it as default

```typescript
// apps/alphaTiles/app/(tabs)/game.tsx
import { GameContainer } from '@alphaTiles/feature-game';
export default GameContainer;
```

`apps/alphaTiles/` must NOT contain business logic, components, or state.

## Domain Library Examples

```
libs/
  alphaTiles/
    feature-tile-match/      # tile matching game screen + logic
    feature-word-build/      # word building game
    feature-listen-tap/      # listen and tap game
    data-language-assets/    # load + parse community asset folder (word lists, audio, images)
    data-word-list/          # word list state management
    util-phoneme/            # phoneme/syllable pure logic
    util-scoring/            # score calculation

  shared/
    ui-tile/                 # letter/syllable tile component (pure presentational)
    ui-game-board/           # game board layout
    util-i18n/               # i18n infrastructure, locale config
    util-theme/              # theme system, typography for custom fonts
    util-hooks/              # shared custom hooks (useMountEffect, etc.)
```

## Creating Libraries

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

# Pure logic
./nx g @nx/js:lib util-phoneme \
  --directory=libs/alphaTiles/util-phoneme \
  --tags='type:util,scope:alphaTiles'
```

## Key Commands

```sh
nx start alphaTiles          # Metro bundler
nx serve alphaTiles          # Web dev server
nx run-android alphaTiles    # Android
nx run-ios alphaTiles        # iOS
nx affected:test             # Test changed code only
nx graph                     # Dependency graph
nx show projects             # List all projects
nx show project <name>       # Show targets for a project
```

## Feature-Based Testing

Tests co-located with code. Run only affected: `nx affected:test`.

| Library type | Test type |
| ------------ | --------- |
| `util` | Unit tests |
| `data-access` | Unit tests (mock external deps) |
| `ui` | Component tests (React Native Testing Library) |
| `feature` | Integration tests (mock data-access) |
