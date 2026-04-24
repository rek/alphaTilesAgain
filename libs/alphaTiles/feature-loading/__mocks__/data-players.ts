export const usePlayersStore = {
  getState: jest.fn().mockReturnValue({
    activePlayerId: null,
    players: [],
    clearActivePlayer: jest.fn(),
  }),
  persist: {
    hasHydrated: jest.fn().mockReturnValue(true),
    onFinishHydration: jest.fn(),
  },
};
