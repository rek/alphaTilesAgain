import { wordsForStage } from '../wordsForStage';

const STAGES: string[][] = [
  ['a', 'b'],         // stage 1
  ['c', 'd', 'e'],    // stage 2
  [],                 // stage 3 (empty)
  ['f'],              // stage 4
  [], [], [],         // stages 5..7 empty
];

describe('wordsForStage', () => {
  it('returns the requested stage bucket', () => {
    expect(wordsForStage(STAGES, 1)).toEqual(['a', 'b']);
    expect(wordsForStage(STAGES, 2)).toEqual(['c', 'd', 'e']);
    expect(wordsForStage(STAGES, 4)).toEqual(['f']);
  });

  it('ratchets down past empty stages to the nearest non-empty one', () => {
    // stage 3 is empty → should fall back to stage 2.
    expect(wordsForStage(STAGES, 3)).toEqual(['c', 'd', 'e']);
    // stages 5/6/7 empty → fall back to stage 4.
    expect(wordsForStage(STAGES, 7)).toEqual(['f']);
  });

  it('clamps out-of-range stages into [1..N]', () => {
    expect(wordsForStage(STAGES, 0)).toEqual(['a', 'b']);
    expect(wordsForStage(STAGES, -5)).toEqual(['a', 'b']);
    expect(wordsForStage(STAGES, 99)).toEqual(['f']); // clamped to 7, ratcheted to 4
  });

  it('returns [] when wordStagesLists is empty', () => {
    expect(wordsForStage<string>([], 1)).toEqual([]);
  });

  it('returns [] when every stage is empty', () => {
    expect(wordsForStage<string>([[], [], []], 2)).toEqual([]);
  });

  it('returns a fresh array (caller may mutate without affecting source)', () => {
    const out = wordsForStage(STAGES, 1);
    out.push('z');
    expect(STAGES[0]).toEqual(['a', 'b']);
  });
});
