/**
 * Unit tests for reportApplyIfNeeded.
 *
 * AsyncStorage and expo-updates are mocked at the module boundary.
 * Covers first-launch, stable-launch, and post-update-launch scenarios.
 *
 * Scenarios map to openspec/changes/ota-updates/specs/ota-updates/spec.md
 * § "Update-applied detection across reload boundary".
 */

import { reportApplyIfNeeded } from './reportApplyIfNeeded';

// ---------------------------------------------------------------------------
// Mock AsyncStorage
// ---------------------------------------------------------------------------

const asyncStorageStore: Record<string, string> = {};
const mockGetItem = jest.fn((key: string) => Promise.resolve(asyncStorageStore[key] ?? null));
const mockSetItem = jest.fn((key: string, value: string) => {
  asyncStorageStore[key] = value;
  return Promise.resolve();
});

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: (key: string) => mockGetItem(key),
    setItem: (key: string, value: string) => mockSetItem(key, value),
  },
}));

// ---------------------------------------------------------------------------
// Mock expo-updates
// ---------------------------------------------------------------------------

jest.mock('expo-updates', () => ({
  isEnabled: true,
  channel: 'eng',
  updateId: 'current-id',
  checkForUpdateAsync: jest.fn(),
  fetchUpdateAsync: jest.fn(),
  reloadAsync: jest.fn(),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeTrackSpy() {
  return jest.fn();
}

function setUpdateId(id: string | null) {
  const mod = jest.requireMock('expo-updates') as Record<string, unknown>;
  mod['updateId'] = id;
}

beforeEach(() => {
  jest.clearAllMocks();
  // Clear in-memory store
  for (const key of Object.keys(asyncStorageStore)) {
    delete asyncStorageStore[key];
  }
  setUpdateId('current-id');
});

// ---------------------------------------------------------------------------
// 5.6.8 — first launch: no persisted id → no event, persists current id
// ---------------------------------------------------------------------------

describe('first launch (no persisted ota.lastUpdateId)', () => {
  it('does not fire app_update_applied', async () => {
    const track = makeTrackSpy();
    await reportApplyIfNeeded({ track });
    expect(track).not.toHaveBeenCalled();
  });

  it('persists the current updateId', async () => {
    await reportApplyIfNeeded({});
    expect(mockSetItem).toHaveBeenCalledWith('ota.lastUpdateId', 'current-id');
  });
});

// ---------------------------------------------------------------------------
// 5.6.9 — stable launch: persisted id equals current → no event
// ---------------------------------------------------------------------------

describe('stable launch (persisted id matches current)', () => {
  it('does not fire app_update_applied', async () => {
    asyncStorageStore['ota.lastUpdateId'] = 'current-id';
    const track = makeTrackSpy();
    await reportApplyIfNeeded({ track });
    expect(track).not.toHaveBeenCalled();
  });

  it('does not write to AsyncStorage again', async () => {
    asyncStorageStore['ota.lastUpdateId'] = 'current-id';
    await reportApplyIfNeeded({});
    expect(mockSetItem).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// 5.6.10 — post-update launch: persisted differs from current → event fired, new id persisted
// ---------------------------------------------------------------------------

describe('post-update launch (persisted id differs from current)', () => {
  it('fires app_update_applied with correct payload', async () => {
    asyncStorageStore['ota.lastUpdateId'] = 'old-id';
    setUpdateId('new-id');
    const track = makeTrackSpy();

    await reportApplyIfNeeded({ track });

    expect(track).toHaveBeenCalledTimes(1);
    expect(track).toHaveBeenCalledWith('app_update_applied', {
      fromUpdateId: 'old-id',
      toUpdateId: 'new-id',
      channel: 'eng',
    });
  });

  it('persists the new updateId after firing the event', async () => {
    asyncStorageStore['ota.lastUpdateId'] = 'old-id';
    setUpdateId('new-id');

    await reportApplyIfNeeded({});

    expect(mockSetItem).toHaveBeenCalledWith('ota.lastUpdateId', 'new-id');
  });
});

// ---------------------------------------------------------------------------
// Edge: updateId is null (expo-updates not configured in dev)
// ---------------------------------------------------------------------------

describe('when Updates.updateId is null', () => {
  it('does not persist null as the updateId on first launch', async () => {
    setUpdateId(null);
    await reportApplyIfNeeded({});
    // Should not write null to storage
    expect(mockSetItem).not.toHaveBeenCalled();
  });

  it('does not fire app_update_applied if persisted exists but current is null', async () => {
    asyncStorageStore['ota.lastUpdateId'] = 'old-id';
    setUpdateId(null);
    const track = makeTrackSpy();

    await reportApplyIfNeeded({ track });

    expect(track).not.toHaveBeenCalled();
  });
});
