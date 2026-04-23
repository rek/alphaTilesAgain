# data-language-pack

Synchronous language-pack boot loader. Turns the bundled `langManifest` into a
fully-wired `LangAssets` object in one call.

## API

```ts
import { loadLangPack, LangAssets, LangAssetsBindError } from '@alphaTiles/data-language-pack';

const assets: LangAssets = loadLangPack(langManifest);
// assets.audio.tiles['a']  → require() handle for tile 'a'
// assets.images.words['act'] → require() handle for word 'act' image
// assets.precomputes.get('chile') → output of the registered chile precompute
```

## Key decisions

- **Synchronous by design.** Metro resolves all `require()` calls eagerly during
  bundle load. Parser is pure sync. No IO, no Promises.
- **Domain-keyed maps.** `audio.tiles` is keyed by `tile.base`, not the manifest's
  internal `audioName`. Consumers never need to know manifest key conventions.
- **`zz_no_audio_needed` sentinel.** Tiles with this audioName are silently skipped.
- **`naWhileMPOnly` sentinel.** Games with this instructionAudio are silently skipped.
- **Strict binding.** Any audio/image/font referenced in `aa_*.txt` but absent from
  the manifest throws `LangAssetsBindError`. The validator prevents this in healthy
  builds; the error means a build-pipeline bug.

## Precomputes

`loadLangPack` calls `runPrecomputes(assets)` from `@shared/util-precompute` after
asset assembly. Results are stored in `assets.precomputes`. Feature libs that
call `registerPrecompute()` at module top-level have their output available here.

## Reference

See `openspec/changes/lang-assets-runtime/design.md` for full architectural context.

## Building

Run `nx build data-language-pack` to build the library.

## Running unit tests

Run `nx test data-language-pack` to execute the unit tests via [Jest](https://jestjs.io).
