## Why

Cantonese (yue) is the next big launch target. Hanzi handwriting (寫字) and stroke order (筆順) are foundational HK primary-school literacy practices — currently absent from the catalogue. The 17 archived Java ports leave the entire motor-production axis unaddressed. Stroke-order tracing is the single highest-marketability mechanic for the yue audience and the largest curriculum gap (`docs/GAME_PATTERNS.md` ladder shows no handwriting / motor-production tier).

OSS research (issue #13) confirms a direct React Native port of the relevant library exists (`@jamsch/react-native-hanzi-writer`) plus a public stroke-data corpus (`skishore/makemeahanzi`) covering ~9k hanzi. The "complex parts" (path matching, stroke scoring, hint logic, animation) are all solved upstream — build cost drops from L-effort to ~3 dev-days.

## What Changes

- **NEW** `feature-game-taiwan` library — stroke-order tracing game wrapping `<HanziWriter />` quiz mode.
- **NEW** `data-stroke-data` library — vendors a build-time MMH dataset import + per-pack stroke-JSON loader.
- **NEW** route `apps/alphaTiles/app/games/taiwan.tsx`.
- **MODIFIED** `lang-pack-parser` capability — adds optional `strokes/<char>.json` directory parsing.
- **MODIFIED** `lang-pack-validator` capability — recognises `strokes/` directory; warns (does not error) on missing per-tile entries when language is Chinese-script.
- **MODIFIED** `build-pipeline` capability — new prebuild step `tools/build-stroke-data.ts` emits `languages/<code>/strokes/` from MMH for Chinese-script packs.
- **MODIFIED** `lang-assets-runtime` capability — `langManifest.ts` exposes `strokes: Record<string, StrokeData>` at runtime.
- **MODIFIED** `game-menu` capability — Taiwan tile is hidden from the country menu when the active pack has fewer than `MIN_STROKE_TILES` (5) characters with stroke data.
- **NEW** package dependencies: `@jamsch/react-native-hanzi-writer`. Peers (`react-native-svg`, `react-native-reanimated`, `react-native-gesture-handler`) are already standard Expo deps — verify before adding.

## Capabilities

### New Capabilities

- `game-taiwan`: Stroke-order tracing game mechanic. Player drags through each hanzi stroke in order; OSS lib scores against expected path; round = N characters from current stage's tilelist.
- `stroke-data`: Per-pack stroke-data asset shape, parser entry, runtime accessor. Owned by `data-stroke-data`.

### Modified Capabilities

- `lang-pack-parser`: parser SHALL recognise an optional `strokes/<char>.json` directory and surface contents under `assets.strokes`.
- `lang-pack-validator`: validator SHALL list missing stroke entries for Chinese-script packs as warnings (not errors).
- `build-pipeline`: prebuild SHALL run `build-stroke-data` for Chinese-script packs; non-Chinese packs SHALL skip silently.
- `lang-assets-runtime`: `LangAssets` SHALL expose `strokes: Record<string, StrokeData>` populated from the manifest.
- `game-menu`: menu SHALL hide the Taiwan tile when the active pack has fewer than `MIN_STROKE_TILES` (5) characters with stroke data.

## Impact

- **Code:** new `feature-game-taiwan` lib, new `data-stroke-data` lib, modified `data-language-pack`, `data-language-assets`, `feature-game-menu`. New prebuild tool. Updated `langManifest.ts` codegen.
- **Pack schema:** new optional `languages/<code>/strokes/` directory. Backwards-compatible — existing packs unaffected.
- **APK size:** ~320KB for yue (~64 chars × ~5KB). Per-pack — non-Chinese packs unaffected.
- **Dependencies:** one new npm dep (`@jamsch/react-native-hanzi-writer`). Peer deps already present.
- **Legal:** MMH `graphics.txt` is LGPL; shipping as a runtime data file (not static-linked) is the standard usage pattern. Needs sign-off before yue v1.
- **Risk:** small-maintainer footprint on `@jamsch/react-native-hanzi-writer`; project-owned mirror recommended.
- **Out of scope:** Jyutping/tone columns; `aa_sentences.txt`; radical metadata. Tracked separately in issue #13 Tier-3.
