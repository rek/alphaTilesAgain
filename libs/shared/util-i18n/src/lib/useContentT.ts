/**
 * useContentT — ergonomic hook for content-namespace lookups.
 *
 * Returns a translation function identical in signature to react-i18next's `t`
 * but with `lng` pre-bound to BUILD_LANG (e.g. 'eng'). Call sites write:
 *
 *   const tContent = useContentT();
 *   tContent('tile:a');           // ← equivalent to t('tile:a', { lng: 'eng' })
 *   tContent('word:cat.lwc');
 *
 * For chrome strings, use the plain useTranslation hook instead:
 *
 *   const { t } = useTranslation();
 *   t('chrome:back');
 *
 * Implements design.md §D5.
 */

import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type { TOptions } from 'i18next';
import { getBuildLang } from './getBuildLang';

export function useContentT(): (key: string, opts?: TOptions) => string {
  const { t } = useTranslation();
  const buildLang = getBuildLang();

  return useCallback(
    (key: string, opts?: TOptions) => t(key, { lng: buildLang, ...opts }),
    [t, buildLang],
  );
}
