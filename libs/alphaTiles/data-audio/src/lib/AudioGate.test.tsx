/**
 * @jest-environment jsdom
 *
 * AudioGate through its interface: <AudioProvider loader> + <AudioGate
 * renderLocked>…children…</AudioGate>, web and native, fake timers for the
 * chunked priming. Rendered with react-dom (no @types/react-test-renderer).
 */
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import type { Root } from 'react-dom/client';
import { Platform } from 'react-native';
import { track } from '@shared/util-analytics';
import { AudioProvider } from './AudioProvider';
import { AudioGate } from './AudioGate';
import type { AudioHandles } from './AudioHandles';
import type { SoundHandle } from './SoundHandle';

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

function clip() {
  const media = { muted: false, play: jest.fn(() => Promise.resolve()), pause: jest.fn() };
  return { media, volume: 1, play: jest.fn(), pause: jest.fn() } as unknown as SoundHandle & {
    media: typeof media;
  };
}

function handlesWith(clipCount: number) {
  const clips = Array.from({ length: clipCount }, clip);
  const handles = {
    tiles: new Map(),
    words: new Map(),
    syllables: new Map(),
    instructions: new Map(),
    pool: { liveHandles: () => clips },
    chimes: { correct: clip(), incorrect: clip(), correctFinal: clip() },
    durations: { tiles: new Map(), words: new Map(), syllables: new Map(), instructions: new Map() },
  } as unknown as AudioHandles;
  return { handles, clips };
}

/** Loader the test settles by hand, reporting progress like preloadAudio. */
function controlledLoader() {
  let report: (loaded: number, total: number) => void = () => undefined;
  let settle: (h: AudioHandles) => void = () => undefined;
  let fail: (e: Error) => void = () => undefined;
  const loader = (onProgress: (loaded: number, total: number) => void) => {
    report = onProgress;
    return new Promise<AudioHandles>((resolve, reject) => {
      settle = resolve;
      fail = reject;
    });
  };
  return {
    loader,
    progress: (loaded: number, total: number) => act(() => report(loaded, total)),
    resolve: (h: AudioHandles) => act(async () => settle(h)),
    reject: (e: Error) => act(async () => fail(e)),
  };
}

let container: HTMLDivElement;
let root: Root;
let gate: Parameters<Parameters<typeof AudioGate>[0]['renderLocked']>[0] | null;

function mount(loader: ReturnType<typeof controlledLoader>['loader']) {
  act(() => {
    root.render(
      <AudioProvider loader={loader}>
        <AudioGate
          renderLocked={(g) => {
            gate = g;
            return <p>locked</p>;
          }}
        >
          <p>app</p>
        </AudioGate>
      </AudioProvider>,
    );
  });
}

const text = () => container.textContent;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  gate = null;
  jest.mocked(track).mockClear();
  Platform.OS = 'web';
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  jest.useRealTimers();
});

describe('AudioGate – native', () => {
  it('renders children at once, never the locked surface, never tracks', () => {
    Platform.OS = 'android';
    mount(controlledLoader().loader);
    expect(text()).toBe('app');
    expect(gate).toBeNull();
    expect(track).not.toHaveBeenCalled();
  });
});

describe('AudioGate – web', () => {
  it('locks every route (no children) and reports preload progress until ready', () => {
    const l = controlledLoader();
    mount(l.loader);
    expect(text()).toBe('locked');
    expect(gate?.isReady).toBe(false);
    l.progress(43, 100);
    expect(gate?.percent).toBe(43);
  });

  it('ignores the tap while preload is in flight', () => {
    mount(controlledLoader().loader);
    act(() => gate?.unlock());
    expect(text()).toBe('locked');
    expect(track).not.toHaveBeenCalled();
  });

  it('after preload, the tap primes every clip in chunks, tracks once and opens', async () => {
    jest.useFakeTimers();
    const l = controlledLoader();
    const { handles, clips } = handlesWith(427); // + 3 chimes = 430 (yue-sized)
    mount(l.loader);
    await l.resolve(handles);
    expect(gate?.isReady).toBe(true);

    act(() => gate?.unlock());
    expect(text()).toBe('app');
    expect(track).toHaveBeenCalledTimes(1);
    expect(track).toHaveBeenCalledWith('audio_unlock_web', {
      millisecondsSinceBoot: expect.any(Number),
    });

    // First chunk of 40 inside the gesture (3 chimes first), rest on timers.
    const primed = () => clips.filter((c) => c.media.play.mock.calls.length > 0).length;
    const chime = handles.chimes.correct as ReturnType<typeof clip>;
    expect(chime.media.play).toHaveBeenCalledTimes(1);
    expect(primed()).toBe(37);
    act(() => jest.advanceTimersByTime(999)); // inside WebKit's 1 s gesture window
    expect(primed()).toBe(427);
    expect(clips.every((c) => c.media.muted === false)).toBe(true);
  });

  it('still opens (nothing to prime) when preload failed', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    const l = controlledLoader();
    mount(l.loader);
    await l.reject(new Error('net'));
    expect(gate?.isReady).toBe(true);
    act(() => gate?.unlock());
    expect(text()).toBe('app');
    expect(track).toHaveBeenCalledTimes(1);
    warn.mockRestore();
  });
});
