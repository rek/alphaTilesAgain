/**
 * registerContentNamespaces — register parsed lang-pack content into i18next.
 *
 * Called once per pack boot by data-language-assets after parsing. If called a
 * second time (dev hot-reload / pack swap), each namespace is fully replaced —
 * not merged — via removeResourceBundle + addResourceBundle. This guarantees a
 * clean slate: stale keys from the previous registration do not survive.
 * Implements design.md §D4.
 *
 * Content keys use BUILD_LANG (e.g. 'eng') as the i18next language key, which
 * differs from the chrome language (device locale). Call sites that need content
 * strings must either use useContentT() or pass { lng: BUILD_LANG } explicitly.
 */

import { i18n } from './i18nInstance';
import { getBuildLang } from './getBuildLang';

export interface ContentNamespaces {
  /** Flat map: tile id → display text; sub-keys via dot notation (e.g. 'a.upper'). */
  tile: Record<string, string>;
  /** Flat map: word id → display text; sub-keys for lwc variant (e.g. 'cat.lwc'). */
  word: Record<string, string>;
  /** Flat map: syllable id → display text. */
  syllable: Record<string, string>;
  /** Flat map: door number string → game instruction (e.g. '1.instruction'). */
  game: Record<string, string>;
  /** Flat map: langMeta field → value (e.g. 'name_local', 'name_english'). */
  langMeta: Record<string, string>;
}

export function registerContentNamespaces(namespaces: ContentNamespaces): void {
  const buildLang = getBuildLang();
  const nsList = ['tile', 'word', 'syllable', 'game', 'langMeta'] as const;

  for (const ns of nsList) {
    // Remove the existing bundle first to guarantee a clean slate (design.md §D4).
    // addResourceBundle alone with overwrite:true still merges when deep:false.
    if (i18n.hasResourceBundle(buildLang, ns)) {
      i18n.removeResourceBundle(buildLang, ns);
    }
    // Add the new bundle. deep:false, overwrite:true — flat bundle, full replace.
    i18n.addResourceBundle(buildLang, ns, namespaces[ns], false, true);
  }
}
