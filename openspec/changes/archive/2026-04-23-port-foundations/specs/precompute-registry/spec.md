## ADDED Requirements

### Requirement: Per-class precompute registry

The port SHALL provide a registry (`libs/shared/util-precompute`) that lets feature libraries register a precompute function at module-import time. Registered functions SHALL be executed once, after the language pack is loaded, against the loaded asset state. Results SHALL be cached by key and exposed through a typed hook.

This replaces the Java-side pattern `Chile.data = Chile.chilePreProcess()` where individual game classes own static boot-time derivation from the language pack.

#### Scenario: Register and retrieve

- **WHEN** a feature library calls `registerPrecompute('chile', (assets) => buildChileData(assets))` at module top level
- **AND** the lang-assets runtime calls `runPrecomputes(assets)` after pack load
- **THEN** the result of `buildChileData(assets)` is cached under key `'chile'`
- **AND** a subsequent call to `usePrecompute<ChileData>('chile')` inside a component returns that cached value

#### Scenario: Duplicate registration

- **WHEN** two modules register precomputes with the same key
- **THEN** the second registration throws an error identifying the conflicting key and the module that registered first

#### Scenario: Missing precompute

- **WHEN** a component calls `usePrecompute('nonexistent')`
- **THEN** the hook throws an error naming the key and listing registered keys

#### Scenario: Precompute function throws

- **WHEN** a registered precompute function throws during `runPrecomputes`
- **THEN** the lang-assets runtime surfaces the error with the precompute key attached, halting the boot sequence

### Requirement: `util-precompute` dependency constraints

The `util-precompute` library SHALL be `type:util` scope `shared`. It MUST NOT import from any `data-access`, `feature`, or `ui` library. It MAY use a type-only forward-reference to the `LangAssets` type exported by the (future) `lang-assets-runtime` library.

#### Scenario: Dependency rules respected

- **WHEN** `nx graph` inspects `util-precompute`'s dependencies
- **THEN** the only dependencies are `react` (for the hook) and type-only imports

#### Scenario: Forward-referenced types

- **WHEN** `lang-assets-runtime` does not yet exist
- **THEN** `LangAssets` is aliased to `unknown` in `util-precompute`, callers cast at the boundary, and no circular dep is introduced
