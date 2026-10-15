import { displayChallengeLevel } from './displayChallengeLevel';

describe('displayChallengeLevel', () => {
  it('Thailand divides by 100 (floor)', () => {
    expect(displayChallengeLevel('Thailand', 213)).toBe(2);
  });

  it('Brazil > 3 subtracts 3', () => {
    expect(displayChallengeLevel('Brazil', 5)).toBe(2);
  });

  it('Brazil === 7 is unchanged (special case)', () => {
    expect(displayChallengeLevel('Brazil', 7)).toBe(7);
  });

  it('Brazil <= 3 is unchanged', () => {
    expect(displayChallengeLevel('Brazil', 3)).toBe(3);
  });

  it('Georgia > 6 subtracts 6', () => {
    expect(displayChallengeLevel('Georgia', 9)).toBe(3);
  });

  it('Georgia <= 6 is unchanged', () => {
    expect(displayChallengeLevel('Georgia', 6)).toBe(6);
  });

  it('China unchanged', () => {
    expect(displayChallengeLevel('China', 1)).toBe(1);
  });
});
