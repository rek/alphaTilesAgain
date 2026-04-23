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

The prebuild pipeline requires two env vars. Set them in your shell profile (`~/.zshrc` or `~/.bashrc`):

```sh
export PUBLIC_LANG_ASSETS=/home/adam/dev/alphaTilesAgain/PublicLanguageAssets
export APP_LANG=eng
```

`PUBLIC_LANG_ASSETS` must point at your local clone of the sibling `PublicLanguageAssets` repo. `APP_LANG` selects the language pack (`eng`, `tpx`, `template`, `yue`).

Without these set, `nx start alphaTiles` and `nx prebuild-lang alphaTiles` will fail immediately with an actionable error message.

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

## Troubleshooting

See **[Troubleshooting](./TROUBLESHOOTING.md)** for common issues.
