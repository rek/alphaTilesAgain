/**
 * Boot-time provider that materializes the language pack once and exposes
 * the result to the entire component tree via React Context.
 *
 * Mount once at the app root, above expo-router's <Stack>.
 * Every descendant can call useLangAssets() to read the pack.
 *
 * No useEffect — initialization happens inside useMemo([]) (one-shot).
 * If loadLangPack throws (bad pack or precompute failure), renders <ErrorScreen>.
 *
 * See design.md §D4 and §D6.
 */

import React, { createContext, useContext, useMemo } from 'react';
import { langManifest } from '@generated/langManifest';
import { loadLangPack } from '@alphaTiles/data-language-pack';
import type { LangAssets } from '@alphaTiles/data-language-pack';
import { ErrorScreen } from './ErrorScreen';

export const LangAssetsContext = createContext<LangAssets | null>(null);

export function LangAssetsProvider(props: {
  children: React.ReactNode;
}): React.JSX.Element {
  const result = useMemo(() => {
    try {
      return { ok: true as const, assets: loadLangPack(langManifest) };
    } catch (err) {
      return { ok: false as const, err: err instanceof Error ? err : new Error(String(err)) };
    }
  }, []);

  if (!result.ok) {
    return <ErrorScreen error={result.err} />;
  }

  return (
    <LangAssetsContext.Provider value={result.assets}>
      {props.children}
    </LangAssetsContext.Provider>
  );
}

export function useLangAssets(): LangAssets {
  const v = useContext(LangAssetsContext);
  if (v === null) {
    throw new Error('useLangAssets must be used inside <LangAssetsProvider>');
  }
  return v;
}
