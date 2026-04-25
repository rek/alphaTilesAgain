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
nx start alphaTiles          # Metro bundler
nx serve alphaTiles          # Web dev server (expo start --web)
nx run-android alphaTiles    # Run on Android device/emulator
nx run-ios alphaTiles        # Run on iOS simulator
```

> Tip: `nx show project alphaTiles` lists all available targets.

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
