const BRAND = 'AlphaTiles';
const BRAND_PACK = 'eng';

/**
 * Name the boot / tap-to-begin screens show for this build. Same rule as the
 * web <title> and PWA manifest (tools/localizeWebManifest.ts): the generic eng
 * build is "AlphaTiles"; other packs use their own name for the language as
 * aa_langinfo spells it (yue → 廣東話), else their game name.
 */
export function packDisplayName(langInfo: { find: (label: string) => string | undefined }) {
  if (langInfo.find('Ethnologue code')?.trim() === BRAND_PACK) return BRAND;
  return (
    langInfo.find('Lang Name (In Local Lang)')?.trim() ||
    langInfo.find('Game Name (In Local Lang)')?.trim() ||
    BRAND
  );
}
