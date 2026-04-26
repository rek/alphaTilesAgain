# Getting Started

Everything needed to set up and work in this repo.

## Initial Setup

```sh
nvm use 22
npm install
```

## Development

### Running the App

```sh
APP_LANG=eng nx start alphaTiles      # Metro bundler
nx start-web-eng alphaTiles           # Web dev server — eng (http://localhost:8081)
nx start-web-yue alphaTiles           # Web dev server — yue (http://localhost:8081)
APP_LANG=eng nx run-android alphaTiles
APP_LANG=eng nx run-ios alphaTiles
```

> `start-web-*` regenerates the lang manifest before starting — no separate regen step needed.

> Tip: `nx show project alphaTiles` lists all available targets.

### Switching Language During Dev

`APP_LANG` selects the language pack. To switch:

1. Regenerate the manifest for the new language:
   ```sh
   APP_LANG=yue node_modules/.bin/tsx tools/generate-lang-manifest.ts
   ```
2. Restart the dev server with the new `APP_LANG`:
   ```sh
   APP_LANG=yue nx serve alphaTiles
   ```

Metro does not watch `APP_LANG` — a full restart is required. The manifest regeneration step is also required because `langManifest.ts` is generated once and the dev server reads it as a static import.

### Validating a language pack

Run after any change to files under `languages/<code>/`:

```sh
APP_LANG=yue node_modules/.bin/tsx tools/validate-lang-pack.ts
```

The validator checks audio/image references, tile structure, word cross-refs, and more.
It must pass before `generate-lang-manifest.ts` is run — CI enforces this order.
Use `nx validate-lang-pack alphaTiles` only when `PUBLIC_LANG_ASSETS` is set (it also triggers rsync from the source repo).

### Type Checking

```sh
npx tsc --noEmit -p apps/alphaTiles/tsconfig.json
```

### Linting

```sh
nx lint alphaTiles
nx affected:lint             # lint changed projects only
```

### Testing

```sh
nx test alphaTiles
nx affected:test             # test changed code only
nx run-many -t test          # all tests in parallel
```

## Language Pack Setup

Language pack text files, fonts, images, and audio are committed to the repo under `languages/`. After cloning, only `APP_LANG` is needed to run the app:

```sh
export APP_LANG=eng   # selects the language pack (eng, tpx, template, yue)
```

Set this in your shell profile (`~/.zshrc` or `~/.bashrc`). Without it, `nx start` will fail with an actionable error.

### Updating a language pack

To pull in new content from the `PublicLanguageAssets` source repo, you also need `PUBLIC_LANG_ASSETS`:

```sh
export PUBLIC_LANG_ASSETS=/path/to/PublicLanguageAssets
./nx rsync-lang-pack alphaTiles
./nx validate-lang-pack alphaTiles
./nx generate-lang-manifest alphaTiles
# commit changes to languages/ and langManifest.ts
```

## AI Spec Tools

**OpenSpec** — <https://github.com/Fission-AI/OpenSpec>

```sh
npm install -g @fission-ai/openspec@latest
openspec init   # run once per project
```

Key commands: `/opsx:propose`, `/opsx:apply`, `/opsx:archive`

## MCP Servers

1. **Zen MCP Server** — <https://github.com/BeehiveInnovations/zen-mcp-server>
   - Configure in Claude Code MCP settings
   - Set up API keys (`GEMINI_API_KEY`)

2. **Context7 MCP Server** — <https://github.com/upstash/context7>

   ```sh
   claude mcp add context7 -- npx -y @upstash/context7-mcp --api-key xxx
   ```

## Web Export (GitHub Pages)

The app is exported as a static site and deployed to GitHub Pages via CI.
Each language gets its own sub-path: `/alphaTilesAgain/<langSlug>/`.

### Building locally

```sh
APP_LANG=eng EXPO_BASE_URL=/alphaTilesAgain/engEnglish4 npx nx run alphaTiles:web-export
```

`EXPO_BASE_URL` **must include the repo name** (`/alphaTilesAgain/...`). Without it,
`experiments.baseUrl` stays empty and all HTML asset paths are root-absolute, causing
404s on GitHub Pages. See **ADR-011** for the full explanation.

### Adding a new language to CI

In `deploy.yaml`, add a build step and a stage step following the eng/yue pattern.
Set `EXPO_BASE_URL: /alphaTilesAgain/<langSlug>` to match the stage directory name.

---

## Local Builds

### Requirements

- **Java 21** (openjdk 21.0.8)
- **Android Studio** with:
  - SDK Platforms: Android 15
  - SDK Tools: CMake, Android SDK Build-Tools, Android SDK Platform-Tools

### Build APK

```sh
nx buildApk alphaTiles
```

## EAS Updates (OTA)

AlphaTiles uses **EAS Update** to ship JS bundle + asset changes to installed apps without a store review cycle. Each language-pack build has its own update channel (e.g. `eng`, `tpx`, `yue`). See `docs/decisions/ADR-009-ota-via-eas-update.md` and `openspec/changes/ota-updates/design.md`.

### One-time setup: `eas init`

Before the first EAS Build or EAS Update, a developer must run:

```sh
eas init
```

This creates an EAS project, writes `extra.eas.projectId` into `app.config.ts` via `EAS_PROJECT_ID`, and links the repo to your Expo org. Run it once — never twice (creates duplicate projects).

After running, commit the `EAS_PROJECT_ID` value or add it to your CI secrets as `EAS_PROJECT_ID=<uuid>`.

### Publishing OTA updates

Publish a content-only update to a language channel:

```sh
eas update --channel eng --message "fix: corrected audio for tile 'a'"
eas update --channel tpx --message "fix: updated wordlist"
```

Users receive the update on next cold launch. The loading screen checks for updates automatically via `runOtaCheck()`.

### Rollback

If a bad update reaches users, republish the previous version:

```sh
eas update:republish --channel eng
```

Users get the rolled-back version on next cold launch.

### Version-skew policy

- **Content-only changes** (JS bundle, images, audio reachable from JS): ship via `eas update`. Do NOT bump `version` in `app.config.ts`.
- **Native-surface changes** (new native module, Expo SDK bump, new `app.config.ts` plugin, changes to `android`/`ios` native blocks): bump `version`, create a new EAS Build, submit to the store. OTA updates do NOT reach users on an older binary (the `appVersion` runtime-version policy enforces this).

### What ships via OTA vs. rebuild

| Change type | Ship via |
|-------------|----------|
| JS logic / UI | OTA (`eas update`) |
| Bundled images / audio | OTA (`eas update`) |
| Language-pack content fix | OTA (`eas update`) |
| New native module | Full rebuild + store |
| Expo SDK version bump | Full rebuild + store |
| New `app.config.ts` plugin | Full rebuild + store |
| `ios.bundleIdentifier` / `android.package` change | Full rebuild + store |

## Troubleshooting

See **[Troubleshooting](./TROUBLESHOOTING.md)** for common issues.
