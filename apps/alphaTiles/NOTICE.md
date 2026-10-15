# Third-Party Notices

This document attributes third-party assets and code shipped with AlphaTiles
beyond what `package.json` already lists.

## Stroke-order data — Make Me a Hanzi (game-taiwan)

Full analysis, citations and compliance checklist:
[`docs/licensing/stroke-data.md`](../../docs/licensing/stroke-data.md).

The `feature-game-taiwan` mechanic uses per-character stroke data from the
[Make Me a Hanzi](https://github.com/skishore/makemeahanzi) project's
`graphics.txt`, obtained via
[`hanzi-writer-data`](https://github.com/chanind/hanzi-writer-data) 2.0.1.

- **Upstream:** Make Me a Hanzi (Shaunak Kishore). Its `graphics.txt` is derived
  from the fonts **AR PL KaitiM GB** and **AR PL UKai**, Copyright (C) 1999
  Arphic Technology Co., Ltd. (Make Me a Hanzi `COPYING`).
- **License:** **Arphic Public License** (1999), the licence of `graphics.txt`
  and of `hanzi-writer-data`. It is *not* the LGPL: that covers only MMH
  `dictionary.txt`, which we do not use. Verbatim text:
  [`libs/alphaTiles/data-stroke-data/ARPHICPL.TXT`](../../libs/alphaTiles/data-stroke-data/ARPHICPL.TXT)
  (upstream copy: <https://github.com/skishore/makemeahanzi/blob/master/APL/english/ARPHICPL.TXT>).
- **How it is built:** `tools/build-stroke-data.ts` fetches per-character JSON
  from `cdn.jsdelivr.net/npm/hanzi-writer-data@2.0.1` and caches it in
  `tools/data/stroke-cache/`. It then writes **modified** copies to
  `languages/<APP_LANG>/strokes/`: only the pack's characters, a `character`
  field added, only `strokes` and `medians` kept, plus an `_notice` field
  stating how and when the file was changed (APL §2a). `ARPHICPL.TXT` is
  copied alongside them (APL §1).
- **How it ships:** `tools/generate-lang-manifest.ts` inlines the JSON into
  the app's JS bundle (native and web). The About screen shows the attribution
  and the full licence text when a pack contains stroke data.
- **Where to get the modified data (APL §2b):** the `strokes/` folder of each
  language pack in <https://github.com/rek/alphaTilesAgain/tree/main/languages>,
  under the Arphic Public License.
- **No warranty:** the data is provided without warranty; see APL §7 and §8.

## Hanzi Writer (code)

`@jamsch/react-native-hanzi-writer` (below) is based on
[hanzi-writer](https://github.com/chanind/hanzi-writer):

> The MIT License (MIT) — Copyright (c) 2014 David Chanin. Permission is hereby
> granted, free of charge, to any person obtaining a copy of this software …
> The above copyright notice and this permission notice shall be included in
> all copies or substantial portions of the Software. THE SOFTWARE IS PROVIDED
> "AS IS", WITHOUT WARRANTY OF ANY KIND …

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
- **License:** MIT — Copyright (c) 2022 jamsch (full text in the package's `LICENSE`).
