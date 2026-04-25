export const TYPES = [
  'TILE_LOWER',
  'TILE_UPPER',
  'TILE_AUDIO',
  'WORD_TEXT',
  'WORD_IMAGE',
  'WORD_AUDIO',
  'SYLLABLE_TEXT',
  'SYLLABLE_AUDIO',
] as const;

export type ThailandType = (typeof TYPES)[number];

export type ThailandChallengeLevel = {
  distractorStrategy: 1 | 2 | 3;
  refType: ThailandType;
  choiceType: ThailandType;
};

export function decodeThailandChallengeLevel(challengeLevel: number): ThailandChallengeLevel {
  const clStr = String(challengeLevel).padStart(3, '0');
  const distractorStrategy = Math.max(1, Math.min(3, Number(clStr[0]))) as 1 | 2 | 3;
  const refIdx = Number(clStr[1]) - 1;
  const choiceIdx = Number(clStr[2]) - 1;

  const refType = TYPES[refIdx] ?? TYPES[0];
  const choiceType = TYPES[choiceIdx] ?? TYPES[0];

  return { distractorStrategy, refType, choiceType };
}
