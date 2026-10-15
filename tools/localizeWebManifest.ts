/**
 * Per-language PWA manifest fields (#47, review A6): the committed
 * apps/alphaTiles/public/manifest.json is a template; every web export
 * overwrites name / short_name / lang / related_applications from the pack.
 *
 * - name: aa_langinfo "Game Name (In Local Lang)", else "Lang Name (In Local Lang)"
 * - lang: canonical BCP-47 for the ethnologue code (eng → en, yue → yue)
 * - related_applications: the Play id in aa_share.txt's link (none → dropped)
 */
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
  const name = info.get('Game Name (In Local Lang)') || info.get('Lang Name (In Local Lang)') || String(manifest['name']);
  const code = info.get('Ethnologue code') ?? '';
  let lang: string | undefined;
  try {
    lang = code ? Intl.getCanonicalLocales(code)[0] : undefined;
  } catch {
    lang = undefined;
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
