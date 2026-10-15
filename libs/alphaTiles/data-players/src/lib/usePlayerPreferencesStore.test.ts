// @ts-expect-error crypto.randomUUID not typed in older lib targets
global.crypto = { randomUUID: () => `uuid-${Math.random()}` };

import { usePlayerPreferencesStore } from './usePlayerPreferencesStore';
import { usePlayersStore } from './usePlayersStore';

beforeEach(() => {
  usePlayerPreferencesStore.setState({ byPlayer: {} });
  usePlayersStore.setState({ players: [], activePlayerId: null });
});

test('setPreference stores a sparse entry per player', () => {
  usePlayerPreferencesStore.getState().setPreference('p1', { showGameNames: false });
  expect(usePlayerPreferencesStore.getState().byPlayer).toEqual({ p1: { showGameNames: false } });
});

test('setPreference merges into the existing entry', () => {
  const { setPreference } = usePlayerPreferencesStore.getState();
  setPreference('p1', { showGameNames: false });
  setPreference('p1', { showGameNames: true });
  setPreference('p2', {});
  expect(usePlayerPreferencesStore.getState().byPlayer).toEqual({
    p1: { showGameNames: true },
    p2: {},
  });
});

test('deletePlayer forgets that player\'s preferences only', () => {
  const a = usePlayersStore.getState().createPlayer({ name: 'A', avatarIndex: 0 });
  const b = usePlayersStore.getState().createPlayer({ name: 'B', avatarIndex: 1 });
  const { setPreference } = usePlayerPreferencesStore.getState();
  setPreference(a.id, { showGameNames: false });
  setPreference(b.id, { showGameNames: false });
  usePlayersStore.getState().deletePlayer(a.id);
  expect(usePlayerPreferencesStore.getState().byPlayer).toEqual({ [b.id]: { showGameNames: false } });
});

test('uses its own versioned persist key', () => {
  const api = usePlayerPreferencesStore as unknown as { persist: { getOptions: () => { name?: string } } };
  expect(api.persist.getOptions().name).toBe('alphatiles:player-preferences-v1');
});
