/**
 * Returns the build-language code (e.g. 'eng') from expo-constants.
 * BUILD_LANG is set by app.config.ts from the APP_LANG env var; at runtime it
 * is read from Constants.expoConfig.extra.appLang.
 *
 * Exported so that registerContentNamespaces and useContentT can both read it
 * from the same source without importing expo-constants in every file.
 */
import Constants from 'expo-constants';

export function getBuildLang(): string {
  const extra = Constants.expoConfig?.extra as Record<string, unknown> | null | undefined;
  const lang = extra?.['appLang'] as string | undefined;
  // Fallback should never fire in a real build (APP_LANG is required), but
  // guards against test environments that mount without a full expo config.
  return lang ?? 'eng';
}
