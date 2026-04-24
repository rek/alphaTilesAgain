import { bootSequence } from '../bootSequence';
import type { Phase } from '../bootSequence';

function makeOpts(overrides: Partial<Parameters<typeof bootSequence>[0]> = {}) {
  const phases: Phase[] = [];
  const audioProgressCalls: Array<[number, number]> = [];

  return {
    opts: {
      platform: 'native' as const,
      onPhaseChange: (p: Phase) => { phases.push(p); },
      onAudioProgress: (loaded: number, total: number) => { audioProgressCalls.push([loaded, total]); },
      registerContent: jest.fn(),
      loadAudio: jest.fn().mockResolvedValue(undefined),
      awaitHydration: jest.fn().mockResolvedValue(undefined),
      ...overrides,
    },
    phases,
    audioProgressCalls,
  };
}

describe('bootSequence – native path', () => {
  it('emits phases in order without web-gate', async () => {
    const { opts, phases } = makeOpts();
    await bootSequence(opts);
    expect(phases).toEqual(['fonts', 'i18n', 'audio', 'precompute', 'hydration', 'done']);
  });

  it('calls registerContent exactly once', async () => {
    const { opts } = makeOpts();
    await bootSequence(opts);
    expect(opts.registerContent).toHaveBeenCalledTimes(1);
  });

  it('calls loadAudio and threads onAudioProgress', async () => {
    const { opts, audioProgressCalls } = makeOpts({
      loadAudio: jest.fn().mockImplementation(async (onProgress) => {
        onProgress(1, 10);
        onProgress(10, 10);
      }),
    });
    await bootSequence(opts);
    expect(opts.loadAudio).toHaveBeenCalledTimes(1);
    expect(audioProgressCalls).toEqual([[1, 10], [10, 10]]);
  });

  it('calls awaitHydration', async () => {
    const { opts } = makeOpts();
    await bootSequence(opts);
    expect(opts.awaitHydration).toHaveBeenCalledTimes(1);
  });
});

describe('bootSequence – web path', () => {
  it('inserts web-gate phase between i18n and audio', async () => {
    const { opts, phases } = makeOpts({
      platform: 'web',
      waitForWebGesture: jest.fn().mockResolvedValue(undefined),
    });
    await bootSequence(opts);
    expect(phases).toEqual(['fonts', 'i18n', 'web-gate', 'audio', 'precompute', 'hydration', 'done']);
  });

  it('awaits the web gesture promise', async () => {
    let resolved = false;
    const { opts } = makeOpts({
      platform: 'web',
      waitForWebGesture: () => new Promise<void>((res) => setTimeout(() => { resolved = true; res(); }, 0)),
    });
    await bootSequence(opts);
    expect(resolved).toBe(true);
  });

  it('skips web-gate when platform is native even if waitForWebGesture provided', async () => {
    const { opts, phases } = makeOpts({
      platform: 'native',
      waitForWebGesture: jest.fn().mockResolvedValue(undefined),
    });
    await bootSequence(opts);
    expect(phases).not.toContain('web-gate');
    expect(opts.waitForWebGesture).not.toHaveBeenCalled();
  });
});

describe('bootSequence – error propagation', () => {
  it('rejects and stops emitting phases when loadAudio throws', async () => {
    const { opts, phases } = makeOpts({
      loadAudio: jest.fn().mockRejectedValue(new Error('audio fail')),
    });
    await expect(bootSequence(opts)).rejects.toThrow('audio fail');
    expect(phases).not.toContain('done');
  });

  it('rejects when awaitHydration throws', async () => {
    const { opts } = makeOpts({
      awaitHydration: jest.fn().mockRejectedValue(new Error('hydration fail')),
    });
    await expect(bootSequence(opts)).rejects.toThrow('hydration fail');
  });
});
