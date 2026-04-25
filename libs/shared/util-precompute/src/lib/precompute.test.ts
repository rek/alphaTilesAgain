/**
 * Unit tests for libs/shared/util-precompute.
 * Covers: register, run, duplicate-key, missing-key, throwing-fn.
 *
 * Note: usePrecompute moved to @alphaTiles/data-language-assets (design §D7).
 * Tests here cover registerPrecompute + runPrecomputes only.
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

// Helper: cast a partial fixture for test purposes
function mockAssets(partial: Record<string, unknown> = {}): unknown {
  return partial;
}

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
    const fake = mockAssets({ lang: 'eng' });
    const fn = jest.fn(() => ({ processed: true }));
    registerPrecompute('mykey', fn);

    const cache = runPrecomputes(fake);
    expect(fn).toHaveBeenCalledWith(fake);
    expect(cache.get('mykey')).toEqual({ processed: true });
  });

  it('populates the global precomputeCache', () => {
    registerPrecompute('k', () => 'value');
    runPrecomputes(mockAssets());
    expect(precomputeCache.get('k')).toBe('value');
  });

  it('clears cache before running (idempotent on re-run)', () => {
    registerPrecompute('x', () => 1);
    runPrecomputes(mockAssets());
    expect(precomputeCache.get('x')).toBe(1);

    registry.clear();
    registerPrecompute('x', () => 2);
    runPrecomputes(mockAssets());
    expect(precomputeCache.get('x')).toBe(2);
  });

  it('throws with key attached when precompute function throws', () => {
    registerPrecompute('bad', () => {
      throw new Error('computation failed');
    });
    expect(() => runPrecomputes(mockAssets())).toThrow(/Precompute "bad" failed/);
    expect(() => runPrecomputes(mockAssets())).toThrow(/computation failed/);
  });

  it('returns the cache map containing all results', () => {
    registerPrecompute('a', () => 1);
    registerPrecompute('b', () => 2);
    const cache = runPrecomputes(mockAssets());
    expect(cache.get('a')).toBe(1);
    expect(cache.get('b')).toBe(2);
  });

  it('passes assets to all registered functions', () => {
    const fake = mockAssets({ tile: 'a' });
    const fnA = jest.fn(() => 'resultA');
    const fnB = jest.fn(() => 'resultB');
    registerPrecompute('p', fnA);
    registerPrecompute('q', fnB);
    runPrecomputes(fake);
    expect(fnA).toHaveBeenCalledWith(fake);
    expect(fnB).toHaveBeenCalledWith(fake);
  });
});

// ---------------------------------------------------------------------------
// Typed registerPrecompute — compile-time check via inference
// ---------------------------------------------------------------------------

describe('typed registerPrecompute', () => {
  it('type parameter flows correctly at compile time', () => {
    type ChileShape = { total: number };
    registerPrecompute<ChileShape, unknown>('chile', () => ({ total: 42 }));
    const cache = runPrecomputes(mockAssets());
    const result = cache.get('chile') as ChileShape;
    expect(result.total).toBe(42);
  });
});

// ---------------------------------------------------------------------------
// Error message contract
// ---------------------------------------------------------------------------

describe('error message contracts', () => {
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
    registerPrecompute('broken', () => {
      throw new Error('inner error');
    });
    let caught: Error | null = null;
    try {
      runPrecomputes(mockAssets());
    } catch (e) {
      caught = e as Error;
    }
    expect(caught).not.toBeNull();
    expect(caught?.message).toMatch(/broken/);
    expect(caught?.message).toMatch(/inner error/);
  });
});
