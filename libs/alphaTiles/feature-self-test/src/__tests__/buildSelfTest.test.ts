/**
 * Self-test run built from the REAL yue pack (languages/yue), through the
 * module interface: buildSelfTest + selfTestScore.
 */
import * as fs from 'fs';
import * as path from 'path';
import {
  parseColors,
  parseGames,
  parseGametiles,
  parseSettings,
  parseSyllables,
  parseWordlist,
} from '@shared/util-lang-pack-parser';
import { doorsOf, ladderOrder } from '@alphaTiles/data-doors';
import { buildSelfTest, SELF_TEST_LENGTH } from '../buildSelfTest';
import { selfTestScore } from '../selfTestScore';

const YUE = path.resolve(__dirname, '../../../../../languages/yue');
const read = (f: string) => fs.readFileSync(path.join(YUE, f), 'utf8');

function seeded(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const games = parseGames(read('aa_games.txt'));
const doors = ladderOrder(
  doorsOf({
    games,
    colors: parseColors(read('aa_colors.txt')),
    settings: parseSettings(read('aa_settings.txt')),
    strokes: {},
    audio: { instructions: {} },
  }),
);
const content = {
  tiles: parseGametiles(read('aa_gametiles.txt')).rows,
  words: parseWordlist(read('aa_wordlist.txt')).rows,
  syllables: parseSyllables(read('aa_syllables.txt')).rows,
};

function promptOf(q: ReturnType<typeof buildSelfTest>[number]) {
  const ref = q.round.ref;
  if (ref.kind === 'tile') return `tile:${ref.tileRow.base}`;
  if (ref.kind === 'word') return `word:${ref.wordRow.wordInLWC}`;
  return `syllable:${ref.syllableRow.syllable}`;
}

describe('buildSelfTest — real yue pack', () => {
  it.each([1, 2, 3, 42, 2026])('seed %i: 10 well-formed questions, no repeated prompt', (seed) => {
    const run = buildSelfTest({ doors, ...content, rng: seeded(seed) });

    expect(run).toHaveLength(SELF_TEST_LENGTH);
    for (const q of run) {
      expect(q.round.choices).toHaveLength(4);
      expect(q.round.correctIndex).toBeGreaterThanOrEqual(0);
      expect(q.round.correctIndex).toBeLessThan(4);
      const ids = q.round.choices.map((c) =>
        c.kind === 'tile' ? c.tileRow.base : c.kind === 'word' ? c.wordRow.wordInLWC : c.syllableRow.syllable,
      );
      expect(new Set(ids).size).toBe(4);
    }
    expect(new Set(run.map(promptOf)).size).toBe(run.length);
  });

  it('draws only from Thailand doors, cycling them in ladder order', () => {
    const thailand = doors.filter((d) => d.classKey === 'thailand').map((d) => d.index);
    const run = buildSelfTest({ doors, ...content, rng: seeded(7) });
    expect(run.map((q) => q.doorIndex)).toEqual(
      Array.from({ length: SELF_TEST_LENGTH }, (_, i) => thailand[i % thailand.length]),
    );
  });

  it('mixes question types (ref → choice pairings)', () => {
    const run = buildSelfTest({ doors, ...content, rng: seeded(9) });
    const pairings = new Set(run.map((q) => `${q.round.ref.display}->${q.choiceType}`));
    expect(pairings.size).toBeGreaterThanOrEqual(3);
  });

  it('runs differ between attempts', () => {
    const a = buildSelfTest({ doors, ...content, rng: seeded(1) }).map(promptOf);
    const b = buildSelfTest({ doors, ...content, rng: seeded(2) }).map(promptOf);
    expect(a).not.toEqual(b);
  });

  it('is empty when the pack has no enabled Thailand door', () => {
    const others = doors.filter((d) => d.classKey !== 'thailand');
    expect(buildSelfTest({ doors: others, ...content })).toEqual([]);
    const hidden = doors.map((d) => ({ ...d, enabled: false }));
    expect(buildSelfTest({ doors: hidden, ...content })).toEqual([]);
  });
});

describe('selfTestScore', () => {
  const run = buildSelfTest({ doors, ...content, rng: seeded(5) });
  const right = run.map((q) => q.round.correctIndex);
  const wrong = (i: number) => (run[i].round.correctIndex + 1) % 4;

  it('all correct → 10 / 10', () => {
    expect(selfTestScore({ questions: run, answers: right })).toEqual({ correct: 10, total: 10 });
  });

  it('two wrong → 8 / 10', () => {
    const answers = right.map((a, i) => (i === 3 || i === 7 ? wrong(i) : a));
    expect(selfTestScore({ questions: run, answers })).toEqual({ correct: 8, total: 10 });
  });

  it('unanswered questions are not correct', () => {
    expect(selfTestScore({ questions: run, answers: right.slice(0, 4) })).toEqual({ correct: 4, total: 10 });
  });
});
