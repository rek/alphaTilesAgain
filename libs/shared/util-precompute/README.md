# util-precompute

Per-class precompute registry. Feature libs register a precompute function at
module-import time; the lang-assets runtime calls `runPrecomputes` once after
the pack loads. Results are stored in `LangAssets.precomputes`.

**Note:** `LangAssets` is now the real type (imported type-only from
`@alphaTiles/data-language-pack`), replacing the `unknown` forward reference
from `port-foundations`. See `lang-assets-runtime` design.md §D5.

## API

```ts
import { registerPrecompute, runPrecomputes } from '@shared/util-precompute';

// Feature lib (top-level):
registerPrecompute('chile', (assets) => buildChileData(assets));

// Boot (inside loadLangPack):
const precomputes = runPrecomputes(assets);

// Hook (moved to @alphaTiles/data-language-assets — design §D7):
import { usePrecompute } from '@alphaTiles/data-language-assets';
const chileData = usePrecompute<ChileData>('chile');
```

## Changes in lang-assets-runtime

- `LangAssets = unknown` replaced with real type from `@alphaTiles/data-language-pack`.
- `PrecomputeProvider` removed — precomputes fold into `LangAssets.precomputes`.
- `usePrecompute` moved to `@alphaTiles/data-language-assets` to avoid circular deps.

## Building

Run `nx build util-precompute` to build the library.

## Running unit tests

Run `nx test util-precompute` to execute the unit tests via [Jest](https://jestjs.io).
