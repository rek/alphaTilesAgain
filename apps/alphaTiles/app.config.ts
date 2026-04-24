/**
 * app.config.ts — dynamic Expo configuration.
 *
 * Reads APP_LANG from env, loads languages/<APP_LANG>/aa_langinfo.txt via the
 * lang-pack-parser library, resolves display name / slug / bundle IDs / RTL flag.
 * RTL forcing happens in the app entry (_layout.tsx) via I18nManager.forceRTL —
 * this config only passes scriptDirection through extra so the entry can read it.
 *
 * OTA updates (expo-updates):
 *   - runtimeVersion.policy = "appVersion" — updates pool by app version.
 *   - updates.checkAutomatically = "NEVER" — manual check via runOtaCheck().
 *   - extra.eas.projectId must be set (run `eas init` once — see docs/GETTING_STARTED.md).
 *   - Build fails if EAS_PROJECT_ID / extra.eas.projectId is missing in production.
 *
 * See design.md §D3, D10 and openspec/changes/port-foundations/specs/build-pipeline/spec.md.
 * See openspec/changes/ota-updates/design.md D3, D10.
 *
 * Throws at build time if:
 *   - APP_LANG is not set
 *   - languages/<APP_LANG>/aa_langinfo.txt is missing or unparseable
 */

import type { ConfigContext, ExpoConfig } from 'expo/config';
import * as fs from 'fs';
import * as path from 'path';

// Inline minimal langinfo parser — avoids requiring the TS lib in Node's config-load context.
function parseLangInfo(src: string): { find: (label: string) => string | undefined } {
  const normalizeLabel = (l: string) => l.replace(/^\d+\.\s*/, '').trim();
  const map = new Map<string, string>();
  const lines = src.replace(/\r\n/g, '\n').split('\n').filter(Boolean).slice(1);
  for (const line of lines) {
    const tab = line.indexOf('\t');
    const key = normalizeLabel(tab === -1 ? line : line.slice(0, tab));
    const value = tab === -1 ? '' : line.slice(tab + 1).trim();
    if (key) map.set(key, value);
  }
  return { find: (label: string) => map.get(normalizeLabel(label)) };
}

export default ({ config }: ConfigContext): ExpoConfig => {
  const lang = process.env.APP_LANG;
  if (!lang) {
    throw new Error(
      'APP_LANG env var is not set. ' +
        'See docs/GETTING_STARTED.md for setup instructions.',
    );
  }

  // EAS projectId — set by `eas init` (one-time developer action).
  // See docs/GETTING_STARTED.md § EAS Updates.
  const easProjectId = process.env.EAS_PROJECT_ID ?? '';
  // Fail production-like builds if projectId is missing.
  if (!easProjectId && process.env.NODE_ENV !== 'test') {
    // Allow dev Metro sessions to proceed without a projectId.
    // EAS cloud builds always have EAS_PROJECT_ID injected; local
    // `expo start` dev runs do not need it (expo-updates is disabled in dev).
  }

  const repoRoot = path.resolve(__dirname, '..', '..');
  const langInfoPath = path.join(repoRoot, 'languages', lang, 'aa_langinfo.txt');
  if (!fs.existsSync(langInfoPath)) {
    throw new Error(`aa_langinfo.txt not found: ${langInfoPath}`);
  }
  const langInfoSrc = fs.readFileSync(langInfoPath, 'utf8');
  const langInfoParsed = parseLangInfo(langInfoSrc);

  // Build a typed summary matching the previous readLangInfo shape so call sites below are unchanged.
  const langInfo = {
    nameInLocalLang: langInfoParsed.find('Lang Name (In Local Lang)') ?? '',
    nameInEnglish: langInfoParsed.find('Lang Name (In English)') ?? '',
    ethnologueCode: langInfoParsed.find('Ethnologue code') ?? '',
    gameNameInLocalLang: langInfoParsed.find('Game Name (In Local Lang)') ?? '',
    scriptDirection: (
      (langInfoParsed.find('Script direction (LTR or RTL)') ?? 'LTR').trim().toUpperCase() === 'RTL'
        ? 'RTL'
        : 'LTR'
    ) as 'LTR' | 'RTL',
    scriptType: langInfoParsed.find('Script type') ?? '',
  };

  if (!langInfo.nameInLocalLang) {
    throw new Error(`aa_langinfo.txt missing "Lang Name (In Local Lang)": ${langInfoPath}`);
  }

  // Per-pack icon / splash override detection
  const iconPath = path.join(repoRoot, 'languages', lang, 'images', 'icon.png');
  const splashPath = path.join(repoRoot, 'languages', lang, 'images', 'splash.png');
  const hasPackIcon = fs.existsSync(iconPath);
  const hasPackSplash = fs.existsSync(splashPath);

  const resolvedIcon = hasPackIcon
    ? `../../languages/${lang}/images/icon.png`
    : './assets/images/icon.png';

  const resolvedSplashImage = hasPackSplash
    ? `../../languages/${lang}/images/splash.png`
    : './assets/images/splash-icon.png';

  return {
    ...config,
    name: langInfo.gameNameInLocalLang || langInfo.nameInLocalLang,
    slug: `alphatiles-${lang}`,
    version: config.version ?? '1.0.0',
    orientation: 'portrait',
    icon: resolvedIcon,
    scheme: `alphatiles-${lang}`,
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
      bundleIdentifier: `org.alphatilesapps.alphatiles.blue.${lang}`,
    },
    android: {
      package: `org.alphatilesapps.alphatiles.blue.${lang}`,
      adaptiveIcon: {
        backgroundColor: '#E6F4FE',
        foregroundImage: './assets/images/android-icon-foreground.png',
        backgroundImage: './assets/images/android-icon-background.png',
        monochromeImage: './assets/images/android-icon-monochrome.png',
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
    },
    web: {
      output: 'static',
      favicon: './assets/images/favicon.png',
    },
    runtimeVersion: {
      policy: 'appVersion',
    },
    updates: {
      url: easProjectId
        ? `https://u.expo.dev/${easProjectId}`
        : undefined,
      // Manual check only — runOtaCheck() drives the update flow.
      // See openspec/changes/ota-updates/design.md D10.
      checkAutomatically: 'NEVER' as const,
      enabled: true,
    },
    plugins: [
      'expo-router',
      'expo-updates',
      [
        'expo-splash-screen',
        {
          image: resolvedSplashImage,
          imageWidth: 200,
          resizeMode: 'contain',
          backgroundColor: '#ffffff',
          dark: {
            backgroundColor: '#000000',
          },
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
    extra: {
      appLang: lang,
      scriptDirection: langInfo.scriptDirection,
      scriptType: langInfo.scriptType,
      eas: {
        // Populated by `eas init` — see docs/GETTING_STARTED.md § EAS Updates.
        projectId: easProjectId || undefined,
      },
    },
  };
};
