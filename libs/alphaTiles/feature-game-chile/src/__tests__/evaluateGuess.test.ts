import { evaluateGuess, countGreens } from '../evaluateGuess';

describe('evaluateGuess', () => {
  it('all GREEN when guess matches secret exactly', () => {
    const result = evaluateGuess(['c', 'a', 't'], ['c', 'a', 't']);
    expect(result.map((r) => r.color)).toEqual(['GREEN', 'GREEN', 'GREEN']);
    expect(countGreens(result)).toBe(3);
  });

  it('all GRAY when no tiles match', () => {
    const result = evaluateGuess(['d', 'o', 'g'], ['c', 'a', 't']);
    expect(result.map((r) => r.color)).toEqual(['GRAY', 'GRAY', 'GRAY']);
  });

  it('BLUE for correct tile in wrong position', () => {
    // secret: ['c','a','t'], guess: ['a','c','t']
    // i=0: secret[0]='c' — guess[0]='a' != 'c'; scan: guess[1]='c'==secret[0], 'c'!='a'(secret[1]), frontCor[0] false, correct[1]==0 → correct[1]=2 (BLUE), frontCor[0]=true
    // i=1: secret[1]='a' — guess[1]='c' != 'a'; scan: guess[0]='a'==secret[1], 'a'!='c'(secret[0]), frontCor[1] false, correct[0]==0 → correct[0]=2 (BLUE), frontCor[1]=true
    // i=2: secret[2]='t' — guess[2]='t' == 't' → GREEN
    const result = evaluateGuess(['a', 'c', 't'], ['c', 'a', 't']);
    expect(result[0].color).toBe('BLUE');  // 'a' in secret but at position 1
    expect(result[1].color).toBe('BLUE');  // 'c' in secret but at position 0
    expect(result[2].color).toBe('GREEN'); // 't' exact match
  });

  it('duplicate tile in guess: only one BLUE for single secret occurrence', () => {
    // secret: ['c','a','t'], guess: ['a','a','t']
    // i=0: secret[0]='c' — no 'c' in guess → no BLUE
    // i=1: secret[1]='a' — guess[1]='a' != secret[1]... wait guess[1]='a'==secret[1] → GREEN
    // Actually secret[1]='a', guess[1]='a' → GREEN
    // i=0: secret[0]='c' — no match
    // i=2: secret[2]='t' → guess[2]='t' → GREEN
    // guess[0]='a' stays GRAY (correct[0] never set)
    const result = evaluateGuess(['a', 'a', 't'], ['c', 'a', 't']);
    expect(result[0].color).toBe('GRAY');  // 'a' appears at correct pos 1 already, this one not matched
    expect(result[1].color).toBe('GREEN'); // 'a' exact
    expect(result[2].color).toBe('GREEN'); // 't' exact
  });

  it('BLUE not assigned twice for the same secret tile position', () => {
    // secret: ['a','b','c'], guess: ['b','b','b']
    // i=0: secret[0]='a' — no 'a' in guess → nothing
    // i=1: secret[1]='b' — guess[1]='b'==secret[1] → GREEN (correct[1]=1)
    // i=2: secret[2]='c' — no 'c' in guess → nothing
    // guess[0]='b': correct[0] never set → GRAY
    // guess[2]='b': correct[2] never set → GRAY
    const result = evaluateGuess(['b', 'b', 'b'], ['a', 'b', 'c']);
    expect(result[0].color).toBe('GRAY');
    expect(result[1].color).toBe('GREEN');
    expect(result[2].color).toBe('GRAY');
  });

  it('preserves tile text in result', () => {
    const result = evaluateGuess(['ba', 'na', 'na'], ['ba', 'na', 'na']);
    expect(result.map((r) => r.text)).toEqual(['ba', 'na', 'na']);
  });

  it('all green for multi-char tiles', () => {
    const result = evaluateGuess(['ba', 'na', 'na'], ['ba', 'na', 'na']);
    expect(result.map((r) => r.color)).toEqual(['GREEN', 'GREEN', 'GREEN']);
    expect(countGreens(result)).toBe(3);
  });

  it('mixed: some GREEN, some BLUE, some GRAY', () => {
    // secret: ['a','b','c','d'], guess: ['b','a','d','e']
    // i=0: secret[0]='a' — guess[0]='b'!='a'; scan: guess[1]='a'==secret[0], 'a'!='b'(secret[1]), frontCor[0] false, correct[1]==0 → correct[1]=2(BLUE), frontCor[0]=true
    // i=1: secret[1]='b' — guess[1]='a'!='b'; scan: guess[0]='b'==secret[1], 'b'!='a'(secret[0]), frontCor[1] false, correct[0]==0 → correct[0]=2(BLUE), frontCor[1]=true
    // i=2: secret[2]='c' — guess[2]='d'!='c'; scan: no 'd'!='c'... no 'c' in guess → nothing
    // i=3: secret[3]='d' — guess[3]='e'!='d'; scan: guess[2]='d'==secret[3], 'd'!='c'(secret[2]), frontCor[3] false, correct[2]==0 → correct[2]=2(BLUE), frontCor[3]=true
    // result: BLUE, BLUE, BLUE, GRAY
    const result = evaluateGuess(['b', 'a', 'd', 'e'], ['a', 'b', 'c', 'd']);
    expect(result[0].color).toBe('BLUE');
    expect(result[1].color).toBe('BLUE');
    expect(result[2].color).toBe('BLUE');
    expect(result[3].color).toBe('GRAY');
  });
});
