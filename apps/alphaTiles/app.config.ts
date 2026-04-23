/**
 * app.config.ts — dynamic Expo configuration.
 *
 * Reads APP_LANG from env, loads languages/<APP_LANG>/aa_langinfo.txt via the
 * lang-pack-parser library, resolves display name / slug / bundle IDs / RTL flag.
 * RTL forcing happens in the app entry (_layout.tsx) via I18nManager.forceRTL —
 * this config only passes scriptDirection through extra so the entry can read it.
 *
 * See design.md §D3 and openspec/changes/port-foundations/specs/build-pipeline/spec.md.
 *
 * Throws at build time if:
 *   - APP_LANG is not set
 *   - languages/<APP_LANG>/aa_langinfo.txt is missing or unparseable
 */

import type { ConfigContext, ExpoConfig } from 'expo/config';
import * as fs from 'fs';
import * as path from 'path';

import { parseLangInfo } from '../../libs/shared/util-lang-pack-parser/src';

export default ({ config }: ConfigContext): ExpoConfig => {
  const lang = process.env.APP_LANG;
  if (!lang) {
    throw new Error(
      'APP_LANG env var is not set. ' +
        'See docs/GETTING_STARTED.md for setup instructions.',
    );
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
    plugins: [
      'expo-router',
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
    },
  };
};
