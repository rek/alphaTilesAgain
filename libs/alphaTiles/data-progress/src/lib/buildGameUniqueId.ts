// Matches Java: className + challengeLevel + playerString + syllableGame + stage
// where className = country (portable — no package prefix).
// Example: buildGameUniqueId({ country:'China', challengeLevel:1, playerId:'player01', syllableGame:'', stage:1 })
//          → 'China1player011'
export function buildGameUniqueId(opts: {
  country: string;
  challengeLevel: number;
  playerId: string;
  syllableGame: string;
  stage: number;
}): string {
  const { country, challengeLevel, playerId, syllableGame, stage } = opts;
  return `${country}${challengeLevel}${playerId}${syllableGame}${stage}`;
}
