import { createRoundCursor } from '../createRoundCursor';

describe('createRoundCursor', () => {
  it('persists the shown index, not the next one (leaving mid-question resumes on it)', () => {
    const saved: number[] = [];
    const cursor = createRoundCursor(5, (c) => saved.push(c));
    expect(cursor.show()).toBe(5);
    expect(saved).toEqual([5]);
  });

  it('advances the stored cursor only on a correct answer', () => {
    const saved: number[] = [];
    const cursor = createRoundCursor(0, (c) => saved.push(c));
    cursor.show(); // Q0
    cursor.answered(); // Q0 done → resume at Q1
    expect(cursor.show()).toBe(1); // Q1 shown, learner leaves
    expect(saved[saved.length - 1]).toBe(1); // next visit starts at Q1, not Q2
  });

  it('skip (show without answer) moves on and stores the new question', () => {
    const saved: number[] = [];
    const cursor = createRoundCursor(3, (c) => saved.push(c));
    cursor.show();
    expect(cursor.show()).toBe(4);
    expect(saved).toEqual([3, 4]);
  });
});
