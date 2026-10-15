import { decodeThailandChallengeLevel } from './decodeThailandChallengeLevel';
import { setupThailandRound } from './setupThailandRound';

type RoundOpts = Parameters<typeof setupThailandRound>[0];

/**
 * One Thailand question for a door's challenge level: decode the 3-digit code
 * (distractor strategy, ref type, choice type), then build the 4-choice round.
 * The single entry point other features use to ask Thailand-style questions
 * (self-test, #42). Pure; `roundIndex` picks the prompt, `rng` the distractors.
 */
export function thailandQuestion({
  challengeLevel,
  ...opts
}: Omit<RoundOpts, 'refType' | 'choiceType' | 'distractorStrategy'> & { challengeLevel: number }) {
  const { distractorStrategy, refType, choiceType } = decodeThailandChallengeLevel(challengeLevel);
  const round = setupThailandRound({ ...opts, refType, choiceType, distractorStrategy });
  return { choiceType, round };
}
