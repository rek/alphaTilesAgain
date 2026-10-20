# Store graphics: yue

Status: **draft artwork committed** (2026-10-20): `icon-512.png`, `feature-graphic.png`. Customer approval pending (#53).

Both are generated from `src/icon.svg` and `src/feature-graphic.svg` (Noto Sans CJK HK, open licence; AlphaTiles theme colours; no third-party pictures). Rebuild:

```
rsvg-convert -w 512 -h 512 src/icon.svg -o icon-512.png
rsvg-convert -w 1024 -h 500 src/feature-graphic.svg -o fg.png && magick fg.png -background '#6A1B9A' -alpha remove -alpha off feature-graphic.png
```

Icon: white tile with 廣 over two tilted blue/red tiles on purple. Feature graphic: 學廣話, tagline 廣東話識字遊戲, four tiles 聽 拼 寫 字 (listen, spell, write, character). Text sits in the top two-thirds.

## App icon (Play listing)

- 512 × 512 px, 32-bit PNG (alpha allowed), ≤ 1 MB.
- Full square; Play applies the rounded mask and shadow. Do not add your own rounding or shadow.
- Should match the launcher icon. Today the yue pack has no `languages/yue/images/icon.png`, so the build uses the generic `apps/alphaTiles/assets/images/icon.png`; the adaptive icon is also generic. Both are covered by #53.

## Feature graphic

- **1024 × 500 px**, PNG or JPEG, **no alpha**, ≤ 15 MB.
- Shown at the top of the listing and in promotions; often cropped or overlaid with a play button, so keep key content in the centre ~80 % and away from the bottom third.
- Content: app name 學廣話 (large, Traditional Chinese), a few Chinese character tiles in the app's tile colours, optionally an avatar from `languages/yue/images/avatars`. Tagline optional: 廣東話識字遊戲.
- Avoid: screenshots of the phone frame, "best"/"#1"/price claims, Play badges, small text.
- Only use pictures the project has rights to (asset licensing #56).

## Not needed for v1

- Promo video (YouTube URL): optional, skip.
- TV banner, Wear, Chromebook assets: not applicable (portrait phone app).

## Launcher icons

Same artwork, sources `src/adaptive-*.svg`, outputs in `languages/yue/images/` (`icon.png` 1024², `android-icon-foreground|background|monochrome.png`). Foreground content is scaled to 70% to stay inside Android's adaptive safe zone; background is solid `#9C27B0`; monochrome is the tile with 廣 cut out. Render with `rsvg-convert -w 1024 -h 1024 src/<name>.svg -o ...`.
