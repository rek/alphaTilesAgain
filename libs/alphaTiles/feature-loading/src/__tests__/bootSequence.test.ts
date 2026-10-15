import { bootSequence } from '../bootSequence';
import type { Phase } from '../bootSequence';

function makeOpts(overrides: Partial<Parameters<typeof bootSequence>[0]> = {}) {
  const phases: Phase[] = [];

  return {
    opts: {
      onPhaseChange: (p: Phase) => { phases.push(p); },
      registerContent: jest.fn(),
      awaitAudio: jest.fn().mockResolvedValue(undefined),
      awaitHydration: jest.fn().mockResolvedValue(undefined),
      ...overrides,
    },
    phases,
  };
}

describe('bootSequence', () => {
  it('emits phases in order', async () => {
    const { opts, phases } = makeOpts();
    await bootSequence(opts);
    expect(phases).toEqual(['fonts', 'i18n', 'audio', 'precompute', 'hydration', 'done']);
  });

  it('calls registerContent exactly once', async () => {
    const { opts } = makeOpts();
    await bootSequence(opts);
    expect(opts.registerContent).toHaveBeenCalledTimes(1);
  });

  it('calls awaitAudio and waits for it to resolve', async () => {
    let resolved = false;
    const { opts } = makeOpts({
      awaitAudio: () => new Promise<void>((res) => setTimeout(() => { resolved = true; res(); }, 0)),
    });
    await bootSequence(opts);
    expect(resolved).toBe(true);
  });

  it('calls awaitHydration', async () => {
    const { opts } = makeOpts();
    await bootSequence(opts);
    expect(opts.awaitHydration).toHaveBeenCalledTimes(1);
  });
});

describe('bootSequence – error propagation', () => {
  it('rejects and stops emitting phases when awaitAudio throws', async () => {
    const { opts, phases } = makeOpts({
      awaitAudio: jest.fn().mockRejectedValue(new Error('audio fail')),
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
