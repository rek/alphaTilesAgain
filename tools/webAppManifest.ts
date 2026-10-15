/**
 * Per-pack web app manifest (PWA name / short name / document language).
 *
 * Written to apps/alphaTiles/public/manifest.json by generate-lang-manifest on
 * every build; `app/+html.tsx` imports the same file for <title> and
 * <html lang>, so the tab, the install prompt and the screen-reader language
 * all come from one place.
 *
 * - eng (the primary, multi-pack brand build) keeps "AlphaTiles".
 * - Other packs: `Game Name (In Local Lang)`, else `Lang Name (In Local Lang)`.
 * - lang: the pack's fixed chrome locale (yue → zh-HK), else "en".
 */
import { parseLangInfo } from '../libs/shared/util-lang-pack-parser/src';
import { chromeLocaleForBuildLang } from '../libs/shared/util-i18n/src/lib/chromeLocaleForBuildLang';

const BRAND = 'AlphaTiles';
/** The generic AlphaTiles build: keeps the brand name. */
const BRAND_PACK = 'eng';
/** Keep in sync with apps/alphaTiles/app.config.ts resolveAppId (PRIMARY_PACK gets the bare id). */
const APP_ID_BASE = 'com.makektm.alphatiles';
const APP_ID_PRIMARY_PACK = 'yue';
/** Keep in sync with app/+html.tsx THEME_COLOR (palette[0]). */
const THEME_COLOR = '#9C27B0';

export function webAppManifest({ lang, langInfoSrc }: { lang: string; langInfoSrc: string }) {
  const info = parseLangInfo(langInfoSrc);
  const packName =
    info.find('Game Name (In Local Lang)')?.trim() || info.find('Lang Name (In Local Lang)')?.trim() || BRAND;
  const name = lang === BRAND_PACK ? BRAND : packName;
  return {
    name,
    short_name: name,
    description: 'Literacy games for minority language communities',
    lang: chromeLocaleForBuildLang(lang) ?? 'en',
    start_url: './',
    scope: './',
    display: 'standalone',
    orientation: 'portrait',
    theme_color: THEME_COLOR,
    background_color: '#ffffff',
    icons: [
      { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    ],
    prefer_related_applications: false,
    related_applications: [
      {
        platform: 'play',
        id: lang === APP_ID_PRIMARY_PACK ? APP_ID_BASE : `${APP_ID_BASE}.${lang}`,
      },
    ],
  };
}
