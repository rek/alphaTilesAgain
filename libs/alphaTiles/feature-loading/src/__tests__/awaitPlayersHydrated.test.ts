import { usePlayersStore } from '@alphaTiles/data-players';
import { awaitPlayersHydrated } from '../awaitPlayersHydrated';

const persist = usePlayersStore.persist as unknown as {
  hasHydrated: jest.Mock;
  onFinishHydration: jest.Mock;
};

describe('awaitPlayersHydrated', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  });
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
    persist.hasHydrated.mockReturnValue(true);
  });

  it('resolves immediately when already hydrated', async () => {
    persist.hasHydrated.mockReturnValue(true);
    await expect(awaitPlayersHydrated()).resolves.toBeUndefined();
  });

  it('resolves when hydration finishes', async () => {
    persist.hasHydrated.mockReturnValue(false);
    const unsub = jest.fn();
    let listener: () => void = () => undefined;
    persist.onFinishHydration.mockImplementation((fn: () => void) => {
      listener = fn;
      return unsub;
    });
    const p = awaitPlayersHydrated(1000);
    listener();
    await expect(p).resolves.toBeUndefined();
    expect(unsub).toHaveBeenCalled();
  });

  it('resolves after timeout when hydration never finishes', async () => {
    persist.hasHydrated.mockReturnValue(false);
    const unsub = jest.fn();
    persist.onFinishHydration.mockReturnValue(unsub);
    const p = awaitPlayersHydrated(1000);
    jest.advanceTimersByTime(1000);
    await expect(p).resolves.toBeUndefined();
    expect(unsub).toHaveBeenCalled();
  });
});
