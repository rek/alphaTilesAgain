# data-language-assets

React Context provider that makes the fully-wired `LangAssets` available to
the entire component tree. Also exports `usePrecompute` for typed access to
precomputed data.

## Mount position

```tsx
// apps/alphaTiles/app/_layout.tsx
import { LangAssetsProvider } from '@alphaTiles/data-language-assets';

export default function RootLayout() {
  return (
    <LangAssetsProvider>
      <Stack />
    </LangAssetsProvider>
  );
}
```

`LangAssetsProvider` must be the outermost custom provider. RTL setup (via
`I18nManager.forceRTL`) happens before the provider, at module load time.

## Usage

```ts
import { useLangAssets } from '@alphaTiles/data-language-assets';

function MyComponent() {
  const assets = useLangAssets();
  // assets.tiles.rows, assets.audio.tiles['a'], etc.
}
```

```ts
import { usePrecompute } from '@alphaTiles/data-language-assets';

function ChileGame() {
  const chileData = usePrecompute<ChileData>('chile');
}
```

## Error handling

If `loadLangPack` throws during boot (bad pack or precompute failure),
`LangAssetsProvider` renders `<ErrorScreen>` in place of children. The error
screen is intentionally plain — i18n and styling are unavailable when the pack
fails to load.

## Reference

See `openspec/changes/lang-assets-runtime/design.md` §D4, §D6, §D7 for
full architectural context.

## Building

Run `nx build data-language-assets` to build the library.
