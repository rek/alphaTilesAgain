/**
 * app.config.ts — dynamic Expo configuration.
 *
 * Reads APP_LANG from env, loads languages/<APP_LANG>/aa_langinfo.txt via the
 * lang-pack-parser library, resolves display name / slug / bundle IDs / RTL flag.
 * RTL forcing happens in the app entry (_layout.tsx) via I18nManager.forceRTL —
 * this config only passes scriptDirection through extra so the entry can read it.
 *
 * OTA updates (expo-updates):
 *   - runtimeVersion.policy = "appVersion" — updates pool by APP_VERSION below.
 *     Bump APP_VERSION for every native release (store build), never for OTA.
 *   - updates.checkAutomatically = "NEVER" — the loading screen runs runOtaCheck()
 *     on launch (native), downloads in the background, and expo-updates applies
 *     the update on the next cold start. No mid-session reload.
 *   - extra.eas.projectId must be set (run `eas init` once — see docs/GETTING_STARTED.md).
 *   - One channel per language build: `<APP_LANG>-production` (eas.json build profiles
 *     set it on the binary; `eas update --channel <APP_LANG>-production` publishes to it).
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

// Store identity. Android package / iOS bundle ID are permanent once published.
// The primary pack (yue, first store release) owns the bare ID; every other pack
// gets `<base>.<lang>`. Keep languages/<lang>/aa_share.txt in sync.
const APP_ID_BASE = 'com.makektm.alphatiles';
const PRIMARY_PACK = 'yue';

// Marketing version + OTA runtime version (runtimeVersion policy "appVersion").
// Bump on every native release so OTA updates never reach an older binary.
// Android versionCode is auto-incremented remotely by EAS (apps/alphaTiles/eas.json).
const APP_VERSION = '1.0.0';

function resolveAppId(lang: string): string {
  return lang === PRIMARY_PACK ? APP_ID_BASE : `${APP_ID_BASE}.${lang}`;
}

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

  // EAS projectId: EAS_PROJECT_ID env (CI / EAS secrets) wins, else the committed
  // project below. Owner-only: `eas init` / project creation (see docs/GETTING_STARTED.md
  // § EAS Updates). Without a projectId, updates.url is omitted and OTA stays inert.
  const easProjectId = process.env.EAS_PROJECT_ID ?? 'a396d678-4f3e-4588-bd7f-5f79daa04c57';
  // One update channel per language build; must match "channel" in eas.json build profiles.
  const updateChannel = `${lang}-production`;

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

  const appId = resolveAppId(lang);

  return {
    ...config,
    name: langInfo.gameNameInLocalLang || langInfo.nameInLocalLang,
    owner: 'alpha-tiles',
    slug: 'alpha-tiles-again',
    version: APP_VERSION,
    orientation: 'portrait',
    icon: resolvedIcon,
    scheme: `alphatiles-${lang}`,
    userInterfaceStyle: 'automatic',
    // newArchEnabled is supported by Expo runtime but not in @expo/config-types yet.
    ...({ newArchEnabled: true } as Record<string, unknown>),
    ios: {
      supportsTablet: true,
      bundleIdentifier: appId,
    },
    android: {
      package: appId,
      adaptiveIcon: {
        backgroundColor: '#E6F4FE',
        foregroundImage: './assets/images/android-icon-foreground.png',
        backgroundImage: './assets/images/android-icon-background.png',
        monochromeImage: './assets/images/android-icon-monochrome.png',
      },
      // edgeToEdgeEnabled landed in Expo 53/54 Android config but isn't in
      // @expo/config-types yet (as of our pin). Cast keeps the runtime value.
      ...({ edgeToEdgeEnabled: true } as Record<string, unknown>),
      predictiveBackGestureEnabled: false,
      // Kids' app: strip permissions we don't use. blockedPermissions emits
      // tools:node="remove", so library manifests / plugins can't re-add them.
      // MODIFY_AUDIO_SETTINGS (expo-audio) and INTERNET (OTA) stay.
      blockedPermissions: [
        'android.permission.RECORD_AUDIO',
        'android.permission.FOREGROUND_SERVICE',
        'android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK',
        'android.permission.FOREGROUND_SERVICE_MICROPHONE',
        'android.permission.POST_NOTIFICATIONS',
        'android.permission.SYSTEM_ALERT_WINDOW',
        'android.permission.READ_EXTERNAL_STORAGE',
        'android.permission.WRITE_EXTERNAL_STORAGE',
        'android.permission.VIBRATE',
      ],
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
      // Manual check only — LoadingContainer calls runOtaCheck({ reload: false })
      // on launch; downloaded updates apply on next cold start.
      checkAutomatically: 'NEVER' as const,
      enabled: true,
    },
    plugins: [
      'expo-router',
      'expo-updates',
      [
        'expo-audio',
        {
          // No recording, no background playback: drops mic + foreground-service perms/service.
          microphonePermission: false,
          recordAudioAndroid: false,
          enableBackgroundPlayback: false,
          enableBackgroundRecording: false,
        },
      ],
      'expo-localization',
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
      // Required for correct HTML asset paths on sub-path deploys (e.g. GitHub Pages).
      // EXPO_BASE_URL must include the full path: /repoName/appSlug.
      // Without this, getBaseUrlFromExpoConfig() returns '' and all <script src>/<link href>
      // are root-absolute, making them 404 on GitHub Pages.
      baseUrl: process.env.EXPO_BASE_URL ?? '',
    },
    extra: {
      appLang: lang,
      scriptDirection: langInfo.scriptDirection,
      scriptType: langInfo.scriptType,
      updateChannel,
      eas: {
        // Populated by `eas init` — see docs/GETTING_STARTED.md § EAS Updates.
        projectId: easProjectId || undefined,
      },
    },
  };
};
