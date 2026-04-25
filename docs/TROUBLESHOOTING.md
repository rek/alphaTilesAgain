# Troubleshooting

Common issues and solutions.

---

## Compiler

### Cannot resolve react-compiler-runtime

**Error:** `ERROR  Error: Cannot resolve react-compiler-runtime`

**Cause:** `{experiments: {reactCompiler: true}}` in `app.json` requires `react-compiler-runtime`.

**Fix:** `npm install react-compiler-runtime`

### TypeScript Errors After File Changes

**Symptom:** "Cannot find module" after adding or moving files.

**Fix:**
1. Verify path alias in `tsconfig.json` (`@/` → root)
2. Restart TS server in IDE
3. `npx expo start --clear`

---

## Metro

### Hot Reload Not Working

1. Check Expo DevTools connection
2. Restart dev server: `npm start`
3. Clear Metro cache: `npm start -- --clear`

### Module Resolution Errors

**Fix:** `npx expo start --clear` to clear Metro cache.

---

## Build

### Android Build Fails

1. Check Java version: `java -version` (need Java 21)
2. Check Android SDK: Android 15, Build-Tools installed
3. `cd android && ./gradlew clean`

### Missing Device on Android

`adb devices` — if not visible, enable **USB Debugging** in Developer Settings.

---

## Expo Go vs Dev Build

Some packages (reanimated, gesture handler) require a **dev build** and don't work in Expo Go.

Build a dev client: `eas build --profile development --platform android`

---

## Web / GitHub Pages

### App stuck on "Loading AlphaTiles" at deployed URL

**Cause:** JS bundle / font assets 404. The HTML has root-absolute paths (`/_expo/...`)
that resolve to the wrong origin on GitHub Pages.

**Root cause:** `experiments.baseUrl` was empty in `app.config.ts`, so the export
pipeline didn't prefix asset paths. See **ADR-011**.

**Fix:** Ensure `app.config.ts` has `baseUrl: process.env.EXPO_BASE_URL ?? ''` in
`experiments`, and `deploy.yaml` sets `EXPO_BASE_URL: /alphaTilesAgain/<langSlug>`
(full path including repo name).

**Verify:** `curl -I https://rek.github.io/alphaTilesAgain/engEnglish4/` — check
`content-length` matches the deployed file; then inspect the HTML's `src=` attribute to
confirm it starts with `/alphaTilesAgain/`.

---

## Getting Help

1. Check console logs in Metro terminal
2. Review recent code changes
3. Check [Project Organization](./PROJECT_ORGANIZATION.md) or [Code Style](./CODE_STYLE.md)
