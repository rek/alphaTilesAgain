## MODIFIED Requirements

### Requirement: Per-class precompute registry

The port SHALL provide a registry (`libs/shared/util-precompute`) that lets feature libraries register a precompute function at module-import time. Registered functions SHALL be executed once, after the language pack is loaded, against the loaded asset state. Results SHALL be cached by key and exposed through a typed hook.

The registry's `LangAssets` parameter SHALL be the real type imported from `@alphaTiles/data-language-pack` (replacing the `unknown` forward-reference introduced in `port-foundations`). The registry's internal `PrecomputeProvider` SHALL be removed; the precompute cache SHALL live inside the `LangAssets` object (`assets.precomputes`), and `usePrecompute<T>(key)` SHALL read from `useLangAssets().precomputes`.

This replaces the Java-side pattern `Chile.data = Chile.chilePreProcess()` where individual game classes own static boot-time derivation from the language pack.

#### Scenario: Register and retrieve with typed assets

- **WHEN** a feature library calls `registerPrecompute('chile', (assets) => buildChileData(assets))` at module top level
- **AND** the `LangAssetsProvider` mounts (which triggers `loadLangPack`, which calls `runPrecomputes(assets)`)
- **THEN** the result of `buildChileData(assets)` is stored in `assets.precomputes` under key `'chile'`
- **AND** a subsequent call to `usePrecompute<ChileData>('chile')` inside a component returns that stored value with type `ChileData`
- **AND** the `assets` parameter to the precompute function has type `LangAssets` from `@alphaTiles/data-language-pack`, not `unknown`

#### Scenario: Duplicate registration

- **WHEN** two modules register precomputes with the same key
- **THEN** the second registration throws an error identifying the conflicting key and the module that registered first

#### Scenario: Missing precompute

- **WHEN** a component calls `usePrecompute('nonexistent')`
- **THEN** the hook throws an error naming the key and listing registered keys

#### Scenario: Precompute function throws

- **WHEN** a registered precompute function throws during `runPrecomputes`
- **THEN** the lang-assets runtime surfaces the error with the precompute key attached, halting the boot sequence and triggering `<ErrorScreen>`

### Requirement: `util-precompute` dependency constraints

The `util-precompute` library SHALL remain `type:util` scope `shared`. It MAY use a **type-only** import of `LangAssets` from `@alphaTiles/data-language-pack` (a `type:data-access` library). Runtime imports into `type:data-access` are NOT permitted. Where a runtime hook (`usePrecompute`) needs access to `useLangAssets`, the hook SHALL be relocated to `@alphaTiles/data-language-assets` and re-exported from `util-precompute` via a type-only re-export — OR the ESLint dependency-boundary rule SHALL be configured to permit this specific cross-type reference.

#### Scenario: Type-only import from data-access

- **WHEN** `libs/shared/util-precompute/src/registerPrecompute.ts` imports `LangAssets`
- **THEN** the import statement uses `import type { LangAssets } from '@alphaTiles/data-language-pack'`
- **AND** no runtime import of the data-access lib exists

#### Scenario: Hook relocation

- **WHEN** `usePrecompute` is inspected
- **THEN** it is either exported from `@alphaTiles/data-language-assets` (and re-exported for convenience via `util-precompute`), or its presence in `util-precompute` is accompanied by an ESLint-boundary override comment citing this spec

#### Scenario: Dependency rules respected at build time

- **WHEN** `nx graph` inspects `util-precompute`'s dependencies
- **THEN** the only production runtime dependencies are `react` (for the hook) and type-only imports
