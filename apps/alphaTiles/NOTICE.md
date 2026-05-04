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

## Tibetan Uchen stroke data — Noto Serif Tibetan (SYNTHETIC, NOT SHIPPABLE)

The `game-bod-uchen` change explores Tibetan Uchen stroke validation. All four
license-clean OSS data sources we evaluated for Uchen failed (see
`openspec/changes/game-bod-uchen/STATUS.md`). To smoke-test the toolchain we
generate synthetic stroke data from Noto Serif Tibetan via
`tools/build-stroke-data-bod.ts` → `tools/data/uchen-strokes/<char>.json`.

- **Font:** Noto Serif Tibetan (Regular). System-installed at
  `/usr/share/fonts/truetype/noto/NotoSerifTibetan-Regular.ttf` on
  Debian/Ubuntu.
- **License:** SIL Open Font License 1.1 — <https://scripts.sil.org/OFL>.
  OFL allows derivative use of OUTPUTS (rendered text, stroke data) without
  requiring redistribution under OFL; the font itself is not shipped.
- **Synthetic warning:** Stroke ORDER is fabricated (subpaths sorted top-to-
  bottom by bbox; the Tibetan stroke-order convention per chris fynn varies
  and follows pen-lift mechanics, not glyph-subpath geometry). NOT shippable
  to learners. Used only to validate that `<HanziWriter>` accepts U+0F00
  codepoints and that the rasterize+thin+trace pipeline handles Tibetan
  glyph topologies.

## Hanzi quiz mechanic — @jamsch/react-native-hanzi-writer

The stroke-tracing mechanic is implemented on top of
`@jamsch/react-native-hanzi-writer` (MIT) — a React Native port of
`hanzi-writer.js`.

- **Upstream:** <https://github.com/jamsch/react-native-hanzi-writer>
- **License:** MIT.
