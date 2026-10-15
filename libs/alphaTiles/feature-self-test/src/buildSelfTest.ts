import type { Door } from '@alphaTiles/data-doors';
import { thailandQuestion } from '@alphaTiles/feature-game-thailand';
import type { ThailandRef, ThailandRound, ThailandType } from '@alphaTiles/feature-game-thailand';
import { selfTestSources } from './selfTestSources';

type Content = Pick<Parameters<typeof thailandQuestion>[0], 'tiles' | 'words' | 'syllables'>;

/** Questions per run (issue #42 mock: "8 / 10"). */
export const SELF_TEST_LENGTH = 10;
/** Tries per question to find a prompt not yet used in this run. */
const MAX_PROMPT_TRIES = 6;

function promptKey(ref: ThailandRef) {
  if (ref.kind === 'tile') return `tile:${ref.tileRow.base}`;
  if (ref.kind === 'word') return `word:${ref.wordRow.wordInLWC}`;
  return `syllable:${ref.syllableRow.syllable}`;
}

/**
 * Builds one self-test run (design D1, D2): up to `count` single-answer
 * questions from Thailand's 4-choice question builder, one per source door in
 * turn — the pack's enabled Thailand Doors, in the order given (pass ladder
 * order). Prompts start at a random offset so runs differ and don't repeat
 * within a run; rounds the pack can't fill are dropped. No source door → [].
 *
 * Pure: no store, no audio. The self-test never records anything (D5).
 */
export function buildSelfTest({
  doors,
  tiles,
  words,
  syllables,
  count = SELF_TEST_LENGTH,
  rng = Math.random,
}: Content & {
  doors: Door[];
  count?: number;
  rng?: () => number;
}) {
  const sources = selfTestSources(doors);
  if (sources.length === 0) return [];

  const start = Math.floor(rng() * 10_000);
  const used = new Set<string>();
  const questions: { doorIndex: number; choiceType: ThailandType; round: ThailandRound }[] = [];

  for (let i = 0; i < count; i++) {
    const door = sources[i % sources.length];
    let picked: { choiceType: ThailandType; round: ThailandRound } | null = null;
    for (let attempt = 0; attempt < MAX_PROMPT_TRIES; attempt++) {
      const { choiceType, round } = thailandQuestion({
        challengeLevel: door.challengeLevel,
        tiles,
        words,
        syllables,
        roundIndex: start + i + attempt * count,
        rng,
      });
      if ('error' in round) break;
      // Keep the first buildable round as a fallback; prefer an unused prompt.
      if (picked === null || !used.has(promptKey(round.ref))) picked = { choiceType, round };
      if (!used.has(promptKey(round.ref))) break;
    }
    if (picked === null) continue;
    used.add(promptKey(picked.round.ref));
    questions.push({ doorIndex: door.index, ...picked });
  }
  return questions;
}

export type SelfTestQuestion = ReturnType<typeof buildSelfTest>[number];
