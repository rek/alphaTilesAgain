import { resolveEntryRoute } from '../resolveEntryRoute';
import { usePlayersStore } from '@alphaTiles/data-players';

jest.mock('@alphaTiles/data-players', () => ({
  usePlayersStore: {
    getState: jest.fn(),
  },
}));

const mockGetState = usePlayersStore.getState as jest.Mock;

describe('resolveEntryRoute', () => {
  it('returns /menu when activePlayerId matches a player', () => {
    mockGetState.mockReturnValue({
      activePlayerId: 'p1',
      players: [{ id: 'p1', name: 'Alice', avatarIndex: 0 }],
    });
    expect(resolveEntryRoute()).toBe('/menu');
  });

  it('returns /choose-player when activePlayerId is null', () => {
    mockGetState.mockReturnValue({
      activePlayerId: null,
      players: [],
    });
    expect(resolveEntryRoute()).toBe('/choose-player');
  });

  it('returns /choose-player when activePlayerId is stale (not in players list)', () => {
    mockGetState.mockReturnValue({
      activePlayerId: 'stale-id',
      players: [{ id: 'other-id', name: 'Bob', avatarIndex: 1 }],
    });
    expect(resolveEntryRoute()).toBe('/choose-player');
  });
});
