import type { SelfTestQuestion } from './buildSelfTest';

/**
 * The learner's own score: answers (chosen choice index per question, in
 * order) that hit the correct choice, out of the run's length. Unanswered
 * questions count as not correct. Never stored (design D5).
 */
export function selfTestScore({
  questions,
  answers,
}: {
  questions: SelfTestQuestion[];
  answers: number[];
}) {
  const correct = questions.filter((q, i) => answers[i] === q.round.correctIndex).length;
  return { correct, total: questions.length };
}
