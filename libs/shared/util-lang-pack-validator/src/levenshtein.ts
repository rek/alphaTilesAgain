/**
 * Levenshtein word-distance — direct port from FilePresence.java.
 *
 * Java reference: FilePresence.java#wordDistance (Baeldung DP implementation)
 */
export function wordDistance(x: string, y: string): number {
  const dp: number[][] = [];
  for (let i = 0; i <= x.length; i++) {
    dp[i] = [];
    for (let j = 0; j <= y.length; j++) {
      if (i === 0) {
        dp[i][j] = j;
      } else if (j === 0) {
        dp[i][j] = i;
      } else {
        const sub = x[i - 1] === y[j - 1] ? 0 : 1;
        dp[i][j] = Math.min(
          dp[i - 1][j - 1] + sub,
          dp[i - 1][j] + 1,
          dp[i][j - 1] + 1,
        );
      }
    }
  }
  return dp[x.length][y.length];
}
