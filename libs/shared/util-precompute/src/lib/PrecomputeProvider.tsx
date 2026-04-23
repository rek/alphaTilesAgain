/**
 * PrecomputeProvider — wraps the app to make precompute results available via
 * `usePrecompute`. The lang-assets runtime mounts this after `runPrecomputes`
 * has populated the cache.
 *
 * This is an internal implementation detail — not exported from the library root.
 * External code uses `usePrecompute` only.
 */

import React, { createContext, useContext } from 'react';
import { precomputeCache } from './precomputeRegistry';

export const PrecomputeContext = createContext<Map<string, unknown> | null>(null);

type PrecomputeProviderProps = {
  children: React.ReactNode;
  /** Pass the cache returned by runPrecomputes. Defaults to the global cache. */
  cache?: Map<string, unknown>;
};

export function PrecomputeProvider({ children, cache = precomputeCache }: PrecomputeProviderProps): React.JSX.Element {
  return (
    <PrecomputeContext.Provider value={cache}>
      {children}
    </PrecomputeContext.Provider>
  );
}

/** Internal hook — returns the context map, throwing if not inside a provider. */
export function usePrecomputeContext(): Map<string, unknown> {
  const ctx = useContext(PrecomputeContext);
  if (ctx === null) {
    throw new Error(
      '[util-precompute] usePrecompute called outside of PrecomputeProvider. ' +
        'Ensure PrecomputeProvider wraps the component tree.',
    );
  }
  return ctx;
}
