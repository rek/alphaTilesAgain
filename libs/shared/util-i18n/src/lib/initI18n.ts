/**
 * initI18n — boot the i18next singleton.
 *
 * Called once at app entry (apps/alphaTiles/app/_layout.tsx) alongside font
 * loading. Idempotent — subsequent calls resolve immediately (i18next guards
 * re-init internally).
 *
 * Chrome resources (locales/en.json) are bundled via ESM JSON import (works
 * under Metro, Vite/Storybook, and ts-jest). Content namespaces (tile, word,
 * syllable, game, langMeta) register later via registerContentNamespaces()
 * once the lang pack is parsed.
 *
 * Implements design.md §D1, §D7, §D8, §D9.
 */

import { initReactI18next } from 'react-i18next';
import enChrome from '../../../../../locales/en.json';
import { i18n } from './i18nInstance';

// React Native / Metro global — declared here so TS can see it.
// In tests, set via `(global as unknown as Record<string, unknown>)['__DEV__']`.
declare const __DEV__: boolean;

const NAMESPACES = ['chrome', 'tile', 'word', 'syllable', 'game', 'langMeta'] as const;

/**
 * Extract the primary language subtag from a BCP-47 locale string.
 * 'en-US' → 'en', 'zh-TW' → 'zh', 'und' → 'en' (fallback).
 */
function primarySubtag(locale: string): string {
  if (!locale || locale === 'und' || locale === 'C' || locale.trim() === '') {
    return 'en';
  }
  const primary = locale.split('-')[0].trim();
  return primary || 'en';
}

export interface InitI18nOptions {
  /** Device locale string from expo-localization (e.g. 'en-US', 'zh-TW'). */
  deviceLocale: string;
  /** Fallback locale — defaults to 'en'. */
  fallbackLocale?: string;
}

export async function initI18n({
  deviceLocale,
  fallbackLocale = 'en',
}: InitI18nOptions): Promise<void> {
  if (i18n.isInitialized) {
    return;
  }

  const lng = primarySubtag(deviceLocale);

  const missingKeyHandler = (
    lngs: readonly string[],
    ns: string,
    key: string,
  ): void => {
    if (__DEV__) {
      throw new Error(
        `[util-i18n] Missing i18n key: ${ns}:${key} (langs: ${lngs.join(', ')})`,
      );
    }
    // Production: i18next's default fallback to the key literal fires automatically.
  };

  await i18n.use(initReactI18next).init({
    lng,
    fallbackLng: fallbackLocale,
    ns: NAMESPACES,
    defaultNS: 'chrome',
    resources: {
      en: {
        chrome: enChrome.chrome,
      },
    },
    interpolation: {
      escapeValue: false,
    },
    missingKeyHandler,
    // Prevent i18next from logging missing-key warnings in production — we
    // handle them ourselves in missingKeyHandler above.
    saveMissing: true,
    // Don't return the raw key on miss — let missingKeyHandler fire first.
    parseMissingKeyHandler: (key: string) => key,
  });
}
