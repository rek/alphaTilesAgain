## Why

Language packs are baked into each build. To update content (word lists, audio, images) after release, today the only path is a full EAS build + store submission or an EAS OTA update (which still ships a new JS bundle). For minor content fixes — a corrected phoneme list, a new audio file — this is disproportionately heavy.

A lightweight CDN-based pack downloader lets a content team push pack updates independently of app releases, with no developer involvement after the initial wiring.

## What Changes

- Add `libs/alphaTiles/util-lang-pack-downloader` (`type:util`, `scope:alphaTiles`).
- On boot, fetch `<BASE_URL>/<langCode>/latest.json` to compare versions.
- If remote version > local and `minAppVersion` is satisfied, download and unzip the pack into `documentDirectory/downloaded/<langCode>/`.
- On next full boot, the loader prefers the downloaded pack over the bundled one.

## Capabilities

### New Capabilities

- `lang-pack-downloader` — boot-time version check and background download of an updated language pack ZIP from a configurable CDN; staged activation on next boot.

## Impact

- New lib `libs/alphaTiles/util-lang-pack-downloader`. New runtime dep `expo-file-system` (likely already present).
- Boot sequence adds one network fetch (`latest.json`). On failure the app continues with the existing pack — no crash.
- Document directory gains `downloaded/<langCode>/` subtree on successful download.
- Env vars `LANG_PACK_BASE_URL` and `APP_LANG` required at build time; if absent the feature is a no-op.

## Out of Scope

- Delta / incremental pack updates.
- Partial pack downloads (single file, single asset type).
- Hot-swap without restart.
- Cross-language switching at runtime.
- Pack signature verification (v1).
- User-facing download progress UI.

## Unresolved Questions

- Should a failed download be retried on next boot, or only on the boot that triggered the check?
- Should the `latest.json` fetch have a request timeout, and what value?
- Is there a max staleness policy (e.g., "don't download if local pack is <24h old")?
- Should the downloaded pack be wiped when the app version advances past the pack's `minAppVersion` ceiling?
