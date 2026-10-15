/**
 * Per-language PWA manifest fields (#47, review A6, review-2 U6): the
 * committed apps/alphaTiles/public/manifest.json is a template; every web
 * export overwrites name / short_name / lang / related_applications from the
 * pack (tools/write-web-manifest.ts). generate-lang-manifest also writes the
 * same name / lang to apps/alphaTiles/src/generated/webAppMeta.json for
 * app/+html.tsx (<title>, <html lang>).
 *
 * - name: eng (the generic build) keeps the template's "AlphaTiles"; other
 *   packs use their own name for the language exactly as aa_langinfo spells
 *   it ("Lang Name (In Local Lang)", e.g. 廣東話), else "Game Name (In Local Lang)".
 * - lang: the pack's fixed UI locale when it has one (yue → zh-HK: picks HK
 *   glyphs and a Cantonese screen-reader voice), else canonical BCP-47 for the
 *   ethnologue code (eng → en).
 * - related_applications: the Play id in aa_share.txt's link (none → dropped)
 */
import { chromeLocaleForBuildLang } from '../libs/shared/util-i18n/src/lib/chromeLocaleForBuildLang';

const BRAND_PACK = 'eng';

export function localizeWebManifest(
  manifest: Record<string, unknown>,
  pack: { langInfo: string; share: string },
): Record<string, unknown> {
  const info = new Map<string, string>();
  for (const line of pack.langInfo.replace(/\r\n/g, '\n').split('\n').slice(1)) {
    const tab = line.indexOf('\t');
    if (tab === -1) continue;
    info.set(line.slice(0, tab).replace(/^\d+\.\s*/, '').trim(), line.slice(tab + 1).trim());
  }
  const code = info.get('Ethnologue code') ?? '';
  const name =
    code === BRAND_PACK
      ? String(manifest['name'])
      : info.get('Lang Name (In Local Lang)') || info.get('Game Name (In Local Lang)') || String(manifest['name']);
  let lang: string | undefined = code ? chromeLocaleForBuildLang(code) : undefined;
  if (!lang) {
    try {
      lang = code ? Intl.getCanonicalLocales(code)[0] : undefined;
    } catch {
      lang = undefined;
    }
  }
  const playId = /[?&]id=([\w.]+)/.exec(pack.share)?.[1];

  return {
    ...manifest,
    name,
    short_name: name,
    ...(lang ? { lang } : {}),
    related_applications: playId ? [{ platform: 'play', id: playId }] : [],
  };
}
