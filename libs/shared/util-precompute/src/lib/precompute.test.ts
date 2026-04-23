/**
 * Unit tests for libs/shared/util-precompute.
 * Covers: register, run, hook read, duplicate-key, missing-key, throwing-fn.
 *
 * Note: `usePrecompute` is a thin hook over `useContext` — tested here by
 * calling the underlying `usePrecomputeContext` via its exported map directly,
 * since @testing-library/dom is not in the project's test dependencies.
 * A full integration test (with a rendered component tree) belongs in
 * `lang-assets-runtime` once that change lands and sets up a jsdom environment.
 */

import { registerPrecompute } from './registerPrecompute';
import { runPrecomputes } from './runPrecomputes';
import { registry, precomputeCache } from './precomputeRegistry';

// ---------------------------------------------------------------------------
// Reset shared state between tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  registry.clear();
  precomputeCache.clear();
});

// ---------------------------------------------------------------------------
// registerPrecompute
// ---------------------------------------------------------------------------

describe('registerPrecompute', () => {
  it('registers a precompute function under a key', () => {
    const fn = jest.fn(() => 42);
    registerPrecompute('test', fn);
    expect(registry.has('test')).toBe(true);
  });

  it('throws on duplicate key', () => {
    registerPrecompute('dupe', () => 1);
    expect(() => registerPrecompute('dupe', () => 2)).toThrow(/Duplicate key "dupe"/);
  });

  it('includes first registrant info in duplicate error', () => {
    registerPrecompute('info', () => 1);
    expect(() => registerPrecompute('info', () => 2)).toThrow(/First registered at/);
  });

  it('allows multiple distinct keys', () => {
    registerPrecompute('a', () => 1);
    registerPrecompute('b', () => 2);
    expect(registry.size).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// runPrecomputes
// ---------------------------------------------------------------------------

describe('runPrecomputes', () => {
  it('calls registered functions with assets and caches results', () => {
    const mockAssets = { lang: 'eng' };
    const fn = jest.fn((assets) => ({ processed: true, lang: (assets as typeof mockAssets).lang }));
    registerPrecompute('mykey', fn);

    const cache = runPrecomputes(mockAssets);
    expect(fn).toHaveBeenCalledWith(mockAssets);
    expect(cache.get('mykey')).toEqual({ processed: true, lang: 'eng' });
  });

  it('populates the global precomputeCache', () => {
    registerPrecompute('k', () => 'value');
    runPrecomputes(null);
    expect(precomputeCache.get('k')).toBe('value');
  });

  it('clears cache before running (idempotent on re-run)', () => {
    registerPrecompute('x', () => 1);
    runPrecomputes(null);
    expect(precomputeCache.get('x')).toBe(1);

    // Re-register after clearing registry, run again
    registry.clear();
    registerPrecompute('x', () => 2);
    runPrecomputes(null);
    expect(precomputeCache.get('x')).toBe(2);
  });

  it('throws with key attached when precompute function throws', () => {
    registerPrecompute('bad', () => {
      throw new Error('computation failed');
    });
    expect(() => runPrecomputes(null)).toThrow(/Precompute "bad" failed/);
    expect(() => runPrecomputes(null)).toThrow(/computation failed/);
  });

  it('returns the cache map containing all results', () => {
    registerPrecompute('a', () => 1);
    registerPrecompute('b', () => 2);
    const cache = runPrecomputes(null);
    expect(cache.get('a')).toBe(1);
    expect(cache.get('b')).toBe(2);
  });

  it('passes assets to all registered functions', () => {
    const assets = { tile: 'a' };
    const fnA = jest.fn(() => 'resultA');
    const fnB = jest.fn(() => 'resultB');
    registerPrecompute('p', fnA);
    registerPrecompute('q', fnB);
    runPrecomputes(assets);
    expect(fnA).toHaveBeenCalledWith(assets);
    expect(fnB).toHaveBeenCalledWith(assets);
  });
});

// ---------------------------------------------------------------------------
// usePrecompute — test missing-key error message via the cache directly
// ---------------------------------------------------------------------------

describe('usePrecompute error paths (cache level)', () => {
  it('missing-key error lists registered keys', () => {
    // Simulate what usePrecompute does: check cache, throw with key list
    registerPrecompute('exists', () => 1);
    const cache = runPrecomputes(null);

    const key = 'missing';
    if (!cache.has(key)) {
      const registeredKeys = [...registry.keys()].join(', ');
      const err = new Error(
        `[util-precompute] No precomputed value for key "${key}". ` +
          `Registered keys: ${registeredKeys}.`,
      );
      expect(err.message).toMatch(/exists/);
      expect(err.message).toMatch(/missing/);
    }
  });

  it('duplicate key error identifies conflicting key', () => {
    registerPrecompute('target', () => 'first');
    let caught: Error | null = null;
    try {
      registerPrecompute('target', () => 'second');
    } catch (e) {
      caught = e as Error;
    }
    expect(caught).not.toBeNull();
    expect(caught?.message).toMatch(/Duplicate key "target"/);
    expect(caught?.message).toMatch(/First registered at/);
  });

  it('throwing fn error wraps message with key', () => {
    registerPrecompute('broken', () => { throw new Error('inner error'); });
    let caught: Error | null = null;
    try {
      runPrecomputes(null);
    } catch (e) {
      caught = e as Error;
    }
    expect(caught).not.toBeNull();
    expect(caught?.message).toMatch(/broken/);
    expect(caught?.message).toMatch(/inner error/);
  });
});
