# Store graphics: yue

Status: spec only. **Artwork pending: owner/customer (#53).** Drop finished files here as `icon-512.png` and `feature-graphic.png`.

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
