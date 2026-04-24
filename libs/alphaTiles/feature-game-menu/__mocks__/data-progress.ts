export const buildGameUniqueId = jest.fn(
  ({ country, challengeLevel, playerId, syllableGame, stage }: Record<string, unknown>) =>
    `${playerId}|${country}|${challengeLevel}|${syllableGame}|${stage}`,
);
export const useProgressStore = jest.fn();
