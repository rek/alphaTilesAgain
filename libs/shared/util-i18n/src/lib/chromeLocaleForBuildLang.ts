/**
 * chromeLocaleForBuildLang — build-language → default chrome locale override.
 *
 * Some packs ship to an audience whose UI language is fixed by the pack, not
 * the device (e.g. the yue/Cantonese build shows zh-HK chrome even on an
 * English-locale phone). Returns undefined when the build has no override, in
 * which case the device locale decides. Keys missing from the override bundle
 * still fall back to English via i18next fallbackLng.
 */

const BUILD_LANG_CHROME_LOCALE: Readonly<Record<string, string>> = {
  yue: 'zh-HK',
};

export function chromeLocaleForBuildLang(buildLang: string): string | undefined {
  return BUILD_LANG_CHROME_LOCALE[buildLang];
}
