# Third-Party Notices

This document attributes third-party assets and code shipped with AlphaTiles
beyond what `package.json` already lists.

## Stroke-order data — Make Me a Hanzi (game-taiwan)

The `feature-game-taiwan` mechanic relies on per-character stroke data sourced
from the [Make Me a Hanzi](https://github.com/skishore/makemeahanzi) project,
distributed via the `hanzi-writer-data` npm package.

- **Upstream:** Make Me a Hanzi (Shaunak Kishore et al.) — graphics derived from
  Arphic Technology's PL UMing and PL KaitiM fonts.
- **Distribution channel:** `hanzi-writer-data` (jsDelivr CDN) is fetched at
  prebuild time by `tools/build-stroke-data.ts`. Per-character JSON files are
  cached locally under `tools/data/stroke-cache/` and emitted into
  `languages/<APP_LANG>/strokes/` for inclusion in the language pack.
- **License:** Arphic Public License (LGPL-style) for the underlying glyph
  shapes; ARPHIC PUBLIC LICENSE — see <https://github.com/skishore/makemeahanzi/blob/master/ARPHICPL.TXT>.
- **Usage type:** runtime data files. The shapes are not statically linked into
  the binary; they are loaded as JSON at runtime, which is the standard MMH
  consumption pattern.

Legal sign-off on shipping this data is required before the yue release.

## Devanagari stroke data — Wikimedia Commons

The `feature-game-india-deva` mechanic (Phase 1) sources stroke data from
[Wikimedia Commons Category:Devanagari stroke order (SVG)](https://commons.wikimedia.org/wiki/Category:Devanagari_stroke_order_(SVG)).
Files are extracted by `tools/build-stroke-data-deva.ts` and committed to
`tools/data/devanagari-strokes/<char>.json`.

- **License:** Creative Commons Attribution-ShareAlike 3.0 (CC BY-SA 3.0).
  Derivative works (the per-character JSON files we ship) inherit the same
  license.
- **Phase 1 contributors:** every character below is by
  [User:Saurmandal](https://commons.wikimedia.org/wiki/User:Saurmandal):
  ऄ अ आ इ ई उ ऊ ऋ ए ऐ ओ औ झ.

## Hanzi quiz mechanic — @jamsch/react-native-hanzi-writer

The stroke-tracing mechanic is implemented on top of
`@jamsch/react-native-hanzi-writer` (MIT) — a React Native port of
`hanzi-writer.js`.

- **Upstream:** <https://github.com/jamsch/react-native-hanzi-writer>
- **License:** MIT.
