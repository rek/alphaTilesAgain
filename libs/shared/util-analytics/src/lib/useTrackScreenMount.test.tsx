/**
 * Unit tests for useTrackScreenMount.
 *
 * Task 8.2: hook renders once → screen(name) called once.
 *
 * Uses React.createElement + react-dom/client to render in jsdom
 * without requiring @types/react-test-renderer.
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import { useTrackScreenMount } from './useTrackScreenMount';

// Tell React that this is a test environment so act() works correctly.
// See: https://reactjs.org/link/wrap-tests-with-act
declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
import { setAnalyticsAdapter } from './setAnalyticsAdapter';
import { setAnalyticsEnabled } from './setAnalyticsEnabled';
import { noopAdapter } from './analyticsRegistry';

// Minimal component that exercises the hook
function TestComponent({ name }: { name: string }) {
  useTrackScreenMount(name);
  return null;
}

let container: HTMLDivElement;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  setAnalyticsAdapter(noopAdapter);
  setAnalyticsEnabled(false);
  jest.clearAllMocks();
});

afterEach(() => {
  document.body.removeChild(container);
});

describe('useTrackScreenMount', () => {
  it('calls screen(name) once on mount when analytics enabled', () => {
    const spy = {
      track: jest.fn(),
      identify: jest.fn(),
      screen: jest.fn(),
    };
    setAnalyticsAdapter(spy);
    setAnalyticsEnabled(true);

    act(() => {
      createRoot(container).render(<TestComponent name="/choose-player" />);
    });

    expect(spy.screen).toHaveBeenCalledTimes(1);
    expect(spy.screen).toHaveBeenCalledWith('/choose-player', undefined);
  });

  it('does not call screen when analytics disabled', () => {
    const spy = {
      track: jest.fn(),
      identify: jest.fn(),
      screen: jest.fn(),
    };
    setAnalyticsAdapter(spy);
    // analyticsEnabled = false (default)

    act(() => {
      createRoot(container).render(<TestComponent name="/" />);
    });

    expect(spy.screen).not.toHaveBeenCalled();
  });

  it('does not re-fire screen on re-render with same name', () => {
    const spy = {
      track: jest.fn(),
      identify: jest.fn(),
      screen: jest.fn(),
    };
    setAnalyticsAdapter(spy);
    setAnalyticsEnabled(true);

    const root = createRoot(container);
    act(() => {
      root.render(<TestComponent name="/game/41" />);
    });
    act(() => {
      root.render(<TestComponent name="/game/41" />);
    });
    act(() => {
      root.render(<TestComponent name="/game/41" />);
    });

    expect(spy.screen).toHaveBeenCalledTimes(1);
  });
});
