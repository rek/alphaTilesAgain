// Ports GameActivity.java:261–274 verbatim.
export function displayChallengeLevel(country: string, challengeLevel: number): number {
  let displayed = challengeLevel;

  if (country === 'Thailand') {
    displayed = Math.floor(challengeLevel / 100);
  }
  if (country === 'Brazil' && challengeLevel > 3 && challengeLevel !== 7) {
    displayed = displayed - 3;
  }
  if (country === 'Georgia' && challengeLevel > 6) {
    displayed = displayed - 6;
  }

  return displayed;
}
